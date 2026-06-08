package com.bidflow.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "subscription_plans")
public class SubscriptionPlan {

    @Id
    private String id;

    private String name;           // FREE, BASIC, PRO, ENTERPRISE
    private String displayName;    // "Free", "Basic", "Pro", "Enterprise"
    private String description;
    private Double price;          // monthly price in USD
    private Double yearlyPrice;    // yearly price in USD
    private Integer maxBids;       // max active bids allowed (-1 = unlimited)
    private Integer maxEmployees;  // max employees (-1 = unlimited)
    private boolean aiFeatures;
    private boolean mapTracking;
    private boolean advancedAnalytics;
    private boolean prioritySupport;
    private boolean customReports;
    private String color;          // UI color
    private boolean isActive = true;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
