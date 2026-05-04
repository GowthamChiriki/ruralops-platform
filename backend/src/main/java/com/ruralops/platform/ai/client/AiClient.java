package com.ruralops.platform.ai.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.net.URL;
import java.util.Map;

@Service
public class AiClient {

    private static final Logger log =
            LoggerFactory.getLogger(AiClient.class);

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String AI_URL =
            "https://ruralops.onrender.com/predict";

    public int getCleanlinessScore(String beforeUrl, String afterUrl) {

        try {
            log.info("Downloading image from URL...");

            byte[] imageBytes;

            try (InputStream is = new URL(afterUrl).openStream()) {
                imageBytes = is.readAllBytes();
            }

            ByteArrayResource resource = new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return "image.jpg"; // required for multipart
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource); // AI expects "file"

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> request =
                    new HttpEntity<>(body, headers);

            log.info("Sending request to AI service...");

            ResponseEntity<Map> response =
                    restTemplate.postForEntity(AI_URL, request, Map.class);

            Map<?, ?> responseBody = response.getBody();

            log.info("AI response: {}", responseBody);

            if (responseBody == null) {
                return fallback("Null response");
            }

            Object scoreObj = responseBody.get("score");

            if (scoreObj == null) {
                scoreObj = responseBody.get("prediction");
            }

            if (scoreObj == null) {
                return fallback("Score missing: " + responseBody);
            }

            double value = Double.parseDouble(scoreObj.toString());
            return normalize(value);

        } catch (Exception e) {
            log.error("AI request failed", e);
            return fallback(e.getMessage());
        }
    }

    /* ========================= */

    private int normalize(double value) {
        // If AI returns 0–1 → convert to 0–100
        if (value <= 1.0) {
            return clamp((int) (value * 100));
        }
        return clamp((int) value);
    }

    private int fallback(String reason) {
        log.warn("AI fallback: {}", reason);
        return 0;
    }

    private int clamp(int score) {
        return Math.max(0, Math.min(score, 100));
    }
}