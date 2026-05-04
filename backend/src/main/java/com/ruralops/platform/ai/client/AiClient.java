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
            byte[] imageBytes;
            try (InputStream is = new URL(afterUrl).openStream()) {
                imageBytes = is.readAllBytes();
            }

            ByteArrayResource resource = new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return "image.jpg";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> request =
                    new HttpEntity<>(body, headers);

            ResponseEntity<Map> response =
                    restTemplate.postForEntity(AI_URL, request, Map.class);

            Map<?, ?> responseBody = response.getBody();

            log.info("AI response: {}", responseBody);

            if (responseBody == null) {
                return fallback("Null response");
            }

            // ✅ Extract class + confidence
            Object classObj = responseBody.get("class");
            Object confidenceObj = responseBody.get("confidence");

            if (confidenceObj == null) {
                return fallback("Confidence missing: " + responseBody);
            }

            double confidence = Double.parseDouble(confidenceObj.toString());

            int score = normalize(confidence);

            //  Optional: adjust score based on class
            if (classObj != null) {
                String label = classObj.toString();

                if ("dirty".equalsIgnoreCase(label)) {
                    score = 100 - score; // invert score
                }
            }

            return score;

        } catch (Exception e) {
            log.error("AI request failed", e);
            return fallback(e.getMessage());
        }
    }

    /* ========================= */

    private int normalize(double value) {
        return clamp((int) (value * 100));
    }

    private int fallback(String reason) {
        log.warn("AI fallback: {}", reason);
        return 0;
    }

    private int clamp(int score) {
        return Math.max(0, Math.min(score, 100));
    }
}