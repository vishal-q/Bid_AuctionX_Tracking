package com.bidflow.controller;

import com.bidflow.repository.BidRepository;
import com.bidflow.repository.CommentRepository;
import com.bidflow.repository.NotificationRepository;
import com.bidflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final BidRepository bidRepository;
    private final CommentRepository commentRepository;
    private final NotificationRepository notificationRepository;

    // ── Clear ALL data ────────────────────────────────────────────────────────
    @DeleteMapping("/clear-all")
    public ResponseEntity<?> clearAll() {
        long users = userRepository.count();
        long bids = bidRepository.count();
        long comments = commentRepository.count();
        long notifs = notificationRepository.count();

        userRepository.deleteAll();
        bidRepository.deleteAll();
        commentRepository.deleteAll();
        notificationRepository.deleteAll();

        return ResponseEntity.ok(Map.of(
            "message", "All data cleared successfully",
            "deleted", Map.of(
                "users", users,
                "bids", bids,
                "comments", comments,
                "notifications", notifs
            )
        ));
    }
}
