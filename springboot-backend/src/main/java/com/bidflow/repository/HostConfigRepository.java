package com.bidflow.repository;

import com.bidflow.model.HostConfig;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface HostConfigRepository extends MongoRepository<HostConfig, String> {
    List<HostConfig> findByCreatedBy(String createdBy);
}
