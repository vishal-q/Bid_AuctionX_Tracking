package com.bidflow.controller;

import com.bidflow.dto.BidRequest;
import com.bidflow.model.*;
import com.bidflow.repository.BidRepository;
import com.bidflow.repository.CommentRepository;
import com.bidflow.repository.UserRepository;
import com.bidflow.security.AuthHelper;
import com.bidflow.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bids")
@RequiredArgsConstructor
public class BidController {

    private final BidRepository bidRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuthHelper authHelper;
    private final MongoTemplate mongoTemplate;

    private static final List<Map<String, Object>> MOCK_MONTHLY = List.of(
        Map.of("month","Jan","revenue",320,"bids",18,"won",8,"lost",4),
        Map.of("month","Feb","revenue",280,"bids",14,"won",6,"lost",3),
        Map.of("month","Mar","revenue",450,"bids",22,"won",11,"lost",5),
        Map.of("month","Apr","revenue",390,"bids",19,"won",9,"lost",4),
        Map.of("month","May","revenue",520,"bids",26,"won",13,"lost",6),
        Map.of("month","Jun","revenue",480,"bids",23,"won",12,"lost",5)
    );

    // ── Analytics ─────────────────────────────────────────────────────────────
    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Not authorized"));
        if (!List.of("MANAGER","ADMIN").contains(user.getRole()))
            return ResponseEntity.status(403).body(Map.of("message","Access denied"));

        long total = bidRepository.count();
        long won = bidRepository.countByStatus("won");
        long lost = bidRepository.countByStatus("lost");
        long highPriority = bidRepository.countByPriorityAndStatusNotIn("high", List.of("won","lost"));
        long pendingApproval = bidRepository.countByStatus("awaiting_approval");

        Aggregation revenueAgg = Aggregation.newAggregation(
            Aggregation.match(Criteria.where("status").is("won")),
            Aggregation.group().sum("value").as("total")
        );
        AggregationResults<Map> revenueResult = mongoTemplate.aggregate(revenueAgg, "bids", Map.class);
        double revenue = revenueResult.getMappedResults().isEmpty() ? 0 :
            ((Number) revenueResult.getMappedResults().get(0).getOrDefault("total", 0)).doubleValue();
        long winRate = total > 0 ? Math.round((won * 100.0) / total) : 0;

        Aggregation statusAgg = Aggregation.newAggregation(
            Aggregation.group("status").count().as("value")
        );
        AggregationResults<Map> statusResult = mongoTemplate.aggregate(statusAgg, "bids", Map.class);
        List<Map<String, Object>> statusDist = statusResult.getMappedResults().stream()
            .map(m -> Map.<String,Object>of("name", m.get("_id"), "value", m.get("value")))
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
            "stats", Map.of("total",total,"won",won,"lost",lost,"revenue",revenue,
                            "winRate",winRate,"highPriority",highPriority,"pendingApproval",pendingApproval),
            "statusDistribution", statusDist,
            "monthly", MOCK_MONTHLY
        ));
    }

    // ── My Bids ───────────────────────────────────────────────────────────────
    @GetMapping("/my-bids")
    public ResponseEntity<?> getMyBids() {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Not authorized"));

        List<Bid> bids;
        if ("CLIENT".equals(user.getRole())) {
            bids = bidRepository.findByClientId(user.getId());
        } else if ("EMPLOYEE".equals(user.getRole())) {
            // Use MongoTemplate query to ensure exact string match on assignedTo field
            Query q = new Query(Criteria.where("assignedTo").is(user.getId()));
            q.with(Sort.by(Sort.Direction.DESC, "createdAt"));
            bids = mongoTemplate.find(q, Bid.class);
        } else {
            bids = bidRepository.findByAssignedTo(user.getId());
        }
        bids.sort(Comparator.comparing(Bid::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return ResponseEntity.ok(populateAssignedNames(bids));
    }

    // ── Get all bids ──────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<?> getAllBids(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "-createdAt") String sort) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Not authorized"));

        Query query = new Query();
        if (status != null && !status.equals("all")) query.addCriteria(Criteria.where("status").is(status));
        if (priority != null && !priority.equals("all")) query.addCriteria(Criteria.where("priority").is(priority));
        if (search != null && !search.isBlank()) {
            query.addCriteria(new Criteria().orOperator(
                Criteria.where("title").regex(search, "i"),
                Criteria.where("clientName").regex(search, "i")
            ));
        }
        if ("EMPLOYEE".equals(user.getRole())) query.addCriteria(Criteria.where("assignedTo").is(user.getId()));
        if ("CLIENT".equals(user.getRole())) query.addCriteria(Criteria.where("clientId").is(user.getId()));

        String sortField = sort.startsWith("-") ? sort.substring(1) : sort;
        Sort.Direction dir = sort.startsWith("-") ? Sort.Direction.DESC : Sort.Direction.ASC;
        query.with(Sort.by(dir, sortField)).limit(limit);

        List<Bid> bids = mongoTemplate.find(query, Bid.class);
        return ResponseEntity.ok(Map.of("bids", populateAssignedNames(bids), "total", bids.size()));
    }

    // ── Get single bid ────────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getBidById(@PathVariable String id) {
        Bid bid = bidRepository.findById(id).orElse(null);
        if (bid == null) return ResponseEntity.status(404).body(Map.of("message","Bid not found"));
        return ResponseEntity.ok(bid);
    }

    // ── Create bid ────────────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> createBid(@RequestBody BidRequest req) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Not authorized"));
        if (!List.of("MANAGER","ADMIN","EMPLOYEE","CLIENT").contains(user.getRole()))
            return ResponseEntity.status(403).body(Map.of("message","Access denied"));

        Bid bid = mapRequestToBid(req, new Bid());
        bid.setCreatedBy(user.getId());
        bid.getHistory().add(new BidHistory("Bid created", user.getId(), user.getName(), Instant.now()));

        if ("CLIENT".equals(user.getRole())) {
            bid.setClientId(user.getId());
            if (bid.getClientName() == null || bid.getClientName().isBlank())
                bid.setClientName(user.getCompany() != null ? user.getCompany() : user.getName());
            bid.getTrackingStages().add(new TrackingStage("submitted","Bid Submitted by Client",
                Instant.now(), user.getId(), user.getName(), null));
        }

        // Auto-generate bid number
        long count = bidRepository.count();
        bid.setBidNumber("BID-" + String.format("%03d", count + 1) + "-" + String.valueOf(System.currentTimeMillis()).substring(9));

        Bid saved = bidRepository.save(bid);
        String bidTitle = saved.getTitle() != null ? saved.getTitle() : "Bid";

        if ("CLIENT".equals(user.getRole())) {
            notificationService.notifyManagers("📋 New Bid Submitted",
                "Client " + user.getName() + " submitted a new bid: \"" + bidTitle + "\". Please review and verify requirements.",
                "info", saved.getId());
        } else if ("EMPLOYEE".equals(user.getRole())) {
            notificationService.notifyManagers("New Bid Created",
                bidTitle + " has been created by " + user.getName(), "info", saved.getId());
        } else if (List.of("MANAGER","ADMIN").contains(user.getRole()) && saved.getAssignedTo() != null) {
            notificationService.createNotif(saved.getAssignedTo(), "Bid Assigned",
                bidTitle + " has been assigned to you", "info", saved.getId());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // ── Update bid ────────────────────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBid(@PathVariable String id, @RequestBody BidRequest req) {
        Bid bid = bidRepository.findById(id).orElse(null);
        if (bid == null) return ResponseEntity.status(404).body(Map.of("message","Bid not found"));
        mapRequestToBid(req, bid);
        return ResponseEntity.ok(bidRepository.save(bid));
    }

    // ── Update status ─────────────────────────────────────────────────────────
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Not authorized"));
        String status = body.get("status");
        Bid bid = bidRepository.findById(id).orElse(null);
        if (bid == null) return ResponseEntity.status(404).body(Map.of("message","Bid not found"));

        bid.getHistory().add(new BidHistory("Status changed to " + status, user.getId(), user.getName(), Instant.now()));
        bid.setStatus(status);
        Bid saved = bidRepository.save(bid);
        String bidTitle = saved.getTitle() != null ? saved.getTitle() : "Bid";

        if (saved.getAssignedTo() != null)
            notificationService.createNotif(saved.getAssignedTo(), "Bid Status Updated",
                bidTitle + " status changed to " + status.replace("_"," ") + " by " + user.getName(), "info", saved.getId());
        if (saved.getClientId() != null)
            notificationService.createNotif(saved.getClientId(), "Status Update",
                "Your bid (" + bidTitle + ") status changed to " + status.replace("_"," "), "info", saved.getId());
        notificationService.notifyManagers("Bid Status Changed",
            bidTitle + " moved to " + status.replace("_"," ") + " by " + user.getName(), "info", saved.getId());

        return ResponseEntity.ok(saved);
    }

    // ── Assign employee ───────────────────────────────────────────────────────
    @PatchMapping("/{id}/assign")
    public ResponseEntity<?> assignEmployee(@PathVariable String id, @RequestBody Map<String, String> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Not authorized"));
        if (!List.of("MANAGER","ADMIN").contains(user.getRole()))
            return ResponseEntity.status(403).body(Map.of("message","Access denied"));

        String employeeId = body.get("employeeId");
        if (employeeId == null || employeeId.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "employeeId is required"));

        Bid bid = bidRepository.findById(id).orElse(null);
        if (bid == null) return ResponseEntity.status(404).body(Map.of("message","Bid not found"));

        bid.setAssignedTo(employeeId);
        bid.setStatus("proposal_generated");
        bid.getHistory().add(new BidHistory("Assigned to employee by " + user.getName(), user.getId(), user.getName(), Instant.now()));
        bid.getTrackingStages().add(new TrackingStage("assigned","Assigned to Employee",
            Instant.now(), user.getId(), user.getName(), null));
        Bid saved = bidRepository.save(bid);
        String bidTitle = saved.getTitle() != null ? saved.getTitle() : "Bid";

        notificationService.createNotif(employeeId, "📌 Bid Assigned to You",
            "\"" + bidTitle + "\" has been assigned to you by " + user.getName() + ". Please review requirements and start work.",
            "info", saved.getId());
        notificationService.notifyManagers("Bid Assigned", bidTitle + " assigned by " + user.getName(), "info", saved.getId());
        if (saved.getClientId() != null)
            notificationService.createNotif(saved.getClientId(), "👷 Employee Assigned",
                "An employee has been assigned to work on your bid \"" + bidTitle + "\".", "success", saved.getId());

        return ResponseEntity.ok(saved);
    }

    // ── Upload document ───────────────────────────────────────────────────────
    @PostMapping("/{id}/documents")
    public ResponseEntity<?> uploadDocument(@PathVariable String id, @RequestBody Map<String, String> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Not authorized"));
        String name = body.get("name");
        if (name == null || name.isBlank()) return ResponseEntity.badRequest().body(Map.of("message","Document name required"));
        Bid bid = bidRepository.findById(id).orElse(null);
        if (bid == null) return ResponseEntity.status(404).body(Map.of("message","Bid not found"));

        BidDocument doc = new BidDocument(name, body.getOrDefault("url","#"), Instant.now());
        bid.getDocuments().add(doc);
        bid.getHistory().add(new BidHistory("Document uploaded: " + name, user.getId(), user.getName(), Instant.now()));
        bidRepository.save(bid);
        return ResponseEntity.status(HttpStatus.CREATED).body(doc);
    }

    // ── Bulk status update ────────────────────────────────────────────────────
    @PostMapping("/bulk/status")
    public ResponseEntity<?> bulkUpdateStatus(@RequestBody Map<String, Object> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Not authorized"));
        if (!List.of("MANAGER","ADMIN").contains(user.getRole()))
            return ResponseEntity.status(403).body(Map.of("message","Access denied"));

        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        String status = (String) body.get("status");
        if (ids == null || ids.isEmpty() || status == null)
            return ResponseEntity.badRequest().body(Map.of("message","ids and status required"));

        List<Bid> bids = bidRepository.findByIdIn(ids);
        bids.forEach(b -> b.setStatus(status));
        bidRepository.saveAll(bids);
        return ResponseEntity.ok(Map.of("updated", ids.size()));
    }

    // ── Delete bid ────────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBid(@PathVariable String id) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Not authorized"));
        if (!List.of("MANAGER","ADMIN").contains(user.getRole()))
            return ResponseEntity.status(403).body(Map.of("message","Access denied"));
        bidRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message","Bid deleted"));
    }

    // ── Get history ───────────────────────────────────────────────────────────
    @GetMapping("/{id}/history")
    public ResponseEntity<?> getHistory(@PathVariable String id) {
        Bid bid = bidRepository.findById(id).orElse(null);
        return ResponseEntity.ok(bid != null ? bid.getHistory() : List.of());
    }

    // ── Verify bid (Manager) ──────────────────────────────────────────────────
    @PatchMapping("/{id}/verify")
    public ResponseEntity<?> verifyBid(@PathVariable String id, @RequestBody Map<String, String> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Not authorized"));
        if (!List.of("MANAGER","ADMIN").contains(user.getRole()))
            return ResponseEntity.status(403).body(Map.of("message","Access denied"));

        String verificationStatus = body.get("verificationStatus");
        String verificationNote = body.getOrDefault("verificationNote","");
        if (!List.of("verified","rejected").contains(verificationStatus))
            return ResponseEntity.badRequest().body(Map.of("message","verificationStatus must be verified or rejected"));

        Bid bid = bidRepository.findById(id).orElse(null);
        if (bid == null) return ResponseEntity.status(404).body(Map.of("message","Bid not found"));

        bid.setVerificationStatus(verificationStatus);
        bid.setVerificationNote(verificationNote);
        bid.setVerifiedBy(user.getId());
        bid.setVerifiedAt(Instant.now());

        if ("verified".equals(verificationStatus)) {
            bid.setStatus("under_review");
            bid.getHistory().add(new BidHistory("Bid verified by manager: " + (verificationNote.isBlank() ? "Requirements approved" : verificationNote), user.getId(), user.getName(), Instant.now()));
            bid.getTrackingStages().add(new TrackingStage("verified","Verified by Manager", Instant.now(), user.getId(), user.getName(), verificationNote));
            if (bid.getClientId() != null)
                notificationService.createNotif(bid.getClientId(), "✅ Bid Verified",
                    "Your bid \"" + bid.getTitle() + "\" has been verified by the manager. It will now be assigned to an employee.", "success", bid.getId());
        } else {
            bid.setStatus("lost");
            bid.getHistory().add(new BidHistory("Bid rejected by manager: " + (verificationNote.isBlank() ? "Requirements not met" : verificationNote), user.getId(), user.getName(), Instant.now()));
            bid.getTrackingStages().add(new TrackingStage("rejected","Rejected by Manager", Instant.now(), user.getId(), user.getName(), verificationNote));
            if (bid.getClientId() != null)
                notificationService.createNotif(bid.getClientId(), "❌ Bid Rejected",
                    "Your bid \"" + bid.getTitle() + "\" was rejected. Reason: " + (verificationNote.isBlank() ? "Requirements not met" : verificationNote), "danger", bid.getId());
        }
        return ResponseEntity.ok(bidRepository.save(bid));
    }

    // ── Get tracking ──────────────────────────────────────────────────────────
    @GetMapping("/{id}/tracking")
    public ResponseEntity<?> getTracking(@PathVariable String id) {
        Bid bid = bidRepository.findById(id).orElse(null);
        if (bid == null) return ResponseEntity.status(404).body(Map.of("message","Bid not found"));
        return ResponseEntity.ok(bid);
    }

    // ── Update progress ───────────────────────────────────────────────────────
    @PatchMapping("/{id}/progress")
    public ResponseEntity<?> updateProgress(@PathVariable String id, @RequestBody Map<String, Object> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Not authorized"));
        Object progressObj = body.get("progress");
        if (progressObj == null) return ResponseEntity.badRequest().body(Map.of("message","Progress must be 0-100"));
        int progress = ((Number) progressObj).intValue();
        if (progress < 0 || progress > 100) return ResponseEntity.badRequest().body(Map.of("message","Progress must be 0-100"));

        Bid bid = bidRepository.findById(id).orElse(null);
        if (bid == null) return ResponseEntity.status(404).body(Map.of("message","Bid not found"));
        bid.setProgress(progress);
        bid.getHistory().add(new BidHistory("Progress updated to " + progress + "%", user.getId(), user.getName(), Instant.now()));
        bidRepository.save(bid);
        if (progress == 100)
            notificationService.notifyManagers("✅ Bid 100% Complete",
                user.getName() + " marked \"" + bid.getTitle() + "\" as 100% complete. Ready for submission.", "success", bid.getId());
        return ResponseEntity.ok(Map.of("progress", progress));
    }

    // ── Submit completion (Employee) ──────────────────────────────────────────
    @PatchMapping("/{id}/submit-completion")
    public ResponseEntity<?> submitCompletion(@PathVariable String id, @RequestBody Map<String, String> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Not authorized"));
        if (!"EMPLOYEE".equals(user.getRole()))
            return ResponseEntity.status(403).body(Map.of("message","Only employees can submit completion"));

        Bid bid = bidRepository.findById(id).orElse(null);
        if (bid == null) return ResponseEntity.status(404).body(Map.of("message","Bid not found"));
        if (!user.getId().equals(bid.getAssignedTo()))
            return ResponseEntity.status(403).body(Map.of("message","You are not assigned to this bid"));

        String completionNote = body.getOrDefault("completionNote","");
        bid.setCompletionNote(completionNote);
        bid.setCompletionSubmittedAt(Instant.now());
        bid.setStatus("awaiting_approval");
        bid.setProgress(100);
        bid.getHistory().add(new BidHistory("Work completed and submitted for manager approval by " + user.getName(), user.getId(), user.getName(), Instant.now()));
        bid.getTrackingStages().add(new TrackingStage("employee_submitted","Submitted by Employee", Instant.now(), user.getId(), user.getName(), completionNote));
        bidRepository.save(bid);

        notificationService.notifyManagers("🔔 Work Submitted for Approval",
            user.getName() + " has completed work on \"" + bid.getTitle() + "\" and submitted for your approval.", "info", bid.getId());
        if (bid.getClientId() != null)
            notificationService.createNotif(bid.getClientId(), "🔄 Work Submitted",
                "Work on your bid \"" + bid.getTitle() + "\" has been completed and is awaiting manager approval.", "info", bid.getId());
        return ResponseEntity.ok(bid);
    }

    // ── Final approval (Manager) ──────────────────────────────────────────────
    @PatchMapping("/{id}/final-approval")
    public ResponseEntity<?> finalApproval(@PathVariable String id, @RequestBody Map<String, Object> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Not authorized"));
        if (!List.of("MANAGER","ADMIN").contains(user.getRole()))
            return ResponseEntity.status(403).body(Map.of("message","Access denied"));

        boolean approved = Boolean.TRUE.equals(body.get("approved"));
        String note = body.getOrDefault("managerApprovalNote","").toString();
        Bid bid = bidRepository.findById(id).orElse(null);
        if (bid == null) return ResponseEntity.status(404).body(Map.of("message","Bid not found"));

        bid.setManagerApprovalNote(note);
        if (approved) {
            bid.setStatus("won");
            bid.getHistory().add(new BidHistory("Project approved and marked as completed by " + user.getName(), user.getId(), user.getName(), Instant.now()));
            bid.getTrackingStages().add(new TrackingStage("completed","Project Completed", Instant.now(), user.getId(), user.getName(), note));
            if (bid.getClientId() != null)
                notificationService.createNotif(bid.getClientId(), "🎉 Project Completed",
                    "Your project \"" + bid.getTitle() + "\" has been successfully completed and approved by the manager.", "success", bid.getId());
            if (bid.getAssignedTo() != null)
                notificationService.createNotif(bid.getAssignedTo(), "✅ Work Approved",
                    "Your work on \"" + bid.getTitle() + "\" has been approved by the manager. Great job!", "success", bid.getId());
        } else {
            bid.setStatus("negotiation");
            bid.getHistory().add(new BidHistory("Completion rejected by manager: " + (note.isBlank() ? "Needs revision" : note), user.getId(), user.getName(), Instant.now()));
            bid.getTrackingStages().add(new TrackingStage("manager_approval","Revision Requested", Instant.now(), user.getId(), user.getName(), note));
            if (bid.getAssignedTo() != null)
                notificationService.createNotif(bid.getAssignedTo(), "🔁 Revision Required",
                    "Manager has requested revision on \"" + bid.getTitle() + "\". Note: " + (note.isBlank() ? "Please review and resubmit." : note), "warning", bid.getId());
        }
        return ResponseEntity.ok(bidRepository.save(bid));
    }

    // ── Client feedback ───────────────────────────────────────────────────────
    @PostMapping("/{id}/feedback")
    public ResponseEntity<?> submitFeedback(@PathVariable String id, @RequestBody Map<String, Object> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Not authorized"));
        Object ratingObj = body.get("rating");
        if (ratingObj == null) return ResponseEntity.badRequest().body(Map.of("message","Rating must be 1-5"));
        int rating = ((Number) ratingObj).intValue();
        if (rating < 1 || rating > 5) return ResponseEntity.badRequest().body(Map.of("message","Rating must be 1-5"));

        Bid bid = bidRepository.findById(id).orElse(null);
        if (bid == null) return ResponseEntity.status(404).body(Map.of("message","Bid not found"));
        if (!"won".equals(bid.getStatus())) return ResponseEntity.badRequest().body(Map.of("message","Feedback only for completed bids"));

        String feedback = body.getOrDefault("feedback","").toString();
        bid.setClientRating(rating);
        bid.setClientFeedback(feedback);
        bid.getHistory().add(new BidHistory("Client submitted feedback: " + rating + "/5 stars", user.getId(), user.getName(), Instant.now()));
        bidRepository.save(bid);
        notificationService.notifyManagers("⭐ Client Feedback Received",
            user.getName() + " rated \"" + bid.getTitle() + "\" " + rating + "/5 stars.", "success", bid.getId());
        return ResponseEntity.ok(Map.of("rating", rating, "feedback", feedback));
    }

    // ── Get employees list ────────────────────────────────────────────────────
    @GetMapping("/employees/list")
    public ResponseEntity<?> getEmployees() {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Not authorized"));
        if (!List.of("MANAGER","ADMIN").contains(user.getRole()))
            return ResponseEntity.status(403).body(Map.of("message","Access denied"));
        List<User> employees = userRepository.findByRole("EMPLOYEE");
        employees.forEach(u -> u.setPassword(null));
        // Return as list of maps with both id and _id for frontend compatibility
        List<Map<String, Object>> result = employees.stream().map(u -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("_id", u.getId());
            m.put("name", u.getName() != null ? u.getName() : "");
            m.put("email", u.getEmail() != null ? u.getEmail() : "");
            m.put("company", u.getCompany() != null ? u.getCompany() : "");
            m.put("role", u.getRole());
            m.put("isActive", u.isActive());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── Comments ──────────────────────────────────────────────────────────────
    @GetMapping("/{id}/comments")
    public ResponseEntity<?> getComments(@PathVariable String id) {
        return ResponseEntity.ok(commentRepository.findByBidOrderByCreatedAtAsc(id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable String id, @RequestBody Map<String, String> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Not authorized"));
        Comment comment = new Comment();
        comment.setBid(id);
        comment.setAuthor(user.getId());
        comment.setAuthorName(user.getName());
        comment.setText(body.get("comment"));
        return ResponseEntity.status(HttpStatus.CREATED).body(commentRepository.save(comment));
    }

    // ── Helper: populate assignedTo name ─────────────────────────────────────
    private List<Map<String, Object>> populateAssignedNames(List<Bid> bids) {
        Set<String> userIds = bids.stream()
            .filter(b -> b.getAssignedTo() != null)
            .map(Bid::getAssignedTo)
            .collect(Collectors.toSet());
        Map<String, String> nameMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            userRepository.findAllById(userIds).forEach(u -> nameMap.put(u.getId(), u.getName()));
        }
        return bids.stream().map(b -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", b.getId());
            map.put("_id", b.getId());
            map.put("bidNumber", b.getBidNumber());
            map.put("title", b.getTitle());
            map.put("description", b.getDescription());
            map.put("clientName", b.getClientName());
            map.put("clientId", b.getClientId());
            map.put("value", b.getValue());
            map.put("status", b.getStatus());
            map.put("priority", b.getPriority());
            map.put("deadline", b.getDeadline());
            map.put("department", b.getDepartment());
            map.put("progress", b.getProgress());
            map.put("aiWinProbability", b.getAiWinProbability());
            map.put("clientSentiment", b.getClientSentiment());
            map.put("aiSummary", b.getAiSummary());
            map.put("documents", b.getDocuments());
            map.put("history", b.getHistory());
            map.put("tags", b.getTags());
            map.put("requirements", b.getRequirements());
            map.put("budget", b.getBudget());
            map.put("verificationStatus", b.getVerificationStatus());
            map.put("verificationNote", b.getVerificationNote());
            map.put("verifiedBy", b.getVerifiedBy());
            map.put("verifiedAt", b.getVerifiedAt());
            map.put("completionNote", b.getCompletionNote());
            map.put("completionSubmittedAt", b.getCompletionSubmittedAt());
            map.put("managerApprovalNote", b.getManagerApprovalNote());
            map.put("trackingStages", b.getTrackingStages());
            map.put("clientRating", b.getClientRating());
            map.put("clientFeedback", b.getClientFeedback());
            map.put("createdAt", b.getCreatedAt());
            map.put("updatedAt", b.getUpdatedAt());
            map.put("createdBy", b.getCreatedBy());
            if (b.getAssignedTo() != null) {
                map.put("assignedTo", Map.of("_id", b.getAssignedTo(), "name", nameMap.getOrDefault(b.getAssignedTo(), "")));
            } else {
                map.put("assignedTo", null);
            }
            return map;
        }).collect(Collectors.toList());
    }

    // ── Helper: map BidRequest to Bid ─────────────────────────────────────────
    private Bid mapRequestToBid(BidRequest req, Bid bid) {
        if (req.getTitle() != null) bid.setTitle(req.getTitle());
        if (req.getDescription() != null) bid.setDescription(req.getDescription());
        if (req.getClientName() != null) bid.setClientName(req.getClientName());
        if (req.getClientId() != null) bid.setClientId(req.getClientId());
        if (req.getValue() != null) bid.setValue(req.getValue());
        if (req.getStatus() != null) bid.setStatus(req.getStatus());
        if (req.getPriority() != null) bid.setPriority(req.getPriority());
        if (req.getDeadline() != null) bid.setDeadline(req.getDeadlineAsInstant());
        if (req.getAssignedTo() != null) bid.setAssignedTo(req.getAssignedTo());
        if (req.getDepartment() != null) bid.setDepartment(req.getDepartment());
        if (req.getProgress() != null) bid.setProgress(req.getProgress());
        if (req.getAiWinProbability() != null) bid.setAiWinProbability(req.getAiWinProbability());
        if (req.getClientSentiment() != null) bid.setClientSentiment(req.getClientSentiment());
        if (req.getAiSummary() != null) bid.setAiSummary(req.getAiSummary());
        if (req.getTags() != null) bid.setTags(req.getTags());
        if (req.getRequirements() != null) bid.setRequirements(req.getRequirements());
        if (req.getBudget() != null) bid.setBudget(req.getBudget());
        if (req.getVerificationStatus() != null) bid.setVerificationStatus(req.getVerificationStatus());
        if (req.getVerificationNote() != null) bid.setVerificationNote(req.getVerificationNote());
        if (req.getCompletionNote() != null) bid.setCompletionNote(req.getCompletionNote());
        if (req.getManagerApprovalNote() != null) bid.setManagerApprovalNote(req.getManagerApprovalNote());
        if (req.getClientRating() != null) bid.setClientRating(req.getClientRating());
        if (req.getClientFeedback() != null) bid.setClientFeedback(req.getClientFeedback());
        return bid;
    }
}
