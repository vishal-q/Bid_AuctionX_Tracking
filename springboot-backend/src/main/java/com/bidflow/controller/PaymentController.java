package com.bidflow.controller;

import com.bidflow.model.Payment;
import com.bidflow.model.SubscriptionPlan;
import com.bidflow.model.User;
import com.bidflow.repository.PaymentRepository;
import com.bidflow.repository.SubscriptionPlanRepository;
import com.bidflow.repository.UserRepository;
import com.bidflow.security.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final SubscriptionPlanRepository planRepository;
    private final UserRepository userRepository;
    private final AuthHelper authHelper;

    // ── Get all plans ─────────────────────────────────────────────────────────
    @GetMapping("/plans")
    public ResponseEntity<?> getPlans() {
        List<SubscriptionPlan> plans = planRepository.findByIsActiveTrue();
        if (plans.isEmpty()) {
            // Seed default plans if none exist
            plans = seedDefaultPlans();
        }
        return ResponseEntity.ok(plans);
    }

    // ── Get my subscription ───────────────────────────────────────────────────
    @GetMapping("/my-subscription")
    public ResponseEntity<?> getMySubscription() {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));
        if ("demo-user".equals(user.getId()))
            return ResponseEntity.ok(buildSubscriptionResponse(null, "FREE", "active", "monthly", null, null));

        User dbUser = userRepository.findById(user.getId()).orElse(null);
        if (dbUser == null) return ResponseEntity.status(404).body(Map.of("message", "User not found"));

        SubscriptionPlan plan = planRepository.findByName(dbUser.getSubscriptionPlan()).orElse(null);
        return ResponseEntity.ok(buildSubscriptionResponse(
            plan,
            dbUser.getSubscriptionPlan(),
            dbUser.getSubscriptionStatus(),
            dbUser.getBillingCycle(),
            dbUser.getSubscriptionStart(),
            dbUser.getSubscriptionEnd()
        ));
    }

    // ── Get my payment history ────────────────────────────────────────────────
    @GetMapping("/history")
    public ResponseEntity<?> getPaymentHistory() {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));
        if ("demo-user".equals(user.getId())) return ResponseEntity.ok(List.of());

        List<Payment> payments = paymentRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return ResponseEntity.ok(payments);
    }

    // ── Process payment (subscribe / upgrade / downgrade) ─────────────────────
    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@RequestBody Map<String, Object> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));
        if ("demo-user".equals(user.getId()))
            return ResponseEntity.ok(Map.of("message", "Demo mode — payment simulated", "status", "success"));

        String planName = (String) body.get("plan");
        String billingCycle = (String) body.getOrDefault("billingCycle", "monthly");
        String paymentMethod = (String) body.getOrDefault("paymentMethod", "card");
        String cardLast4 = (String) body.getOrDefault("cardLast4", "");
        String cardBrand = (String) body.getOrDefault("cardBrand", "");
        String upiId = (String) body.getOrDefault("upiId", "");

        if (planName == null || planName.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Plan is required"));

        SubscriptionPlan plan = planRepository.findByName(planName).orElse(null);
        if (plan == null) return ResponseEntity.status(404).body(Map.of("message", "Plan not found"));

        User dbUser = userRepository.findById(user.getId()).orElse(null);
        if (dbUser == null) return ResponseEntity.status(404).body(Map.of("message", "User not found"));

        // Determine amount
        double amount = "yearly".equals(billingCycle) ? plan.getYearlyPrice() : plan.getPrice();

        // Simulate payment processing
        boolean paymentSuccess = simulatePayment(paymentMethod, amount);

        // Create payment record
        Payment payment = new Payment();
        payment.setUserId(dbUser.getId());
        payment.setPlanId(plan.getId());
        payment.setPlanName(plan.getName());
        payment.setBillingCycle(billingCycle);
        payment.setAmount(amount);
        payment.setPaymentMethod(paymentMethod);
        payment.setCardLast4(cardLast4);
        payment.setCardBrand(cardBrand);
        payment.setUpiId(upiId);
        payment.setTransactionId("TXN-" + System.currentTimeMillis());
        payment.setInvoiceNumber("INV-" + String.format("%06d", (int)(Math.random() * 999999)));

        Instant now = Instant.now();
        payment.setPeriodStart(now);
        payment.setPeriodEnd("yearly".equals(billingCycle)
            ? now.plus(365, ChronoUnit.DAYS)
            : now.plus(30, ChronoUnit.DAYS));

        if (paymentSuccess) {
            payment.setStatus("success");
            // Update user subscription
            dbUser.setSubscriptionPlan(planName);
            dbUser.setSubscriptionStatus("active");
            dbUser.setBillingCycle(billingCycle);
            dbUser.setSubscriptionStart(now);
            dbUser.setSubscriptionEnd(payment.getPeriodEnd());
            userRepository.save(dbUser);
        } else {
            payment.setStatus("failed");
            payment.setFailureReason("Payment declined. Please check your payment details.");
        }

        paymentRepository.save(payment);

        if (paymentSuccess) {
            return ResponseEntity.ok(Map.of(
                "message", "Payment successful! Your " + plan.getDisplayName() + " plan is now active.",
                "status", "success",
                "payment", payment,
                "subscription", Map.of(
                    "plan", planName,
                    "status", "active",
                    "billingCycle", billingCycle,
                    "periodEnd", payment.getPeriodEnd().toString()
                )
            ));
        } else {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(Map.of(
                "message", "Payment failed. Please try again.",
                "status", "failed",
                "payment", payment
            ));
        }
    }

    // ── Cancel subscription ───────────────────────────────────────────────────
    @PostMapping("/cancel")
    public ResponseEntity<?> cancelSubscription(@RequestBody Map<String, Object> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));
        if ("demo-user".equals(user.getId()))
            return ResponseEntity.ok(Map.of("message", "Demo mode — cancellation simulated"));

        User dbUser = userRepository.findById(user.getId()).orElse(null);
        if (dbUser == null) return ResponseEntity.status(404).body(Map.of("message", "User not found"));

        if ("FREE".equals(dbUser.getSubscriptionPlan()))
            return ResponseEntity.badRequest().body(Map.of("message", "You are already on the Free plan"));

        String reason = (String) body.getOrDefault("reason", "User requested cancellation");

        // Downgrade to FREE at end of billing period
        dbUser.setSubscriptionStatus("cancelled");
        userRepository.save(dbUser);

        // Record cancellation payment entry
        Payment payment = new Payment();
        payment.setUserId(dbUser.getId());
        payment.setPlanName(dbUser.getSubscriptionPlan());
        payment.setStatus("refunded");
        payment.setAmount(0.0);
        payment.setNotes("Subscription cancelled: " + reason);
        payment.setTransactionId("CANCEL-" + System.currentTimeMillis());
        paymentRepository.save(payment);

        return ResponseEntity.ok(Map.of(
            "message", "Subscription cancelled. You will retain access until " +
                (dbUser.getSubscriptionEnd() != null ? dbUser.getSubscriptionEnd().toString() : "end of billing period"),
            "status", "cancelled"
        ));
    }

    // ── Admin: get all payments ───────────────────────────────────────────────
    @GetMapping("/all")
    public ResponseEntity<?> getAllPayments() {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));
        if (!List.of("MANAGER", "ADMIN").contains(user.getRole()))
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        return ResponseEntity.ok(paymentRepository.findAllByOrderByCreatedAtDesc());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private boolean simulatePayment(String method, double amount) {
        // Simulate 95% success rate for demo
        return Math.random() > 0.05;
    }

    private Map<String, Object> buildSubscriptionResponse(SubscriptionPlan plan, String planName,
            String status, String billingCycle, Instant start, Instant end) {
        Map<String, Object> resp = new java.util.LinkedHashMap<>();
        resp.put("plan", planName != null ? planName : "FREE");
        resp.put("status", status != null ? status : "active");
        resp.put("billingCycle", billingCycle != null ? billingCycle : "monthly");
        resp.put("subscriptionStart", start != null ? start.toString() : null);
        resp.put("subscriptionEnd", end != null ? end.toString() : null);
        if (plan != null) {
            resp.put("planDetails", Map.of(
                "displayName", plan.getDisplayName(),
                "price", plan.getPrice(),
                "yearlyPrice", plan.getYearlyPrice(),
                "maxBids", plan.getMaxBids(),
                "aiFeatures", plan.isAiFeatures(),
                "mapTracking", plan.isMapTracking(),
                "advancedAnalytics", plan.isAdvancedAnalytics(),
                "prioritySupport", plan.isPrioritySupport()
            ));
        }
        return resp;
    }

    private List<SubscriptionPlan> seedDefaultPlans() {
        List<SubscriptionPlan> plans = new ArrayList<>();

        SubscriptionPlan free = new SubscriptionPlan();
        free.setName("FREE"); free.setDisplayName("Free");
        free.setDescription("Get started with basic bid management");
        free.setPrice(0.0); free.setYearlyPrice(0.0);
        free.setMaxBids(5); free.setMaxEmployees(2);
        free.setAiFeatures(false); free.setMapTracking(false);
        free.setAdvancedAnalytics(false); free.setPrioritySupport(false);
        free.setCustomReports(false); free.setColor("#6b7280");
        plans.add(free);

        SubscriptionPlan basic = new SubscriptionPlan();
        basic.setName("BASIC"); basic.setDisplayName("Basic");
        basic.setDescription("Perfect for small teams");
        basic.setPrice(29.0); basic.setYearlyPrice(290.0);
        basic.setMaxBids(25); basic.setMaxEmployees(10);
        basic.setAiFeatures(true); basic.setMapTracking(false);
        basic.setAdvancedAnalytics(false); basic.setPrioritySupport(false);
        basic.setCustomReports(false); basic.setColor("#3b82f6");
        plans.add(basic);

        SubscriptionPlan pro = new SubscriptionPlan();
        pro.setName("PRO"); pro.setDisplayName("Pro");
        pro.setDescription("For growing businesses");
        pro.setPrice(79.0); pro.setYearlyPrice(790.0);
        pro.setMaxBids(100); pro.setMaxEmployees(50);
        pro.setAiFeatures(true); pro.setMapTracking(true);
        pro.setAdvancedAnalytics(true); pro.setPrioritySupport(false);
        pro.setCustomReports(true); pro.setColor("#8b5cf6");
        plans.add(pro);

        SubscriptionPlan enterprise = new SubscriptionPlan();
        enterprise.setName("ENTERPRISE"); enterprise.setDisplayName("Enterprise");
        enterprise.setDescription("Unlimited power for large teams");
        enterprise.setPrice(199.0); enterprise.setYearlyPrice(1990.0);
        enterprise.setMaxBids(-1); enterprise.setMaxEmployees(-1);
        enterprise.setAiFeatures(true); enterprise.setMapTracking(true);
        enterprise.setAdvancedAnalytics(true); enterprise.setPrioritySupport(true);
        enterprise.setCustomReports(true); enterprise.setColor("#f59e0b");
        plans.add(enterprise);

        return planRepository.saveAll(plans);
    }
}
