package com.bidflow.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.annotation.Id;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "discussions")
public class Discussion {

    @Id
    private String id;

    // Bid-based room
    private String bidId;

    // Participants (denormalized for quick checks)
    private String clientId;
    private String employeeId;

    @CreatedDate
    private Instant createdAt;
    private Instant updatedAt;
}

