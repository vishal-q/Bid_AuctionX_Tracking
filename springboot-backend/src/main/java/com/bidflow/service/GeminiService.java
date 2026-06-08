package com.bidflow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * AI Service — uses Groq API (OpenAI-compatible, free, ultra-fast Llama 3).
 * Method name kept as askGemini() so AiController needs zero changes.
 * Get free API key at: https://console.groq.com/keys
 */
@Service
@RequiredArgsConstructor
public class GeminiService {

    @Value("${app.gemini.api-key}")
    private String apiKey;

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.1-8b-instant"; // Free, fast, ChatGPT-quality

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule())
            .disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build();

    public String askGemini(String prompt) throws Exception {
        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("hf_")) {
            throw new RuntimeException("Valid Groq API key not configured. Get free key at console.groq.com");
        }

        // Groq uses OpenAI-compatible chat completions format
        Map<String, Object> requestBody = Map.of(
            "model", MODEL,
            "messages", List.of(
                Map.of("role", "user", "content", prompt)
            ),
            "max_tokens", 512,
            "temperature", 0.7
        );

        String json = objectMapper.writeValueAsString(requestBody);

        Request request = new Request.Builder()
                .url(GROQ_URL)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .post(RequestBody.create(json, MediaType.parse("application/json")))
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            String body = response.body() != null ? response.body().string() : "";

            if (!response.isSuccessful()) {
                throw new RuntimeException("Groq API error " + response.code() + ": " + body);
            }

            // OpenAI-compatible response: choices[0].message.content
            JsonNode root = objectMapper.readTree(body);
            String content = root.path("choices").path(0).path("message").path("content").asText();

            if (content == null || content.isBlank()) {
                throw new RuntimeException("Empty response from Groq API");
            }
            return content.trim();
        }
    }
}
