package com.ruralops.platform.secure.activation.service;

import org.springframework.stereotype.Service;

/**
 * Service responsible for handling activation key requests.
 *
 * Responsibilities:
 * - Generate activation token
 *
 * This service:
 * - Is role-agnostic
 * - Does not access repositories directly
 * - Delegates security enforcement to lower layers
 */
@Service
public class ActivationRequestService {

    private final ActivationTokenService tokenService;

    public ActivationRequestService(
            ActivationTokenService tokenService
    ) {
        this.tokenService = tokenService;
    }

    /**
     * Processes an activation key request.
     *
     * Security guarantees:
     * - Client provides only accountType and accountId
     * - Token generation enforces rate limits
     */
    public void requestActivation(
            String accountType,
            String accountId
    ) {

        // safety checks
        if (accountType == null || accountType.isBlank()) {
            throw new IllegalStateException("Account type is required");
        }
        if (accountId == null || accountId.isBlank()) {
            throw new IllegalStateException("Account ID is required");
        }

        // Generate activation token (rate-limited internally)
        tokenService.generateToken(accountType, accountId);

        // 🔥 No email sending
        // Activation key will be retrieved via status API
    }
}