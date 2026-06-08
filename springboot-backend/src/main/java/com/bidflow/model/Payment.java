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
@Document(collection = "payments")
public class Payment {

    @Id
    private String id;

    private String userId;
    private String planId;
    private String planName;

    // pending, success, failed, refunded
    private String status = "pending";

    // monthly, yearly
    private String billingCycle;

    private Double amount;
    private String currency = "USD";

    // Payment method details (masked)
    private String paymentMethod;   // card, upi, netbanking
    private String cardLast4;
    private String cardBrand;       // Visa, Mastercard, etc.
    private String upiId;

    // Transaction reference
    private String transactionId;
    private String invoiceNumber;

    // Subscription period
    private Instant periodStart;
    private Instant periodEnd;

    private String failureReason;
    private String notes;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
