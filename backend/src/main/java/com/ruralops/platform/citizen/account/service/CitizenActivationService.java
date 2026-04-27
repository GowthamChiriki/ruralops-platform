package com.ruralops.platform.citizen.account.service;

import com.ruralops.platform.auth.entity.User;
import com.ruralops.platform.auth.repository.UserRepository;
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
    private final UserRepository userRepository;

    public CitizenActivationService(
            CitizenAccountRepository citizenAccountRepository,
            ActivationValidationService activationValidationService,
            PasswordEncoder passwordEncoder,
            UserRepository userRepository
    ) {
        this.citizenAccountRepository = citizenAccountRepository;
        this.activationValidationService = activationValidationService;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
    }

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

        // 3. Check lifecycle state
        if (citizen.getStatus() != AccountStatus.PENDING_ACTIVATION) {
            throw new InvalidRequestException(
                    "Citizen account cannot be activated in status: " + citizen.getStatus()
            );
        }

        // 4. Validate activation key
        activationValidationService.validateAndConsume(
                "CITIZEN",
                request.getCitizenId(),
                request.getActivationKey()
        );

        // 5. Set password in User
        User user = citizen.getUser();

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        user.setPasswordHash(encodedPassword);
        user.setStatus(AccountStatus.ACTIVE);

        userRepository.save(user);

        // 6. Activate citizen account
        citizen.activate();

        citizenAccountRepository.save(citizen);
    }
}