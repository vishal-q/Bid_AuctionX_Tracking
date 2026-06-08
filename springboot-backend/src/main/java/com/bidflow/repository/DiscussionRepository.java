package com.bidflow.repository;

import com.bidflow.model.Discussion;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface DiscussionRepository extends MongoRepository<Discussion, String> {
    Optional<Discussion> findByBidId(String bidId);
}

