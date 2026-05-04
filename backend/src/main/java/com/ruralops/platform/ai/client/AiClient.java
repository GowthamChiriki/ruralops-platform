package com.ruralops.platform.ai.client;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class AiClient {

    private final RestClient restClient;

    private static final String AI_URL =
            "https://ruralops.onrender.com/predict";

    public AiClient(RestClient.Builder builder) {
        this.restClient = builder.build();
    }

    public int getCleanlinessScore(String beforeUrl, String afterUrl) {

        try {
            Map<String, String> requestBody = Map.of(
                    "beforeImageUrl", beforeUrl,
                    "afterImageUrl", afterUrl
            );

            Map response = restClient.post()
                    .uri(AI_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            if (response == null || !response.containsKey("score")) {
                return fallback("Invalid response");
            }

            Object scoreObj = response.get("score");

            if (scoreObj instanceof Number number) {
                return clamp(number.intValue());
            }

            return fallback("Invalid score format");

        } catch (Exception e) {
            return fallback(e.getMessage());
        }
    }

    /* ========================================== */

    private int fallback(String reason) {
        System.out.println("AI fallback: " + reason);
        return 0;
    }

    private int clamp(int score) {
        return Math.max(0, Math.min(score, 100));
    }
}