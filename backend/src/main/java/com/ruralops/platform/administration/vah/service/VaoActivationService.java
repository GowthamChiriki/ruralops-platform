package com.ruralops.platform.administration.vah.service;

import com.ruralops.platform.administration.vah.domain.VaoAccount;
import com.ruralops.platform.administration.vah.dto.VaoActivationRequest;
import com.ruralops.platform.administration.vah.repository.VaoAccountRepository;

import com.ruralops.platform.auth.entity.User;
import com.ruralops.platform.auth.repository.UserRepository;

import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;

import com.ruralops.platform.secure.activation.service.ActivationValidationService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VaoActivationService {

    private final VaoAccountRepository vaoAccountRepository;
    private final UserRepository userRepository;
    private final ActivationValidationService activationValidationService;
    private final PasswordEncoder passwordEncoder;

    public VaoActivationService(
            VaoAccountRepository vaoAccountRepository,
            UserRepository userRepository,
            ActivationValidationService activationValidationService,
            PasswordEncoder passwordEncoder
    ) {
        this.vaoAccountRepository = vaoAccountRepository;
        this.userRepository = userRepository;
        this.activationValidationService = activationValidationService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void activate(VaoActivationRequest request) {

        if (!request.passwordsMatch()) {
            throw new InvalidRequestException("Passwords do not match");
        }

        VaoAccount vaoAccount = vaoAccountRepository
                .findByVaoId(request.getVaoId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "VAO not found: " + request.getVaoId()
                        )
                );

        if (vaoAccount.getStatus() != AccountStatus.PENDING_ACTIVATION) {
            throw new InvalidRequestException(
                    "VAO account cannot be activated in status: " + vaoAccount.getStatus()
            );
        }

        activationValidationService.validateAndConsume(
                "VAO",
                request.getVaoId(),
                request.getActivationKey()
        );

        /*  SET PASSWORD IN USER */
        User user = vaoAccount.getUser();

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        user.setPasswordHash(encodedPassword);
        user.setStatus(AccountStatus.ACTIVE);

        userRepository.save(user);

        /* ACTIVATE DOMAIN */
        vaoAccount.activate();

        vaoAccountRepository.save(vaoAccount);
    }
}