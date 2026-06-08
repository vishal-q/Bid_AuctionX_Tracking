package com.bidflow.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BidDocument {
    private String name;
    private String url;
    private Instant uploadedAt = Instant.now();
}
