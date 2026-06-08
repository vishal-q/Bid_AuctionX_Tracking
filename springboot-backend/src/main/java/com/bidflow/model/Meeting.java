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
@Document(collection = "meetings")
public class Meeting {

    @Id
    private String id;

    private String bidId;

    private String employeeId;
    private String employeeName;
    private String employeeEmail;

    private String clientId;
    private String clientName;
    private String clientEmail;

    private String title;

    private Instant scheduledTime;

    private String videoplatform; // GOOGLE_MEET, WHATSAPP, ZOOM, TEAMS, CUSTOM
    private String videoLink;

    private String status = "SCHEDULED"; // SCHEDULED, COMPLETED, CANCELLED

    private String notes;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
