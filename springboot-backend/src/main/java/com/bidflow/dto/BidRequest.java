package com.bidflow.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

@Data
public class BidRequest {
    private String title;
    private String description;
    private String clientName;
    private String clientId;
    private Double value;
    private String status;
    private String priority;

    // Accept both ISO Instant ("2026-06-02T00:00:00Z") and date string ("2026-06-02")
    private String deadline;

    private String assignedTo;
    private String department;
    private Integer progress;
    private Integer aiWinProbability;
    private String clientSentiment;
    private String aiSummary;
    private java.util.List<String> tags;
    private String requirements;
    private Double budget;
    private String verificationStatus;
    private String verificationNote;
    private String completionNote;
    private String managerApprovalNote;
    private Integer clientRating;
    private String clientFeedback;

    // Convert deadline string to Instant safely
    public Instant getDeadlineAsInstant() {
        if (deadline == null || deadline.isBlank()) return null;
        try {
            // Try ISO instant first (e.g. "2026-06-02T00:00:00.000Z")
            return Instant.parse(deadline);
        } catch (Exception e) {
            try {
                // Try date-only format (e.g. "2026-06-02")
                return LocalDate.parse(deadline).atStartOfDay().toInstant(ZoneOffset.UTC);
            } catch (Exception e2) {
                return null;
            }
        }
    }
}
