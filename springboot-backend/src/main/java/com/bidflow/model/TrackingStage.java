package com.bidflow.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrackingStage {
    // submitted, manager_review, verified, assigned, in_progress,
    // employee_submitted, manager_approval, completed, rejected
    private String stage;
    private String label;
    private Instant completedAt;
    private String completedBy;       // user id
    private String completedByName;
    private String note;
}
