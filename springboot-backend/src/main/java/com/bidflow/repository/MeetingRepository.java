package com.bidflow.repository;

import com.bidflow.model.Meeting;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeetingRepository extends MongoRepository<Meeting, String> {
    List<Meeting> findByEmployeeId(String employeeId);
    List<Meeting> findByClientId(String clientId);
    List<Meeting> findByBidId(String bidId);
    List<Meeting> findByEmployeeIdOrClientId(String employeeId, String clientId);
}
