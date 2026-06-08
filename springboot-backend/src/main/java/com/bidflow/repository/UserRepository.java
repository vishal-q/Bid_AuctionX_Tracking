package com.bidflow.repository;

import com.bidflow.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    boolean existsByEmail(String email);
    List<User> findByRole(String role);
    List<User> findByRoleIn(List<String> roles);
    List<User> findByRoleAndIsActive(String role, boolean isActive);
}
