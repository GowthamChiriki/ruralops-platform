package com.ruralops.platform.ai.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class AiClient {

    private static final Logger log =
            LoggerFactory.getLogger(AiClient.class);

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

            log.debug("AI request payload: {}", requestBody);

            Map response = restClient.post()
                    .uri(AI_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            log.info("AI response: {}", response);

            if (response == null) {
                return fallback("Null response");
            }

            Object scoreObj = response.get("score");

            // fallback to alternate key if needed
            if (scoreObj == null) {
                scoreObj = response.get("cleanliness_score");
            }

            if (scoreObj == null) {
                return fallback("Score not found in response: " + response);
            }

            // handle numeric response
            if (scoreObj instanceof Number number) {
                return normalize(number.doubleValue());
            }

            // handle string response
            try {
                double value = Double.parseDouble(scoreObj.toString());
                return normalize(value);
            } catch (Exception e) {
                return fallback("Invalid score format: " + scoreObj);
            }

        } catch (Exception e) {
            log.error("AI request failed", e);
            return fallback(e.getMessage());
        }
    }

    private int normalize(double value) {
        // convert 0–1 → 0–100
        if (value <= 1.0) {
            return clamp((int) (value * 100));
        }
        return clamp((int) value);
    }

    private int fallback(String reason) {
        log.warn("AI fallback triggered: {}", reason);
        return 0;
    }

    private int clamp(int score) {
        return Math.max(0, Math.min(score, 100));
    }
}