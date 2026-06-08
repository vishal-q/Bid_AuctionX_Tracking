package com.bidflow.repository;

import com.bidflow.model.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends MongoRepository<Payment, String> {
    List<Payment> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Payment> findByStatusOrderByCreatedAtDesc(String status);
    List<Payment> findAllByOrderByCreatedAtDesc();
}
