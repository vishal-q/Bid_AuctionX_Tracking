package com.bidflow.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "discussion_messages")
public class DiscussionMessage {

    @Id
    private String id;

    private String discussionId; // roomId
    private String bidId;

    private String senderId;
    private String senderName;
    private String senderRole; // CLIENT / EMPLOYEE

    private String text;

    @CreatedDate
    private Instant createdAt;
}

