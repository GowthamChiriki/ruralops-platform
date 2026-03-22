package com.ruralops.platform.worker.service;

import com.ruralops.platform.worker.domain.WorkerAccount;
import com.ruralops.platform.worker.dto.WorkerActivationRequest;
import com.ruralops.platform.worker.repository.WorkerAccountRepository;

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
public class WorkerActivationService {

    private final WorkerAccountRepository workerAccountRepository;
    private final UserRepository userRepository;
    private final ActivationValidationService activationValidationService;
    private final PasswordEncoder passwordEncoder;

    public WorkerActivationService(
            WorkerAccountRepository workerAccountRepository,
            UserRepository userRepository,
            ActivationValidationService activationValidationService,
            PasswordEncoder passwordEncoder
    ) {
        this.workerAccountRepository = workerAccountRepository;
        this.userRepository = userRepository;
        this.activationValidationService = activationValidationService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void activate(WorkerActivationRequest request) {

        /* -------------------------
           Password confirmation
        ------------------------- */

        if (!request.passwordsMatch()) {
            throw new InvalidRequestException("Passwords do not match");
        }

        /* -------------------------
           Retrieve worker account
        ------------------------- */

        WorkerAccount worker = workerAccountRepository
                .findByWorkerId(request.getWorkerId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Worker not found: " + request.getWorkerId()
                        )
                );

        if (worker.getStatus() != AccountStatus.PENDING_ACTIVATION) {
            throw new InvalidRequestException(
                    "Worker account cannot be activated in status: "
                            + worker.getStatus()
            );
        }

        /* -------------------------
           Validate activation key
        ------------------------- */

        activationValidationService.validateAndConsume(
                "WORKER",
                request.getWorkerId(),
                request.getActivationKey()
        );

        /* -------------------------
           Hash password
        ------------------------- */

        String passwordHash = passwordEncoder.encode(request.getPassword());

        /* -------------------------
           Update authentication user
        ------------------------- */

        User user = worker.getUser();

        user.setPasswordHash(passwordHash);
        user.activate();

        userRepository.save(user);

        /* -------------------------
           Activate worker role
        ------------------------- */

        worker.activate(passwordHash);

        workerAccountRepository.save(worker);
    }
}