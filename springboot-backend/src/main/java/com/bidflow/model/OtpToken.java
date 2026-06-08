package com.bidflow.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "otp_tokens")
public class OtpToken {

    @Id
    private String id;

    private String email;
    private String otp;           // 6-digit code
    private boolean used = false;

    @Indexed(expireAfterSeconds = 300) // auto-delete after 5 minutes
    private Instant expiresAt;

    @CreatedDate
    private Instant createdAt;
}
