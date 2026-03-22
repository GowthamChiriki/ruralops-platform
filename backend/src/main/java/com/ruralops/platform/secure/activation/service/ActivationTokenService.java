package com.ruralops.platform.secure.activation.service;

import com.ruralops.platform.common.enums.ActivationTokenStatus;
import com.ruralops.platform.common.exception.GovernanceViolationException;
import com.ruralops.platform.secure.activation.domain.ActivationToken;
import com.ruralops.platform.secure.activation.policy.ActivationPolicy;
import com.ruralops.platform.secure.activation.repository.ActivationTokenRepository;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

/**
 * Service responsible for creating and managing activation tokens.
 *
 * Enforces activation policy rules:
 * - Limits number of activation requests within a time window
 * - Ensures only one ACTIVE token per account
 * - Immediately expires older ACTIVE tokens
 */
@Service
public class ActivationTokenService {

    private final ActivationTokenRepository tokenRepository;
    private final ActivationPolicy activationPolicy;

    /**
     * Secure random generator used to create activation keys.
     */
    private final SecureRandom secureRandom = new SecureRandom();

    public ActivationTokenService(
            ActivationTokenRepository tokenRepository,
            ActivationPolicy activationPolicy
    ) {
        this.tokenRepository = tokenRepository;
        this.activationPolicy = activationPolicy;
    }

    /**
     * Generates a new activation token.
     *
     * Rules enforced:
     * - Activation requests are limited within a rolling time window
     * - Any existing ACTIVE tokens are expired before issuing a new one
     *
     * @return Raw activation key.
     *         Returned once and never stored in plain text.
     */
    public String generateToken(String accountType, String accountId) {

        // 1. Enforce activation request limit
        Instant windowStart =
                Instant.now().minus(activationPolicy.regenerationWindow());

        long attempts =
                tokenRepository.countByAccountTypeAndAccountIdAndCreatedAtAfter(
                        accountType,
                        accountId,
                        windowStart
                );

        // Rate limiting
        if (attempts >= activationPolicy.maxActivationRequestsPerWindow()) {
            throw new GovernanceViolationException(
                    "Activation key request limit exceeded. Please try again later."
            );
        }

        // 2. Expire any currently ACTIVE tokens for this account
        List<ActivationToken> activeTokens =
                tokenRepository.findAllByAccountTypeAndAccountIdAndStatus(
                        accountType,
                        accountId,
                        ActivationTokenStatus.ACTIVE
                );

        for (ActivationToken token : activeTokens) {
            token.markExpired();
        }

        if (!activeTokens.isEmpty()) {
            tokenRepository.saveAll(activeTokens);
        }

        // 3. Generate secure activation key
        String rawKey = generateSecureKey();
        String tokenHash = hash(rawKey);

        Instant expiresAt = Instant.now()
                .plus(activationPolicy.activationTokenValidity());

        ActivationToken newToken = new ActivationToken(
                accountType,
                accountId,
                tokenHash,
                expiresAt
        );

        tokenRepository.save(newToken);

        return rawKey;
    }

    /* =======================
       Internal helpers
       ======================= */

    /**
     * Generates a 128-bit secure random value.
     *
     * Returned as uppercase hexadecimal string.
     */
    private String generateSecureKey() {
        byte[] bytes = new byte[16]; // 16 bytes * 8 = 128 bits.
        secureRandom.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes).toUpperCase();
    }

    /**
     * Temporary hashing method.
     *
     * Must match the hashing logic used during validation.
     * Should be replaced with a strong algorithm (e.g., BCrypt or Argon2).
     */
    private String hash(String value) {
        if (value == null) return null;

        return Integer.toHexString(
                value.trim().toUpperCase().hashCode()
        );
    }
}
