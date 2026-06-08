package com.bidflow.repository;

import com.bidflow.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserOrderByCreatedAtDesc(String userId);
    List<Notification> findTop50ByUserOrderByCreatedAtDesc(String userId);
    long countByUserAndRead(String userId, boolean read);
}
