package com.ruralops.platform.citizen.security;

import com.ruralops.platform.citizen.account.domain.CitizenAccount;
import com.ruralops.platform.citizen.account.repository.CitizenAccountRepository;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;

import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Guard component responsible for validating citizen access conditions.
 *
 * Responsibilities:
 * - Ensure citizen account exists
 * - Ensure citizen account is ACTIVE
 */
@Component
public class CitizenAccessGuard {

    private final CitizenAccountRepository citizenAccountRepository;

    public CitizenAccessGuard(CitizenAccountRepository citizenAccountRepository) {
        this.citizenAccountRepository = citizenAccountRepository;
    }

    /**
     * Ensures the citizen exists and is ACTIVE.
     */
    public CitizenAccount requireActiveCitizen(UUID userId) {

        if (userId == null) {
            throw new InvalidRequestException("User identity is missing");
        }

        CitizenAccount citizen = citizenAccountRepository
                .findByUser_Id(userId)   // ✔ correct method
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Citizen account not found for user: " + userId
                        )
                );

        if (citizen.getStatus() != AccountStatus.ACTIVE) {
            throw new InvalidRequestException(
                    "Citizen account is not active (status = " + citizen.getStatus() + ")"
            );
        }

        return citizen;
    }
}