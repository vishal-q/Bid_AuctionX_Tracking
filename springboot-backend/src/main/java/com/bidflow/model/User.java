package com.bidflow.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private String role = "CLIENT"; // CLIENT, EMPLOYEE, MANAGER, ADMIN

    private String company;

    private String phone;

    private boolean isActive = true;

    private Instant lastLogin;

    @Indexed(unique = true, sparse = true)
    private String googleId;

    private String authProvider = "local"; // local, google

    private String avatar;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    // Live location tracking
    private Double latitude;
    private Double longitude;
    private String locationName;       // reverse-geocoded city/area name
    private Instant locationUpdatedAt; // when location was last updated
    private boolean locationSharing = false; // user opted in to share location

    // Subscription
    private String subscriptionPlan = "FREE";     // FREE, BASIC, PRO, ENTERPRISE
    private String subscriptionStatus = "active"; // active, cancelled, expired, trial
    private Instant subscriptionStart;
    private Instant subscriptionEnd;
    private String billingCycle = "monthly";      // monthly, yearly

    // Employee Bio Data
    private String linkedinUrl;
    private String githubUrl;
    private String specialization;        // field of expertise e.g. "Electrical Engineering"
    private Integer yearsOfExperience;
    private String experienceProof;       // description / certificate info
    private java.util.List<EmployeeProject> projects = new java.util.ArrayList<>();

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class EmployeeProject {
        private String title;
        private String description;
        private String techStack;         // e.g. "Java, Spring Boot, React"
        private String projectUrl;        // optional GitHub/live link
    }
}
