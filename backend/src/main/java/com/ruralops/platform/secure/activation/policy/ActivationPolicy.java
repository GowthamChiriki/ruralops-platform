package com.ruralops.platform.secure.activation.policy;

import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Defines security rules related to account activation.
 *
 * These rules apply uniformly to all account types
 * (MAO, VAO, Citizen, Worker, DAO, etc.).
 *
 * Centralizing these values ensures consistent enforcement
 * across the system.
 */
@Component
public class ActivationPolicy {

    /**
     * Returns the duration for which an activation token remains valid.
     *
     * After this period, the token must not be accepted.
     */
    public Duration activationTokenValidity() {
        return Duration.ofMinutes(10);
    }

    /**
     * Returns the time window used to track activation
     * regeneration attempts.
     *
     * Request limits are evaluated within this period.
     */
    public Duration regenerationWindow() {
        return Duration.ofHours(24);
    }

    /**
     * Returns the maximum number of activation requests
     * allowed within a single regeneration window.
     */
    public int maxActivationRequestsPerWindow() {
        return 3;
    }
}
