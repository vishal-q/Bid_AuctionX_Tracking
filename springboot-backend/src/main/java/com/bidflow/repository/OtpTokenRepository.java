package com.bidflow.repository;

import com.bidflow.model.OtpToken;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpTokenRepository extends MongoRepository<OtpToken, String> {
    Optional<OtpToken> findTopByEmailOrderByCreatedAtDesc(String email);
    void deleteByEmail(String email);
}
