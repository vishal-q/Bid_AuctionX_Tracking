package com.bidflow.controller;

import com.bidflow.dto.AuthResponse;
import com.bidflow.dto.LoginRequest;
import com.bidflow.dto.RegisterRequest;
import com.bidflow.model.User;
import com.bidflow.repository.UserRepository;
import com.bidflow.security.AuthHelper;
import com.bidflow.security.JwtUtil;
import com.bidflow.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final AuthHelper authHelper;
    private final OtpService otpService;

    private static final Pattern EMAIL_REGEX =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final List<String> VALID_ROLES =
            Arrays.asList("CLIENT", "EMPLOYEE", "MANAGER", "ADMIN");

    // ── Register ─────────────────────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        String name = req.getName() != null ? req.getName().trim() : null;
        String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase() : null;
        String password = req.getPassword();
        String role = VALID_ROLES.contains(req.getRole()) ? req.getRole() : "CLIENT";
        String company = req.getCompany() != null ? req.getCompany().trim() : null;

        if (name == null || name.length() < 2)
            return ResponseEntity.badRequest().body(Map.of("message", "Full name is required"));
        if (email == null || !EMAIL_REGEX.matcher(email).matches())
            return ResponseEntity.badRequest().body(Map.of("message", "Enter a valid email address"));
        if (password == null || password.length() < 6)
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters"));

        // Company required for non-employees
        if (!"EMPLOYEE".equals(role) && (company == null || company.length() < 2))
            return ResponseEntity.badRequest().body(Map.of("message", "Company name is required"));

        // Employee-specific validations
        if ("EMPLOYEE".equals(role)) {
            if (req.getSpecialization() == null || req.getSpecialization().trim().isEmpty())
                return ResponseEntity.badRequest().body(Map.of("message", "Specialization/field is required for employees"));
            if (req.getLinkedinUrl() == null || req.getLinkedinUrl().trim().isEmpty())
                return ResponseEntity.badRequest().body(Map.of("message", "LinkedIn URL is required for employees"));
            if (req.getGithubUrl() == null || req.getGithubUrl().trim().isEmpty())
                return ResponseEntity.badRequest().body(Map.of("message", "GitHub URL is required for employees"));
            if (req.getProjects() == null || req.getProjects().size() < 3)
                return ResponseEntity.badRequest().body(Map.of("message", "At least 3 projects are required for employees"));
            for (com.bidflow.model.User.EmployeeProject p : req.getProjects()) {
                if (p.getTitle() == null || p.getTitle().trim().isEmpty())
                    return ResponseEntity.badRequest().body(Map.of("message", "Each project must have a title"));
            }
        }

        if (userRepository.existsByEmail(email))
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered"));

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setCompany(company != null ? company : "");
        user.setPhone(req.getPhone());

        // Save employee bio data
        if ("EMPLOYEE".equals(role)) {
            user.setLinkedinUrl(req.getLinkedinUrl());
            user.setGithubUrl(req.getGithubUrl());
            user.setSpecialization(req.getSpecialization());
            user.setYearsOfExperience(req.getYearsOfExperience());
            user.setExperienceProof(req.getExperienceProof());
            user.setProjects(req.getProjects());
        }

        User saved = userRepository.save(user);
        saved.setPassword(null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Account created. Please login.", "user", saved));
    }

    // ── Login — Step 1: verify credentials, send OTP ─────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase() : null;
        String password = req.getPassword();

        if (email == null || !EMAIL_REGEX.matcher(email).matches())
            return ResponseEntity.badRequest().body(Map.of("message", "Enter a valid email address"));
        if (password == null || password.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || !passwordEncoder.matches(password, user.getPassword()))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid credentials"));

        // Credentials valid — send OTP async (non-blocking)
        try {
            otpService.sendOtp(email, user.getName());
        } catch (Exception e) {
            System.err.println("OTP send error: " + e.getMessage());
            // Still return OTP required — OTP saved in DB even if email fails
        }
        return ResponseEntity.ok(Map.of(
            "message", "OTP sent to your email",
            "otpRequired", true,
            "email", email
        ));
    }

    // ── Login — Step 2: verify OTP, return JWT ────────────────────────────────
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");

        if (email == null || otp == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Email and OTP are required"));

        if (!otpService.verifyOtp(email.trim().toLowerCase(), otp.trim()))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or expired OTP. Please try again."));

        User user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        if (user == null)
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));

        user.setLastLogin(Instant.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId());
        user.setPassword(null);
        return ResponseEntity.ok(new AuthResponse(token, user));
    }

    // ── Resend OTP ────────────────────────────────────────────────────────────
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));

        User user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        if (user == null)
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));

        try {
            otpService.sendOtp(email.trim().toLowerCase(), user.getName());
            return ResponseEntity.ok(Map.of("message", "OTP resent successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to send OTP: " + e.getMessage()));
        }
    }

    // ── Get profile ───────────────────────────────────────────────────────────
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));
        // Fetch fresh from DB (demo user won't have full data)
        if ("demo-user".equals(user.getId())) return ResponseEntity.ok(user);
        User fresh = userRepository.findById(user.getId()).orElse(user);
        fresh.setPassword(null);
        return ResponseEntity.ok(fresh);
    }

    // ── Update profile ────────────────────────────────────────────────────────
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));
        if ("demo-user".equals(user.getId())) return ResponseEntity.ok(user);

        User dbUser = userRepository.findById(user.getId()).orElse(null);
        if (dbUser == null) return ResponseEntity.status(404).body(Map.of("message", "User not found"));

        if (body.containsKey("name")) dbUser.setName((String) body.get("name"));
        if (body.containsKey("company")) dbUser.setCompany((String) body.get("company"));
        if (body.containsKey("phone")) dbUser.setPhone((String) body.get("phone"));

        // Employee bio fields
        if (body.containsKey("linkedinUrl")) dbUser.setLinkedinUrl((String) body.get("linkedinUrl"));
        if (body.containsKey("githubUrl")) dbUser.setGithubUrl((String) body.get("githubUrl"));
        if (body.containsKey("specialization")) dbUser.setSpecialization((String) body.get("specialization"));
        if (body.containsKey("experienceProof")) dbUser.setExperienceProof((String) body.get("experienceProof"));
        if (body.containsKey("yearsOfExperience") && body.get("yearsOfExperience") != null)
            dbUser.setYearsOfExperience(((Number) body.get("yearsOfExperience")).intValue());
        if (body.containsKey("projects") && body.get("projects") != null) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                String json = mapper.writeValueAsString(body.get("projects"));
                java.util.List<User.EmployeeProject> projects = mapper.readValue(json,
                    mapper.getTypeFactory().constructCollectionType(java.util.List.class, User.EmployeeProject.class));
                dbUser.setProjects(projects);
            } catch (Exception ignored) {}
        }

        User saved = userRepository.save(dbUser);
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }

    // ── Change password ───────────────────────────────────────────────────────
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));

        String current = body.get("current");
        String newPassword = body.get("newPassword");
        if (current == null || newPassword == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Current and new password required"));

        User dbUser = userRepository.findById(user.getId()).orElse(null);
        if (dbUser == null || !passwordEncoder.matches(current, dbUser.getPassword()))
            return ResponseEntity.badRequest().body(Map.of("message", "Current password is incorrect"));

        dbUser.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(dbUser);
        return ResponseEntity.ok(Map.of("message", "Password updated"));
    }

    // ── Forgot password (stub) ────────────────────────────────────────────────
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(Map.of("message", "Password reset email sent (demo mode)"));
    }

    // ── Get all users (Manager/Admin only) ────────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<?> getUsers(@RequestParam(required = false) String role) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));
        if (!List.of("MANAGER", "ADMIN").contains(user.getRole()))
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));

        List<User> users;
        if (role != null && !role.isBlank()) {
            users = userRepository.findByRole(role.toUpperCase());
        } else {
            users = userRepository.findAll();
        }
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    // ── Get single user (Manager/Admin only) ──────────────────────────────────
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        User user = authHelper.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Not authorized"));
        if (!List.of("MANAGER", "ADMIN").contains(user.getRole()))
            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));

        User found = userRepository.findById(id).orElse(null);
        if (found == null) return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        found.setPassword(null);
        return ResponseEntity.ok(found);
    }
}
