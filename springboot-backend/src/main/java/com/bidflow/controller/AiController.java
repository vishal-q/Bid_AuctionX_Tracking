package com.bidflow.controller;

import com.bidflow.model.Bid;
import com.bidflow.repository.BidRepository;
import com.bidflow.security.AuthHelper;
import com.bidflow.service.GeminiService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final BidRepository bidRepository;
    private final GeminiService geminiService;
    private final AuthHelper authHelper;
    private final MongoTemplate mongoTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule())
            .disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    private static final DateTimeFormatter DATE_FMT =
        DateTimeFormatter.ofPattern("MM/dd/yyyy").withZone(ZoneId.systemDefault());

    // ── AI Chat ───────────────────────────────────────────────────────────────
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, String> body) {
        String message = body.get("message");
        if (message == null || message.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Message required"));

        // First try smart fallback — handles most queries instantly without API
        String smartReply = chatFallback(message);
        if (smartReply != null) {
            return ResponseEntity.ok(Map.of("reply", smartReply));
        }

        // For general/complex questions — try HF API
        try {
            long total = bidRepository.count();
            long won = bidRepository.countByStatus("won");
            long lost = bidRepository.countByStatus("lost");
            long pending = bidRepository.countByStatus("awaiting_approval");

            Query hpQuery = new Query(Criteria.where("priority").is("high")
                .and("status").nin("won", "lost")).limit(5);
            List<Bid> highPriority = mongoTemplate.find(hpQuery, Bid.class);

            Query recentQuery = new Query().with(
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")
            ).limit(8);
            List<Bid> recentBids = mongoTemplate.find(recentQuery, Bid.class);

            String bidContext = recentBids.stream().map(b ->
                "- " + b.getTitle() + " | Client: " + b.getClientName() + " | Status: " + b.getStatus()
                + " | Priority: " + b.getPriority() + " | Value: $" + String.format("%,.0f", b.getValue() != null ? b.getValue() : 0)
            ).collect(Collectors.joining("\n"));

            String prompt = "[INST] You are BidNova AuctionX Tracking, a helpful assistant for an industrial bid management platform.\n\n"
                + "Current system stats: Total bids=" + total + ", Won=" + won + ", Lost=" + lost + ", Pending=" + pending + "\n"
                + "Recent bids:\n" + bidContext + "\n\n"
                + "Answer this question helpfully and concisely (under 100 words). Use emojis occasionally.\n"
                + "Question: " + message + " [/INST]";

            String reply = geminiService.askGemini(prompt);
            if (reply != null && !reply.isBlank()) {
                return ResponseEntity.ok(Map.of("reply", reply.trim()));
            }
        } catch (Exception ignored) {}

        // Final fallback
        return ResponseEntity.ok(Map.of("reply", generalFallback(message)));
    }

    // ── Sentiment Analysis ────────────────────────────────────────────────────
    @PostMapping("/sentiment")
    public ResponseEntity<?> analyzeSentiment(@RequestBody Map<String, String> body) {
        String text = body.get("text");
        if (text == null || text.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Text required"));
        try {
            String prompt = "Analyze the sentiment of this client message from a business/industrial bid context.\n\n"
                + "Message: \"" + text + "\"\n\n"
                + "Respond in this exact JSON format only (no markdown, no extra text):\n"
                + "{\"sentiment\":\"positive\",\"confidence\":85,\"keywords\":[\"keyword1\",\"keyword2\",\"keyword3\"],\"summary\":\"One sentence explanation\"}\n\n"
                + "Sentiment must be exactly one of: positive, neutral, negative\n"
                + "Confidence is 0-100 integer.";
            String raw = geminiService.askGemini(prompt);
            String jsonStr = extractJson(raw, "{");
            if (jsonStr != null) {
                return ResponseEntity.ok(objectMapper.readValue(jsonStr, Map.class));
            }
            throw new RuntimeException("Invalid JSON response");
        } catch (Exception e) {
            return ResponseEntity.ok(sentimentFallback(text));
        }
    }

    // ── Summarize text ────────────────────────────────────────────────────────
    @PostMapping("/summary-text")
    public ResponseEntity<?> summarizeText(@RequestBody Map<String, String> body) {
        String text = body.get("text");
        if (text == null || text.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Text required"));
        try {
            String prompt = "Summarize this bid or proposal text for a bid manager.\n\nText:\n" + text
                + "\n\nReturn a concise executive summary with risks and next steps in under 150 words.";
            String summary = geminiService.askGemini(prompt);
            return ResponseEntity.ok(Map.of("summary", summary.trim()));
        } catch (Exception e) {
            String[] words = text.split("\\s+");
            String short_ = String.join(" ", Arrays.copyOfRange(words, 0, Math.min(45, words.length)));
            String summary = short_ + (words.length > 45 ? "..." : "")
                + "\n\nKey risks and next steps should be reviewed by the bid owner before submission.";
            return ResponseEntity.ok(Map.of("summary", summary));
        }
    }

    // ── Proposal Summary ──────────────────────────────────────────────────────
    @PostMapping("/summary/{bidId}")
    public ResponseEntity<?> generateSummary(@PathVariable String bidId) {
        Bid bid = bidRepository.findById(bidId).orElse(null);
        if (bid == null) return ResponseEntity.status(404).body(Map.of("message", "Bid not found"));
        try {
            String prompt = "You are a professional bid analyst. Generate a concise executive summary for this industrial bid:\n\n"
                + "Bid Title: " + bid.getTitle() + "\n"
                + "Client: " + bid.getClientName() + "\n"
                + "Value: $" + String.format("%,.0f", bid.getValue() != null ? bid.getValue() : 0) + "\n"
                + "Status: " + (bid.getStatus() != null ? bid.getStatus().replace("_"," ") : "N/A") + "\n"
                + "Priority: " + bid.getPriority() + "\n"
                + "Deadline: " + (bid.getDeadline() != null ? DATE_FMT.format(bid.getDeadline()) : "Not set") + "\n"
                + "Department: " + (bid.getDepartment() != null ? bid.getDepartment() : "N/A") + "\n"
                + "Description: " + (bid.getDescription() != null ? bid.getDescription() : "No description provided") + "\n\n"
                + "Write a 3-4 sentence professional executive summary covering: scope, value proposition, current status, and key considerations. Be concise and business-focused.";
            String summary = geminiService.askGemini(prompt);
            bid.setAiSummary(summary.trim());
            bidRepository.save(bid);
            return ResponseEntity.ok(Map.of("summary", summary.trim()));
        } catch (Exception e) {
            String summary = "This bid (" + bid.getBidNumber() + ") covers " + bid.getTitle() + " for " + bid.getClientName()
                + ". Total value: $" + String.format("%,.0f", bid.getValue() != null ? bid.getValue() : 0)
                + ". Current status: " + (bid.getStatus() != null ? bid.getStatus().replace("_"," ") : "N/A")
                + ". Priority: " + bid.getPriority() + ".";
            return ResponseEntity.ok(Map.of("summary", summary));
        }
    }

    // ── Win Probability ───────────────────────────────────────────────────────
    @GetMapping("/predict/{bidId}")
    public ResponseEntity<?> predictWinProbability(@PathVariable String bidId) {
        Bid bid = bidRepository.findById(bidId).orElse(null);
        if (bid == null) return ResponseEntity.status(404).body(Map.of("message", "Bid not found"));
        try {
            String prompt = "You are an AI bid analyst. Predict the win probability for this industrial bid.\n\n"
                + "Bid: " + bid.getTitle() + "\n"
                + "Client: " + bid.getClientName() + "\n"
                + "Value: $" + String.format("%,.0f", bid.getValue() != null ? bid.getValue() : 0) + "\n"
                + "Status: " + (bid.getStatus() != null ? bid.getStatus().replace("_"," ") : "N/A") + "\n"
                + "Priority: " + bid.getPriority() + "\n"
                + "Progress: " + bid.getProgress() + "%\n"
                + "Client Sentiment: " + (bid.getClientSentiment() != null ? bid.getClientSentiment() : "unknown") + "\n"
                + "Deadline: " + (bid.getDeadline() != null ? DATE_FMT.format(bid.getDeadline()) : "Not set") + "\n\n"
                + "Respond with ONLY a JSON object like this (no markdown):\n"
                + "{\"probability\":75,\"reasoning\":\"Brief 1-sentence reason\"}\n\n"
                + "Probability must be integer 0-100.";
            String raw = geminiService.askGemini(prompt);
            String jsonStr = extractJson(raw, "{");
            if (jsonStr != null) {
                Map result = objectMapper.readValue(jsonStr, Map.class);
                int prob = ((Number) result.get("probability")).intValue();
                bid.setAiWinProbability(prob);
                bidRepository.save(bid);
                return ResponseEntity.ok(result);
            }
            throw new RuntimeException("Invalid response");
        } catch (Exception e) {
            int score = 50;
            if (bid.getValue() != null && bid.getValue() > 500000) score += 10;
            if ("high".equals(bid.getPriority())) score += 15;
            if ("negotiation".equals(bid.getStatus())) score += 20;
            if ("positive".equals(bid.getClientSentiment())) score += 10;
            score = Math.min(95, Math.max(10, score));
            bid.setAiWinProbability(score);
            bidRepository.save(bid);
            return ResponseEntity.ok(Map.of("probability", score));
        }
    }

    // ── Smart Priority ────────────────────────────────────────────────────────
    @PostMapping("/priority/{bidId}")
    public ResponseEntity<?> assignPriority(@PathVariable String bidId) {
        Bid bid = bidRepository.findById(bidId).orElse(null);
        if (bid == null) return ResponseEntity.status(404).body(Map.of("message", "Bid not found"));
        try {
            String prompt = "Assign priority (high/medium/low) for this industrial bid:\n"
                + "Value: $" + String.format("%,.0f", bid.getValue() != null ? bid.getValue() : 0) + "\n"
                + "Deadline: " + (bid.getDeadline() != null ? DATE_FMT.format(bid.getDeadline()) : "None") + "\n"
                + "Status: " + bid.getStatus() + "\n"
                + "Client: " + bid.getClientName() + "\n\n"
                + "Respond ONLY with JSON: {\"priority\":\"high\",\"reason\":\"brief reason\"}";
            String raw = geminiService.askGemini(prompt);
            String jsonStr = extractJson(raw, "{");
            String priority = "medium";
            if (jsonStr != null) {
                Map result = objectMapper.readValue(jsonStr, Map.class);
                priority = (String) result.get("priority");
            }
            bid.setPriority(priority);
            bidRepository.save(bid);
            return ResponseEntity.ok(Map.of("priority", priority, "bidId", bidId));
        } catch (Exception e) {
            String priority = "medium";
            if (bid.getValue() != null && bid.getValue() > 500000) priority = "high";
            else if (bid.getValue() != null && bid.getValue() < 100000) priority = "low";
            if (bid.getDeadline() != null) {
                long daysUntil = (bid.getDeadline().toEpochMilli() - Instant.now().toEpochMilli()) / 86400000;
                if (daysUntil < 14) priority = "high";
            }
            bid.setPriority(priority);
            bidRepository.save(bid);
            return ResponseEntity.ok(Map.of("priority", priority));
        }
    }

    // ── Recommendations ───────────────────────────────────────────────────────
    @GetMapping("/recommendations/{bidId}")
    public ResponseEntity<?> getRecommendations(@PathVariable String bidId) {
        Bid bid = bidRepository.findById(bidId).orElse(null);
        if (bid == null) return ResponseEntity.status(404).body(Map.of("message", "Bid not found"));
        try {
            String prompt = "Give 4 actionable recommendations to improve win chances for this industrial bid:\n"
                + "Title: " + bid.getTitle() + "\n"
                + "Client: " + bid.getClientName() + "\n"
                + "Value: $" + String.format("%,.0f", bid.getValue() != null ? bid.getValue() : 0) + "\n"
                + "Status: " + (bid.getStatus() != null ? bid.getStatus().replace("_"," ") : "N/A") + "\n"
                + "Priority: " + bid.getPriority() + "\n\n"
                + "Respond ONLY with JSON array: [\"recommendation 1\",\"recommendation 2\",\"recommendation 3\",\"recommendation 4\"]";
            String raw = geminiService.askGemini(prompt);
            String jsonStr = extractJson(raw, "[");
            if (jsonStr != null) {
                List recommendations = objectMapper.readValue(jsonStr, List.class);
                return ResponseEntity.ok(Map.of("recommendations", recommendations));
            }
            throw new RuntimeException("Invalid response");
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("recommendations", List.of(
                "Consider offering a 5% early payment discount to improve win probability",
                "Similar bids in this value range won with a technical support package",
                "Client prefers detailed milestone-based payment structure",
                "Competitor pricing is typically 8-12% lower — adjust value proposition"
            )));
        }
    }

    // ── Duplicate Detection ───────────────────────────────────────────────────
    @PostMapping("/duplicates")
    public ResponseEntity<?> detectDuplicates(@RequestBody Map<String, String> body) {
        String title = body.getOrDefault("title", "");
        String clientName = body.getOrDefault("clientName", "");
        String firstWord = title.split(" ")[0];

        Query query = new Query(new Criteria().orOperator(
            Criteria.where("title").regex(firstWord, "i"),
            Criteria.where("clientName").regex(clientName, "i")
        )).limit(5);
        List<Bid> similar = mongoTemplate.find(query, Bid.class);
        return ResponseEntity.ok(Map.of("duplicates", similar));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private String extractJson(String raw, String startChar) {
        if (raw == null) return null;
        int start = raw.indexOf(startChar);
        if (start == -1) return null;
        String endChar = startChar.equals("{") ? "}" : "]";
        int end = raw.lastIndexOf(endChar);
        if (end == -1 || end < start) return null;
        return raw.substring(start, end + 1);
    }

    private String chatFallback(String message) {
        String lower = message.toLowerCase().trim();
        try {
            // ── Greetings ──────────────────────────────────────────────────────
            if (lower.matches("^(hi|hello|hey|howdy|hii+|helo|hiya|sup|yo)\\b.*"))
                return "👋 Hello! I'm BidNova AuctionX Tracking, your intelligent bid management assistant. I can help you track bids, analyze revenue, check priorities, and answer general questions. What would you like to know?";
            if (lower.contains("how are you") || lower.contains("how r u") || lower.contains("kaisa") || lower.contains("kaise ho"))
                return "😊 I'm doing great, thanks for asking! Always ready to help you manage your bids efficiently. What can I do for you today?";
            if (lower.contains("good morning")) return "🌅 Good morning! Hope you have a productive day. How can I help with your bids today?";
            if (lower.contains("good evening")) return "🌆 Good evening! How can I assist you with your bids?";
            if (lower.contains("good night")) return "🌙 Good night! See you tomorrow. Your bids are safe with BidNova AuctionX Tracking!";
            if (lower.contains("thank") || lower.contains("thanks") || lower.contains("shukriya") || lower.contains("dhanyawad"))
                return "😊 You're welcome! Feel free to ask me anything anytime.";
            if (lower.contains("bye") || lower.contains("goodbye") || lower.contains("alvida") || lower.contains("tata"))
                return "👋 Goodbye! Come back anytime you need help. Good luck with your bids!";
            if (lower.contains("who are you") || lower.contains("what are you") || lower.contains("introduce yourself"))
                return "🤖 I'm **BidNova AuctionX Tracking** — your intelligent assistant for managing industrial bids. I help track bid lifecycles, predict win probabilities, analyze client sentiment, and provide real-time insights. I'm powered by AI and always here to help!";
            if (lower.contains("what can you do") || lower.contains("help me") || lower.contains("features") || lower.contains("capabilities"))
                return "🤖 I can help you with:\n• 📋 Bid status & tracking\n• 💰 Revenue & win rate stats\n• 🔴 High priority alerts\n• 📊 Analytics & insights\n• 🤝 Negotiation tracking\n• 💡 General questions\n\nJust ask me anything!";

            // ── Bid-specific queries ───────────────────────────────────────────
            if (lower.contains("pending") || lower.contains("awaiting") || lower.contains("approval")) {
                long count = bidRepository.countByStatus("awaiting_approval");
                return "📋 There are currently **" + count + " bid(s)** awaiting approval.";
            }
            if (lower.contains("high priority") || lower.contains("urgent") || lower.contains("critical")) {
                Query q = new Query(Criteria.where("priority").is("high").and("status").nin("won","lost"));
                List<Bid> bids = mongoTemplate.find(q, Bid.class);
                if (bids.isEmpty()) return "✅ No high priority active bids right now. All clear!";
                String list = bids.stream().limit(5).map(b -> "• " + b.getTitle() + " — " + b.getClientName()).collect(Collectors.joining("\n"));
                return "🔴 **" + bids.size() + " high priority bid(s):**\n" + list;
            }
            if ((lower.contains("won") || lower.contains("win")) && !lower.contains("not") && !lower.contains("rate")) {
                long count = bidRepository.countByStatus("won");
                return "🏆 You have **" + count + " won bid(s)** in the system. Great work!";
            }
            if (lower.contains("lost") || lower.contains("lose")) {
                long count = bidRepository.countByStatus("lost");
                return "❌ There are **" + count + " lost bid(s)**. Review them to improve future strategies.";
            }
            if (lower.contains("total") || lower.contains("how many") || lower.contains("all bids") || lower.contains("count")) {
                long t = bidRepository.count();
                long w = bidRepository.countByStatus("won");
                long l = bidRepository.countByStatus("lost");
                return "📊 **Bid Summary:**\n• Total: " + t + "\n• Won: " + w + "\n• Lost: " + l + "\n• Active: " + (t - w - l);
            }
            if (lower.contains("win rate") || lower.contains("success rate") || lower.contains("winning")) {
                long t = bidRepository.count();
                long w = bidRepository.countByStatus("won");
                long rate = t > 0 ? Math.round((w * 100.0) / t) : 0;
                return "📈 Current win rate is **" + rate + "%** (" + w + " won out of " + t + " total bids).";
            }
            if (lower.contains("revenue") || lower.contains("earning") || lower.contains("income") || lower.contains("money")) {
                Aggregation agg = Aggregation.newAggregation(
                    Aggregation.match(Criteria.where("status").is("won")),
                    Aggregation.group().sum("value").as("total")
                );
                AggregationResults<Map> result = mongoTemplate.aggregate(agg, "bids", Map.class);
                double rev = result.getMappedResults().isEmpty() ? 0 :
                    ((Number) result.getMappedResults().get(0).getOrDefault("total", 0)).doubleValue();
                return "💰 Total revenue from won bids: **$" + String.format("%,.0f", rev) + "**";
            }
            if (lower.contains("negotiation") || lower.contains("negotiating")) {
                Query q = new Query(Criteria.where("status").is("negotiation"));
                List<Bid> bids = mongoTemplate.find(q, Bid.class);
                if (bids.isEmpty()) return "🤝 No bids currently in negotiation.";
                String list = bids.stream().limit(5).map(b -> "• " + b.getTitle() + " — $" + String.format("%,.0f", b.getValue() != null ? b.getValue() : 0)).collect(Collectors.joining("\n"));
                return "🤝 **Bids in negotiation (" + bids.size() + "):**\n" + list;
            }
            if (lower.contains("new bid") || lower.contains("latest bid") || lower.contains("recent bid")) {
                Query q = new Query().with(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")).limit(3);
                List<Bid> bids = mongoTemplate.find(q, Bid.class);
                if (bids.isEmpty()) return "📋 No bids found in the system yet.";
                String list = bids.stream().map(b -> "• " + b.getBidNumber() + ": " + b.getTitle() + " (" + b.getStatus() + ")").collect(Collectors.joining("\n"));
                return "📋 **Recent bids:**\n" + list;
            }
            if (lower.contains("deadline") || lower.contains("due") || lower.contains("expir")) {
                java.time.Instant now = java.time.Instant.now();
                java.time.Instant nextWeek = now.plus(7, java.time.temporal.ChronoUnit.DAYS);
                Query q = new Query(Criteria.where("deadline").gte(now).lte(nextWeek).and("status").nin("won","lost"));
                List<Bid> bids = mongoTemplate.find(q, Bid.class);
                if (bids.isEmpty()) return "✅ No bid deadlines in the next 7 days. You're on track!";
                String list = bids.stream().map(b -> "• " + b.getTitle() + " — Due: " + DATE_FMT.format(b.getDeadline())).collect(Collectors.joining("\n"));
                return "⏰ **Upcoming deadlines (7 days):**\n" + list;
            }

            // ── General knowledge questions ────────────────────────────────────
            if (lower.contains("what is ai") || lower.contains("artificial intelligence"))
                return "🤖 **Artificial Intelligence (AI)** is the simulation of human intelligence by machines. It includes machine learning, natural language processing, and computer vision. In BidFlow, AI helps predict win probabilities, analyze sentiment, and generate bid summaries!";
            if (lower.contains("what is spring boot") || lower.contains("spring boot") || lower.contains("springboot"))
                return "☕ **Spring Boot** is a Java framework that makes it easy to build production-ready web applications. BidFlow's backend is built with Spring Boot 3.2.5 — it handles all API requests, authentication, and database operations!";
            if (lower.contains("what is mongodb") || lower.contains("mongo"))
                return "🍃 **MongoDB** is a NoSQL document database. BidFlow uses MongoDB Atlas (cloud) to store all bids, users, notifications, and payments. It's fast, scalable, and perfect for flexible data structures!";
            if (lower.contains("what is react") || lower.contains("reactjs"))
                return "⚛️ **React.js** is a JavaScript library for building user interfaces. BidFlow's frontend is built with React 19 + Vite, giving you a fast, responsive, and modern dashboard experience!";
            if (lower.contains("what is jwt") || lower.contains("json web token"))
                return "🔐 **JWT (JSON Web Token)** is a secure way to transmit authentication information. BidFlow uses JWT tokens for login — when you sign in, you get a token that proves your identity for all API requests!";
            if (lower.contains("what is bid") || lower.contains("bid management"))
                return "📋 A **bid** is a proposal submitted by a company to win a project or contract. **Bid management** involves tracking, analyzing, and managing these proposals from submission to completion. BidFlow automates this entire process!";
            if (lower.contains("subscription") || lower.contains("plan") || lower.contains("pricing"))
                return "💳 BidFlow offers 4 subscription plans:\n• 🆓 **FREE** — $0/mo, 5 bids\n• ⚡ **BASIC** — $29/mo, 25 bids + AI\n• 🚀 **PRO** — $79/mo, 100 bids + Map\n• 🏢 **ENTERPRISE** — $199/mo, Unlimited\n\nGo to Subscription page to upgrade!";
            if (lower.contains("map") || lower.contains("location") || lower.contains("tracking"))
                return "🗺️ BidFlow has a **Live Map** feature using OpenStreetMap! It shows real-time locations of team members. Clients must share location when submitting bids, and employees' locations are visible to managers after assignment.";
            if (lower.contains("language") || lower.contains("multilingual") || lower.contains("hindi") || lower.contains("arabic"))
                return "🌐 BidFlow supports **3 languages:**\n• 🇺🇸 English\n• 🇮🇳 Hindi (हिंदी)\n• 🇸🇦 Arabic (العربية)\n\nClick the 🌐 icon in the top bar to switch languages!";
            if (lower.contains("dark mode") || lower.contains("light mode") || lower.contains("theme"))
                return "🌙 BidFlow supports **Dark & Light mode**! Click the ☀️/🌙 icon in the top bar to toggle. Your preference is saved automatically.";
            if (lower.contains("notification"))
                return "🔔 BidFlow sends **real-time notifications** for every bid action — assignments, status changes, approvals, and more. Check the bell icon in the top bar for your notifications!";
            if (lower.contains("google") || lower.contains("oauth") || lower.contains("login with google"))
                return "🔑 BidFlow supports **Google OAuth** login! Click 'Sign in with Google' on the login page to use your Google account. It's fast, secure, and no password needed!";
            if (lower.contains("password") || lower.contains("forgot"))
                return "🔐 To change your password, go to **Profile → Change Password**. If you forgot it, use the 'Forgot Password' option on the login page.";
            if (lower.contains("role") || lower.contains("permission") || lower.contains("access"))
                return "👥 BidFlow has 4 roles:\n• 👤 **Client** — Submit & track bids\n• 👷 **Employee** — Work on assigned bids\n• 👔 **Manager** — Manage all bids & team\n• 🔑 **Admin** — Full system access";

        } catch (Exception ignored) {}

        // Return null to trigger HF API call for unknown questions
        return null;
    }

    private String generalFallback(String message) {
        return "🤖 I'm BidNova AuctionX Tracking! I can help you with bid management questions, system stats, and general information. Try asking:\n• \"How many bids are pending?\"\n• \"What is my win rate?\"\n• \"Show high priority bids\"\n• \"What is AI?\"\n• \"Tell me about subscriptions\"";
    }

    private Map<String, Object> sentimentFallback(String text) {
        String lower = text.toLowerCase();
        List<String> posWords = List.of("interested","approved","excellent","great","proceed","confirm","accept","happy","satisfied");
        List<String> negWords = List.of("reject","cancel","expensive","delay","problem","issue","concern","disappointed");
        long posCount = posWords.stream().filter(lower::contains).count();
        long negCount = negWords.stream().filter(lower::contains).count();
        String sentiment = posCount > negCount ? "positive" : negCount > posCount ? "negative" : "neutral";
        List<String> keywords = new ArrayList<>();
        posWords.stream().filter(lower::contains).limit(3).forEach(keywords::add);
        negWords.stream().filter(lower::contains).limit(3 - keywords.size()).forEach(keywords::add);
        return Map.of("sentiment", sentiment, "confidence", 70, "keywords", keywords, "summary", "Analyzed using keyword matching.");
    }
}
