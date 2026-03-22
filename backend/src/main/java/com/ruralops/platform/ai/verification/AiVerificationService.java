package com.ruralops.platform.ai.verification;

import org.springframework.stereotype.Service;

import java.util.Random;

/**
 * Simulates AI-based cleanliness verification.
 *
 * In the future this service will call
 * a computer vision model to compare images.
 */
@Service
public class AiVerificationService {

    private final Random random = new Random();

    /**
     * Compares before and after images.
     *
     * Returns cleanliness score (0–100).
     */
    public int evaluateCleanliness(
            String beforeImageUrl,
            String afterImageUrl
    ) {

        /*
         For now we simulate AI output.

         Future implementation will call
         a Python ML model or AI microservice.
         */

        return 40 + random.nextInt(60);
    }
}