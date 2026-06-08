package com.bidflow.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BidHistory {
    private String action;
    private String user;       // user id reference
    private String userName;
    private Instant timestamp = Instant.now();
}
