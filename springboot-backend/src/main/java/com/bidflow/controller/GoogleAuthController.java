package com.bidflow.controller;

import com.bidflow.model.User;
import com.bidflow.repository.UserRepository;
import com.bidflow.security.JwtUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class GoogleAuthController {

    @Value("${app.google.client-id}")
    private String clientId;

    @Value("${app.google.client-secret}")
    private String clientSecret;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule())
            .disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build();

    private static final String CALLBACK_URL = "http://localhost:8080/api/auth/google/callback";

    // ── Initiate Google OAuth ─────────────────────────────────────────────────
    @GetMapping("/google")
    public RedirectView initiateGoogleAuth() {
        String authUrl = "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + clientId
                + "&redirect_uri=" + URLEncoder.encode(CALLBACK_URL, StandardCharsets.UTF_8)
                + "&response_type=code"
                + "&scope=" + URLEncoder.encode("openid email profile", StandardCharsets.UTF_8)
                + "&access_type=offline";
        return new RedirectView(authUrl);
    }

    // ── Google OAuth Callback ─────────────────────────────────────────────────
    @GetMapping("/google/callback")
    public RedirectView googleCallback(@RequestParam(required = false) String code,
                                       @RequestParam(required = false) String error) {
        if (error != null || code == null) {
            return new RedirectView(frontendUrl + "/login?error=google_failed");
        }

        try {
            // Exchange code for tokens
            String tokenUrl = "https://oauth2.googleapis.com/token";
            String tokenBody = "code=" + URLEncoder.encode(code, StandardCharsets.UTF_8)
                    + "&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                    + "&client_secret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8)
                    + "&redirect_uri=" + URLEncoder.encode(CALLBACK_URL, StandardCharsets.UTF_8)
                    + "&grant_type=authorization_code";

            Request tokenRequest = new Request.Builder()
                    .url(tokenUrl)
                    .post(okhttp3.RequestBody.create(tokenBody,
                            okhttp3.MediaType.parse("application/x-www-form-urlencoded")))
                    .build();

            String accessToken;
            try (Response tokenResponse = httpClient.newCall(tokenRequest).execute()) {
                String responseBody = tokenResponse.body().string();
                JsonNode tokenJson = objectMapper.readTree(responseBody);
                accessToken = tokenJson.path("access_token").asText();
                if (accessToken == null || accessToken.isBlank()) {
                    System.err.println("Google token exchange failed: " + responseBody);
                    return new RedirectView(frontendUrl + "/login?error=google_failed");
                }
            }

            // Get user info
            Request userInfoRequest = new Request.Builder()
                    .url("https://www.googleapis.com/oauth2/v2/userinfo")
                    .header("Authorization", "Bearer " + accessToken)
                    .build();

            JsonNode userInfo;
            try (Response userInfoResponse = httpClient.newCall(userInfoRequest).execute()) {
                userInfo = objectMapper.readTree(userInfoResponse.body().string());
            }

            String googleId = userInfo.path("id").asText();
            String email = userInfo.path("email").asText().toLowerCase();
            String name = userInfo.path("name").asText();
            String avatar = userInfo.path("picture").asText();

            if (email.isBlank()) {
                return new RedirectView(frontendUrl + "/login?error=google_failed");
            }

            // Find or create user
            User user = userRepository.findByGoogleId(googleId).orElse(null);
            if (user == null) {
                user = userRepository.findByEmail(email).orElse(null);
                if (user != null) {
                    // Link Google to existing account
                    user.setGoogleId(googleId);
                    user.setAuthProvider("google");
                    if ((user.getAvatar() == null || user.getAvatar().isBlank()) && !avatar.isBlank()) {
                        user.setAvatar(avatar);
                    }
                    user.setLastLogin(Instant.now());
                    userRepository.save(user);
                } else {
                    // Create new user
                    user = new User();
                    user.setName(name);
                    user.setEmail(email);
                    user.setGoogleId(googleId);
                    user.setAuthProvider("google");
                    user.setAvatar(avatar);
                    user.setRole("CLIENT");
                    user.setCompany("Not specified");
                    user.setLastLogin(Instant.now());
                    userRepository.save(user);
                }
            } else {
                user.setLastLogin(Instant.now());
                userRepository.save(user);
            }

            String jwtToken = jwtUtil.generateToken(user.getId());
            user.setPassword(null);
            // Use same approach as Node.js — URLSearchParams style encoding
            String userJson = objectMapper.writeValueAsString(user);
            String encodedToken = URLEncoder.encode(jwtToken, StandardCharsets.UTF_8);
            String encodedUser = URLEncoder.encode(userJson, StandardCharsets.UTF_8);

            return new RedirectView(frontendUrl + "/auth/google/success?token=" + encodedToken + "&user=" + encodedUser);

        } catch (Exception e) {
            System.err.println("Google OAuth error: " + e.getMessage());
            e.printStackTrace();
            return new RedirectView(frontendUrl + "/login?error=google_failed");
        }
    }
}
