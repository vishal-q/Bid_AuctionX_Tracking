package com.bidflow.controller;

import com.bidflow.model.User;
import com.bidflow.service.NotificationService;
import com.bidflow.security.AuthHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthHelper authHelper;

    @GetMapping
    public ResponseEntity<?> getAll() {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));
        return ResponseEntity.ok(notificationService.getForUser(user.getId()));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllRead() {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));
        notificationService.markAllRead(user.getId());
        return ResponseEntity.ok(Map.of("message", "All marked as read"));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable String id) {
        try {
            return ResponseEntity.ok(notificationService.markRead(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        notificationService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}
