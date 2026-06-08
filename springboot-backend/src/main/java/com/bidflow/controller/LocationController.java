package com.bidflow.controller;

import com.bidflow.model.Bid;
import com.bidflow.model.User;
import com.bidflow.repository.BidRepository;
import com.bidflow.repository.UserRepository;
import com.bidflow.security.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/location")
@RequiredArgsConstructor
public class LocationController {

    private final UserRepository userRepository;
    private final BidRepository bidRepository;
    private final AuthHelper authHelper;

    // ── Update my location ────────────────────────────────────────────────────
    @PatchMapping("/update")
    public ResponseEntity<?> updateLocation(@RequestBody Map<String, Object> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));
        if ("demo-user".equals(user.getId()))
            return ResponseEntity.ok(Map.of("message", "Demo user location updated"));

        User dbUser = userRepository.findById(user.getId()).orElse(null);
        if (dbUser == null) return ResponseEntity.status(404).body(Map.of("message", "User not found"));

        if (body.get("latitude") != null)
            dbUser.setLatitude(((Number) body.get("latitude")).doubleValue());
        if (body.get("longitude") != null)
            dbUser.setLongitude(((Number) body.get("longitude")).doubleValue());
        if (body.get("locationName") != null)
            dbUser.setLocationName((String) body.get("locationName"));
        if (body.get("locationSharing") != null)
            dbUser.setLocationSharing((Boolean) body.get("locationSharing"));

        dbUser.setLocationUpdatedAt(Instant.now());
        userRepository.save(dbUser);

        return ResponseEntity.ok(Map.of(
            "message", "Location updated",
            "latitude", dbUser.getLatitude(),
            "longitude", dbUser.getLongitude(),
            "locationUpdatedAt", dbUser.getLocationUpdatedAt()
        ));
    }

    // ── Get all users with location (Manager/Admin only) ──────────────────────
    @GetMapping("/all")
    public ResponseEntity<?> getAllLocations() {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));
        if (!List.of("MANAGER", "ADMIN").contains(user.getRole()))
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));

        List<User> users = userRepository.findAll();
        List<Map<String, Object>> locations = users.stream()
            .filter(u -> u.getLatitude() != null && u.getLongitude() != null && u.isLocationSharing())
            .map(this::buildLocationMap)
            .collect(Collectors.toList());

        return ResponseEntity.ok(locations);
    }

    // ── Get my location ───────────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<?> getMyLocation() {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));
        if ("demo-user".equals(user.getId()))
            return ResponseEntity.ok(Map.of("locationSharing", false));

        User dbUser = userRepository.findById(user.getId()).orElse(null);
        if (dbUser == null) return ResponseEntity.status(404).body(Map.of("message", "User not found"));

        return ResponseEntity.ok(Map.of(
            "latitude", dbUser.getLatitude() != null ? dbUser.getLatitude() : 0.0,
            "longitude", dbUser.getLongitude() != null ? dbUser.getLongitude() : 0.0,
            "locationName", dbUser.getLocationName() != null ? dbUser.getLocationName() : "",
            "locationSharing", dbUser.isLocationSharing(),
            "locationUpdatedAt", dbUser.getLocationUpdatedAt() != null ? dbUser.getLocationUpdatedAt().toString() : ""
        ));
    }

    // ── Toggle location sharing ───────────────────────────────────────────────
    @PatchMapping("/toggle-sharing")
    public ResponseEntity<?> toggleSharing(@RequestBody Map<String, Object> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));
        if ("demo-user".equals(user.getId()))
            return ResponseEntity.ok(Map.of("locationSharing", false));

        User dbUser = userRepository.findById(user.getId()).orElse(null);
        if (dbUser == null) return ResponseEntity.status(404).body(Map.of("message", "User not found"));

        boolean sharing = Boolean.TRUE.equals(body.get("locationSharing"));
        dbUser.setLocationSharing(sharing);
        userRepository.save(dbUser);

        return ResponseEntity.ok(Map.of("locationSharing", sharing, "message",
            sharing ? "Location sharing enabled" : "Location sharing disabled"));
    }

    // ── Bid-context locations (role-based visibility) ─────────────────────────
    // CLIENT  → sees managers always + assigned employee after assignment
    // EMPLOYEE→ sees managers + clients of their assigned bids
    // MANAGER → sees everyone with location sharing on
    @GetMapping("/bid-context")
    public ResponseEntity<?> getBidContextLocations() {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));
        if ("demo-user".equals(user.getId())) return ResponseEntity.ok(List.of());

        // Manager/Admin — see all
        if (List.of("MANAGER", "ADMIN").contains(user.getRole())) {
            List<Map<String, Object>> locs = userRepository.findAll().stream()
                .filter(u -> u.getLatitude() != null && u.getLongitude() != null && u.isLocationSharing())
                .map(this::buildLocationMap)
                .collect(Collectors.toList());
            return ResponseEntity.ok(locs);
        }

        Set<String> visibleUserIds = new HashSet<>();

        if ("CLIENT".equals(user.getRole())) {
            // Always show all managers/admins with location sharing on
            userRepository.findByRoleIn(List.of("MANAGER", "ADMIN")).forEach(m -> {
                if (m.isLocationSharing() && m.getLatitude() != null) visibleUserIds.add(m.getId());
            });
            // Show assigned employee after bid is assigned (not new/under_review)
            List<Bid> myBids = bidRepository.findByClientId(user.getId());
            for (Bid bid : myBids) {
                if (bid.getAssignedTo() != null &&
                    !List.of("new", "under_review").contains(bid.getStatus())) {
                    visibleUserIds.add(bid.getAssignedTo());
                }
                if (bid.getVerifiedBy() != null) visibleUserIds.add(bid.getVerifiedBy());
                if (bid.getCreatedBy() != null) visibleUserIds.add(bid.getCreatedBy());
            }
        }

        if ("EMPLOYEE".equals(user.getRole())) {
            // Always show all managers/admins
            userRepository.findByRoleIn(List.of("MANAGER", "ADMIN")).forEach(m -> {
                if (m.isLocationSharing() && m.getLatitude() != null) visibleUserIds.add(m.getId());
            });
            // Show clients of assigned bids
            List<Bid> assignedBids = bidRepository.findByAssignedTo(user.getId());
            for (Bid bid : assignedBids) {
                if (bid.getClientId() != null) visibleUserIds.add(bid.getClientId());
                if (bid.getCreatedBy() != null) visibleUserIds.add(bid.getCreatedBy());
                if (bid.getVerifiedBy() != null) visibleUserIds.add(bid.getVerifiedBy());
            }
        }

        // Remove self
        visibleUserIds.remove(user.getId());

        List<Map<String, Object>> result = visibleUserIds.stream()
            .map(id -> userRepository.findById(id).orElse(null))
            .filter(u -> u != null && u.getLatitude() != null && u.getLongitude() != null && u.isLocationSharing())
            .map(this::buildLocationMap)
            .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private Map<String, Object> buildLocationMap(User u) {
        Map<String, Object> m = new java.util.HashMap<>();
        m.put("id", u.getId());
        m.put("name", u.getName() != null ? u.getName() : "");
        m.put("role", u.getRole() != null ? u.getRole() : "");
        m.put("email", u.getEmail() != null ? u.getEmail() : "");
        m.put("company", u.getCompany() != null ? u.getCompany() : "");
        m.put("avatar", u.getAvatar() != null ? u.getAvatar() : "");
        m.put("latitude", u.getLatitude());
        m.put("longitude", u.getLongitude());
        m.put("locationName", u.getLocationName() != null ? u.getLocationName() : "");
        m.put("locationUpdatedAt", u.getLocationUpdatedAt() != null ? u.getLocationUpdatedAt().toString() : "");
        m.put("locationSharing", u.isLocationSharing());
        return m;
    }
}
