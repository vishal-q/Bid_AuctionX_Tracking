package com.bidflow.controller;

import com.bidflow.model.Discussion;
import com.bidflow.model.DiscussionMessage;
import com.bidflow.model.User;
import com.bidflow.repository.DiscussionRepository;
import com.bidflow.security.AuthHelper;
import com.bidflow.service.DiscussionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/discussions")
@RequiredArgsConstructor
public class DiscussionController {

    private final DiscussionService discussionService;
    private final DiscussionRepository discussionRepository;
    private final AuthHelper authHelper;

    @PostMapping
    public ResponseEntity<?> createOrGet(@RequestBody Map<String, String> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));

        String bidId = body.get("bidId");
        if (bidId == null || bidId.isBlank()) return ResponseEntity.badRequest().body(Map.of("message", "bidId is required"));

        Discussion d = discussionService.ensureParticipantsInitialized(bidId, user);

        // Access control: CLIENT must match clientId; EMPLOYEE must match assignedTo
        boolean isClient = "CLIENT".equals(user.getRole()) && user.getId().equals(d.getClientId());
        boolean isEmployee = "EMPLOYEE".equals(user.getRole()) && user.getId().equals(d.getEmployeeId());

        if (!isClient && !isEmployee) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        }

        return ResponseEntity.ok(discussionService.asRoomPayload(d));
    }

    @GetMapping("/{bidId}")
    public ResponseEntity<?> getRoomForBid(@PathVariable String bidId) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));

        Discussion d = discussionRepository.findByBidId(bidId).orElse(null);
        if (d == null) {
            // If room doesn't exist yet, allow client/employee to create by calling POST
            return ResponseEntity.status(404).body(Map.of("message", "Room not found"));
        }

        boolean isClient = "CLIENT".equals(user.getRole()) && user.getId().equals(d.getClientId());
        boolean isEmployee = "EMPLOYEE".equals(user.getRole()) && user.getId().equals(d.getEmployeeId());

        if (!isClient && !isEmployee) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        }

        return ResponseEntity.ok(discussionService.asRoomPayload(d));
    }

    @GetMapping("/messages/{roomId}")
    public ResponseEntity<?> getMessages(@PathVariable String roomId) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));

        Discussion d = discussionRepository.findById(roomId).orElse(null);
        if (d == null) return ResponseEntity.status(404).body(Map.of("message", "Room not found"));

        boolean isClient = "CLIENT".equals(user.getRole()) && user.getId().equals(d.getClientId());
        boolean isEmployee = "EMPLOYEE".equals(user.getRole()) && user.getId().equals(d.getEmployeeId());

        if (!isClient && !isEmployee) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        }

        List<DiscussionMessage> messages = discussionService.getMessages(roomId);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/messages/{roomId}")
    public ResponseEntity<?> addMessage(@PathVariable String roomId, @RequestBody Map<String, String> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));

        String text = body.get("text");
        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "text is required"));
        }

        Discussion d = discussionRepository.findById(roomId).orElse(null);
        if (d == null) return ResponseEntity.status(404).body(Map.of("message", "Room not found"));

        boolean isClient = "CLIENT".equals(user.getRole()) && user.getId().equals(d.getClientId());
        boolean isEmployee = "EMPLOYEE".equals(user.getRole()) && user.getId().equals(d.getEmployeeId());

        if (!isClient && !isEmployee) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        }

        // Restriction: since strict content classification is hard without NLP,
        // we just ensure discussion is bid-specific + role-specific. UI will suggest project-only.
        DiscussionMessage saved = discussionService.addMessage(roomId, text, user);
        if (saved == null) return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to save"));
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}

