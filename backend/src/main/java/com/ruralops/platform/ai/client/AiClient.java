package com.ruralops.platform.ai.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.io.InputStream;
import java.net.URL;
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
            log.info("Downloading image for AI...");

            InputStream afterStream = new URL(afterUrl).openStream();

            InputStreamResource fileResource = new InputStreamResource(afterStream) {
                @Override
                public String getFilename() {
                    return "image.jpg";
                }
            };

            // Multipart body
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);  // IMPORTANT: "file" key

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity =
                    new HttpEntity<>(body, headers);

            log.info("Sending request to AI...");

            Map response = restClient.post()
                    .uri(AI_URL)
                    .body(requestEntity)
                    .retrieve()
                    .body(Map.class);

            log.info("AI response: {}", response);

            if (response == null) {
                return fallback("Null response");
            }

            Object scoreObj = response.get("score");

            if (scoreObj == null) {
                scoreObj = response.get("prediction");
            }

            if (scoreObj == null) {
                return fallback("Score missing: " + response);
            }

            double value = Double.parseDouble(scoreObj.toString());
            return normalize(value);

        } catch (Exception e) {
            log.error("AI request failed", e);
            return fallback(e.getMessage());
        }
    }

    private int normalize(double value) {
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