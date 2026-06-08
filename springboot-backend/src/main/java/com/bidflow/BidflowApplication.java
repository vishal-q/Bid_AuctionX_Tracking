package com.bidflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class BidflowApplication {
    public static void main(String[] args) {
        SpringApplication.run(BidflowApplication.class, args);
    }
}
