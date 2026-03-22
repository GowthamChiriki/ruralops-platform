package com.ruralops.platform.citizen.account.service;

import com.ruralops.platform.citizen.account.domain.CitizenAccount;
import com.ruralops.platform.citizen.account.dto.CitizenActivationRequest;
import com.ruralops.platform.citizen.account.repository.CitizenAccountRepository;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;
import com.ruralops.platform.secure.activation.service.ActivationValidationService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CitizenActivationService {

    private final CitizenAccountRepository citizenAccountRepository;
    private final ActivationValidationService activationValidationService;
    private final PasswordEncoder passwordEncoder;

    public CitizenActivationService(
            CitizenAccountRepository citizenAccountRepository,
            ActivationValidationService activationValidationService,
            PasswordEncoder passwordEncoder
    ) {
        this.citizenAccountRepository = citizenAccountRepository;
        this.activationValidationService = activationValidationService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Activates a citizen account after successful activation-key validation.
     *
     * FLOW:
     * PENDING_APPROVAL -> (VAO approves)
     * PENDING_ACTIVATION -> (citizen activates)
     * ACTIVE
     */
    @Transactional
    public void activate(CitizenActivationRequest request) {

        // 1. Password confirmation
        if (!request.passwordsMatch()) {
            throw new InvalidRequestException("Passwords do not match");
        }

        // 2. Fetch citizen account
        CitizenAccount citizen = citizenAccountRepository
                .findByCitizenId(request.getCitizenId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Citizen not found: " + request.getCitizenId()
                        )
                );

        // 3. Enforce lifecycle state BEFORE consuming token
        if (citizen.getStatus() != AccountStatus.PENDING_ACTIVATION) {
            throw new InvalidRequestException(
                    "Citizen account cannot be activated in status: " + citizen.getStatus()
            );
        }

        // 4. Validate & consume activation key (authoritative)
        activationValidationService.validateAndConsume(
                "CITIZEN",
                request.getCitizenId(),
                request.getActivationKey()
        );

        // 5. Hash password & activate
        String passwordHash = passwordEncoder.encode(request.getPassword());
        citizen.activate(passwordHash);

        citizenAccountRepository.save(citizen);
    }
}
