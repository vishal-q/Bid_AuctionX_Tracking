package com.bidflow.repository;

import com.bidflow.model.Bid;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BidRepository extends MongoRepository<Bid, String> {
    Optional<Bid> findByBidNumber(String bidNumber);
    long countByStatus(String status);
    long countByPriorityAndStatusNotIn(String priority, List<String> statuses);
    List<Bid> findByAssignedTo(String assignedTo);
    List<Bid> findByClientId(String clientId);
    List<Bid> findByIdIn(List<String> ids);
}
