package com.ruralops.platform.secure.activation.service;

import com.ruralops.platform.secure.activation.notification.ActivationEmailService;
import com.ruralops.platform.secure.activation.resolver.AccountContactResolver;
import com.ruralops.platform.secure.activation.resolver.AccountContactResolver.ResolvedContact;
import org.springframework.stereotype.Service;

/**
 * Service responsible for handling activation key requests.
 *
 * Responsibilities:
 * - Resolve official contact details
 * - Generate activation token
 * - Send activation email
 *
 * This service:
 * - Is role-agnostic
 * - Does not access repositories directly
 * - Delegates security enforcement to lower layers
 */
@Service
public class ActivationRequestService {

    private final ActivationTokenService tokenService;
    private final ActivationEmailService emailService;
    private final AccountContactResolver contactResolver;

    public ActivationRequestService(
            ActivationTokenService tokenService,
            ActivationEmailService emailService,
            AccountContactResolver contactResolver
    ) {
        this.tokenService = tokenService;
        this.emailService = emailService;
        this.contactResolver = contactResolver;
    }

    /**
     * Processes an activation key request.
     *
     * Security guarantees:
     * - Client provides only accountType and accountId
     * - Email and display name are resolved internally
     * - Token generation enforces rate limits
     * - Activation key is sent only to the registered contact
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

        // Resolve official contact details from system records
        ResolvedContact contact =
                contactResolver.resolve(accountType, accountId);

        // Generate activation token (rate-limited internally)
        String rawActivationKey =
                tokenService.generateToken(accountType, accountId);

        // Send activation key to the registered email only
        emailService.sendActivationEmail(
                contact.email(),
                contact.displayName(),
                accountType,
                accountId,
                rawActivationKey
        );
    }
}
