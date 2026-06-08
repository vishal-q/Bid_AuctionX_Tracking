package com.bidflow.dto;

import com.bidflow.model.User;
import lombok.Data;

import java.util.List;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String role;
    private String company;
    private String phone;

    // Employee-specific bio fields
    private String linkedinUrl;
    private String githubUrl;
    private String specialization;
    private Integer yearsOfExperience;
    private String experienceProof;
    private List<User.EmployeeProject> projects;
}
