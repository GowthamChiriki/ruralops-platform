package com.ruralops.platform.ai.verification;

import com.ruralops.platform.ai.client.AiClient;
import org.springframework.stereotype.Service;

/**
 * Handles AI-based cleanliness verification.
 *
 * Calls external ML service to evaluate
 * before/after images and return a score.
 */
@Service
public class AiVerificationService {

    private final AiClient aiClient;

    public AiVerificationService(AiClient aiClient) {
        this.aiClient = aiClient;
    }

    /**
     * Evaluates cleanliness using AI model.
     *
     * Returns score between 0–100.
     */
    public int evaluateCleanliness(
            String beforeImageUrl,
            String afterImageUrl
    ) {

        // Basic validation (optional but safe)
        if (beforeImageUrl == null || afterImageUrl == null) {
            return fallback("Missing image URLs");
        }

        if (beforeImageUrl.isBlank() || afterImageUrl.isBlank()) {
            return fallback("Empty image URLs");
        }

        try {
            return aiClient.getCleanlinessScore(
                    beforeImageUrl,
                    afterImageUrl
            );

        } catch (Exception ex) {
            return fallback(ex.getMessage());
        }
    }

    /* ====================================================== */

    private int fallback(String reason) {
        System.out.println("AI Verification fallback: " + reason);

        // Safe fallback score
        return 0;
    }
}