package com.ruralops.platform.secure.activation.service;

import com.ruralops.platform.common.enums.ActivationTokenStatus;
import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;
import com.ruralops.platform.secure.activation.domain.ActivationToken;
import com.ruralops.platform.secure.activation.repository.ActivationTokenRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ActivationValidationService {

    private final ActivationTokenRepository tokenRepository;

    public ActivationValidationService(ActivationTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    /**
     * Validates and consumes an activation key.
     */
    public void validateAndConsume(
            String accountType,
            String accountId,
            String providedActivationKey
    ) {

        /* =========================
           Normalize inputs
           ========================= */

        if (accountType == null || accountId == null || providedActivationKey == null) {
            throw new InvalidRequestException("Invalid activation request");
        }

        accountType = accountType.trim().toUpperCase();
        accountId = accountId.trim();
        providedActivationKey = providedActivationKey.trim();

        /* =========================
           Fetch LATEST ACTIVE token (FIXED)
           ========================= */

        ActivationToken token = tokenRepository
                .findTopByAccountTypeAndAccountIdAndStatusOrderByCreatedAtDesc(
                        accountType,
                        accountId,
                        ActivationTokenStatus.ACTIVE
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "No active activation token found for account"
                        )
                );

        /* =========================
           Sync expiration
           ========================= */

        token.expireIfNecessary();

        if (token.getStatus() == ActivationTokenStatus.EXPIRED) {

            tokenRepository.save(token);

            throw new InvalidRequestException(
                    "Activation key has expired"
            );
        }

        /* =========================
           Validate key
           ========================= */

        String providedHash = hash(providedActivationKey);

        if (!token.getTokenHash().equals(providedHash)) {

            throw new InvalidRequestException(
                    "Invalid activation key"
            );
        }

        /* =========================
           Consume token
           ========================= */

        token.markUsed();

        tokenRepository.save(token);
    }

    /**
     * Hashing method used for activation keys.
     * Must match the hashing logic used when generating tokens.
     */
    private String hash(String value) {
        if (value == null) return null;

        return Integer.toHexString(
                value.trim().toUpperCase().hashCode()
        );
    }
}