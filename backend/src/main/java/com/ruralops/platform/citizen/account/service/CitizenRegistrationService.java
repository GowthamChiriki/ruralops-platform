package com.ruralops.platform.citizen.account.service;

import com.ruralops.platform.auth.entity.User;
import com.ruralops.platform.auth.repository.UserRepository;

import com.ruralops.platform.citizen.account.domain.CitizenAccount;
import com.ruralops.platform.citizen.account.dto.CitizenRegistrationRequest;
import com.ruralops.platform.citizen.account.repository.CitizenAccountRepository;

import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;

import com.ruralops.platform.governance.domain.Village;
import com.ruralops.platform.governance.repository.VillageRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CitizenRegistrationService {

    private final CitizenAccountRepository citizenAccountRepository;
    private final VillageRepository villageRepository;
    private final UserRepository userRepository;

    public CitizenRegistrationService(
            CitizenAccountRepository citizenAccountRepository,
            VillageRepository villageRepository,
            UserRepository userRepository
    ) {
        this.citizenAccountRepository = citizenAccountRepository;
        this.villageRepository = villageRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void register(CitizenRegistrationRequest request) {

        /* ======================================================
           1. Resolve governance anchor
           ====================================================== */

        Village village = villageRepository.findById(request.getVillageId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Village not found: " + request.getVillageId()
                        )
                );

        /* ======================================================
           2. Resolve or create authentication identity
           ====================================================== */

        User user = userRepository
                .findByPhone(request.getPhoneNumber())
                .orElseGet(() -> {

                    User newUser = new User(
                            request.getPhoneNumber(),
                            "PENDING_SETUP",
                            AccountStatus.PENDING_ACTIVATION
                    );

                    return userRepository.save(newUser);
                });

        /* ======================================================
           3. Prevent duplicate citizen account for same user
           ====================================================== */

        if (citizenAccountRepository.existsByUser_Id(user.getId())) {
            throw new InvalidRequestException(
                    "This user already has a citizen account"
            );
        }

        /* ======================================================
           4. Citizen data uniqueness checks
           ====================================================== */

        if (citizenAccountRepository.existsByEmailIgnoreCase(request.getEmail())
                || citizenAccountRepository.existsByAadhaarNumber(request.getAadhaarNumber())) {

            throw new InvalidRequestException(
                    "Citizen already registered with provided details"
            );
        }

        /* ======================================================
           5. Create citizen domain account
           ====================================================== */

        CitizenAccount citizen = new CitizenAccount(
                user,
                request.getFullName(),
                request.getFatherName(),
                request.getAadhaarNumber(),
                request.getRationCardNumber(),
                request.getPhoneNumber(),
                request.getEmail(),
                village
        );

        citizenAccountRepository.save(citizen);

        /* ======================================================
           NOTE:
           Role assignment happens AFTER VAO approval.
           CitizenApprovalService will assign the CITIZEN role.
           ====================================================== */
    }
}