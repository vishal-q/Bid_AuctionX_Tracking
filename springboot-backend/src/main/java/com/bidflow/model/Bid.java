package com.bidflow.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bids")
public class Bid {

    @Id
    private String id;

    @Indexed(unique = true, sparse = true)
    private String bidNumber;

    private String title;
    private String description;
    private String clientName;
    private String clientId;

    private Double value = 0.0;

    // new, under_review, proposal_generated, awaiting_approval, negotiation, approved, won, lost
    private String status = "new";

    // high, medium, low
    private String priority = "medium";

    private Instant deadline;
    private String assignedTo;   // user id
    private String createdBy;    // user id
    private String department;

    private Integer progress = 0;
    private Integer aiWinProbability;

    // positive, neutral, negative
    private String clientSentiment;
    private String aiSummary;

    private List<BidDocument> documents = new ArrayList<>();
    private List<BidHistory> history = new ArrayList<>();
    private List<String> tags = new ArrayList<>();

    // Workflow fields
    private String requirements = "";
    private Double budget = 0.0;

    // pending, verified, rejected
    private String verificationStatus = "pending";
    private String verificationNote = "";
    private String verifiedBy;
    private Instant verifiedAt;

    private String completionNote = "";
    private Instant completionSubmittedAt;
    private String managerApprovalNote = "";

    private List<TrackingStage> trackingStages = new ArrayList<>();

    private Integer clientRating;
    private String clientFeedback = "";

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
