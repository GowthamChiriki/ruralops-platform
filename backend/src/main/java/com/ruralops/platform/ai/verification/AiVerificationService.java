package com.ruralops.platform.ai.verification;

import com.ruralops.platform.ai.client.AiClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AiVerificationService {

    private static final Logger log =
            LoggerFactory.getLogger(AiVerificationService.class);

    private final AiClient aiClient;

    public AiVerificationService(AiClient aiClient) {
        this.aiClient = aiClient;
    }

    /**
     * Evaluates cleanliness using AI model.
     * Returns score between 0–100.
     */
    public int evaluateCleanliness(
            String beforeImageUrl,
            String afterImageUrl
    ) {

        // Validation
        if (beforeImageUrl == null || afterImageUrl == null) {
            return fallback("Missing image URLs");
        }

        if (beforeImageUrl.isBlank() || afterImageUrl.isBlank()) {
            return fallback("Empty image URLs");
        }

        try {
            log.info("AI evaluation started");
            log.debug("Before image URL: {}", beforeImageUrl);
            log.debug("After image URL: {}", afterImageUrl);

            int score = aiClient.getCleanlinessScore(
                    beforeImageUrl,
                    afterImageUrl
            );

            log.info("AI score received: {}", score);

            return score;

        } catch (Exception ex) {
            log.error("AI verification failed", ex);
            return fallback(ex.getMessage());
        }
    }

    /* ====================================================== */

    private int fallback(String reason) {
        log.warn("AI verification fallback triggered: {}", reason);
        return 0;
    }
}