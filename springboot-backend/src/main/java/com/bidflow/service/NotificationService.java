package com.bidflow.service;

import com.bidflow.model.Notification;
import com.bidflow.model.User;
import com.bidflow.repository.NotificationRepository;
import com.bidflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public void createNotif(String userId, String title, String message, String type, String bidId) {
        if (userId == null || userId.equals("demo-user")) return;
        Notification n = new Notification();
        n.setUser(userId);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type != null ? type : "info");
        n.setBid(bidId);
        notificationRepository.save(n);
    }

    public void notifyManagers(String title, String message, String type, String bidId) {
        List<User> managers = userRepository.findByRoleIn(List.of("MANAGER", "ADMIN"));
        for (User m : managers) {
            createNotif(m.getId(), title, message, type, bidId);
        }
    }

    public List<Notification> getForUser(String userId) {
        return notificationRepository.findTop50ByUserOrderByCreatedAtDesc(userId);
    }

    public void markAllRead(String userId) {
        List<Notification> notifs = notificationRepository.findByUserOrderByCreatedAtDesc(userId);
        notifs.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifs);
    }

    public Notification markRead(String id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        n.setRead(true);
        return notificationRepository.save(n);
    }

    public void delete(String id) {
        notificationRepository.deleteById(id);
    }
}
