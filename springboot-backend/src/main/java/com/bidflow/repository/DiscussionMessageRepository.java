package com.bidflow.repository;

import com.bidflow.model.DiscussionMessage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DiscussionMessageRepository extends MongoRepository<DiscussionMessage, String> {
    List<DiscussionMessage> findByDiscussionIdOrderByCreatedAtAsc(String discussionId);
}

