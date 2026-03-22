package com.ruralops.platform.administration.vah.service;

import com.ruralops.platform.administration.vah.domain.VaoAccount;
import com.ruralops.platform.administration.vah.dto.VaoActivationRequest;
import com.ruralops.platform.administration.vah.repository.VaoAccountRepository;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;
import com.ruralops.platform.secure.activation.service.ActivationValidationService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service responsible for activating VAO accounts.
 *
 * Handles:
 * - Password confirmation
 * - Lifecycle validation
 * - Activation key verification
 * - Password hashing and account activation
 */
@Service
public class VaoActivationService {

    private final VaoAccountRepository vaoAccountRepository;
    private final ActivationValidationService activationValidationService;
    private final PasswordEncoder passwordEncoder;

    public VaoActivationService(
            VaoAccountRepository vaoAccountRepository,
            ActivationValidationService activationValidationService,
            PasswordEncoder passwordEncoder
    ) {
        this.vaoAccountRepository = vaoAccountRepository;
        this.activationValidationService = activationValidationService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Activates a VAO account after successful activation key validation.
     *
     * Enforcement steps:
     * 1. Confirm passwords match
     * 2. Ensure VAO account exists
     * 3. Ensure account is in PENDING_ACTIVATION status
     * 4. Validate and consume activation token
     * 5. Hash password and transition account to ACTIVE
     */
    @Transactional
    public void activate(VaoActivationRequest request) {

        // 1. Confirm password and confirmPassword match
        if (!request.passwordsMatch()) {
            throw new InvalidRequestException("Passwords do not match");
        }

        // 2. Retrieve VAO account by public ID
        VaoAccount vaoAccount = vaoAccountRepository
                .findByVaoId(request.getVaoId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "VAO not found: " + request.getVaoId()
                        )
                );

        // 3. Ensure account is eligible for activation
        if (vaoAccount.getStatus() != AccountStatus.PENDING_ACTIVATION) {
            throw new InvalidRequestException(
                    "VAO account cannot be activated in status: " + vaoAccount.getStatus()
            );
        }

        // 4. Validate and consume activation token (authoritative check)
        activationValidationService.validateAndConsume(
                "VAO",
                request.getVaoId(),
                request.getActivationKey()
        );

        // 5. Hash password and transition account to ACTIVE
        String passwordHash = passwordEncoder.encode(request.getPassword());
        vaoAccount.activate(passwordHash);

        vaoAccountRepository.save(vaoAccount);
    }
}
