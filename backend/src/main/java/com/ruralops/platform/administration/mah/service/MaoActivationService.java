package com.ruralops.platform.administration.mah.service;

import com.ruralops.platform.administration.mah.domain.MaoAccount;
import com.ruralops.platform.administration.mah.dto.MaoActivationRequest;
import com.ruralops.platform.administration.mah.repository.MaoAccountRepository;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;
import com.ruralops.platform.secure.activation.service.ActivationValidationService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MaoActivationService {

    private final MaoAccountRepository maoAccountRepository;
    private final ActivationValidationService activationValidationService;
    private final PasswordEncoder passwordEncoder;

    public MaoActivationService(
            MaoAccountRepository maoAccountRepository,
            ActivationValidationService activationValidationService,
            PasswordEncoder passwordEncoder
    ) {
        this.maoAccountRepository = maoAccountRepository;
        this.activationValidationService = activationValidationService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void activate(MaoActivationRequest request) {

        // Password confirmation (request-level validity)
        if (!request.passwordsMatch()) {
            throw new InvalidRequestException("Passwords do not match");
        }

        // Validate activation key (single-use, authoritative)
        activationValidationService.validateAndConsume(
                "MAO",
                request.getMaoId(),
                request.getActivationKey()
        );

        // Fetch MAO account (resource existence)
        MaoAccount maoAccount = maoAccountRepository
                .findByMaoId(request.getMaoId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "MAO not found: " + request.getMaoId()
                        )
                );

        // Enforce semantic lifecycle (business rule)
        if (maoAccount.getStatus() != AccountStatus.PENDING_ACTIVATION) {
            throw new InvalidRequestException(
                    "MAO account is not eligible for activation"
            );
        }

        // Hash password + activate (domain behavior)
        String passwordHash = passwordEncoder.encode(request.getPassword());
        maoAccount.activate(passwordHash);

        maoAccountRepository.save(maoAccount);
    }
}
