package com.ruralops.platform.administration.vah.service;

import com.ruralops.platform.administration.mah.domain.MaoAccount;
import com.ruralops.platform.administration.mah.repository.MaoAccountRepository;
import com.ruralops.platform.administration.vah.domain.VaoAccount;
import com.ruralops.platform.administration.vah.repository.VaoAccountRepository;

import com.ruralops.platform.auth.entity.User;
import com.ruralops.platform.auth.repository.UserRepository;
import com.ruralops.platform.auth.service.RoleService;

import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.common.exception.GovernanceViolationException;
import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;

import com.ruralops.platform.governance.domain.Village;
import com.ruralops.platform.governance.repository.VillageRepository;

import com.ruralops.platform.secure.activation.service.ActivationRequestService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VaoProvisionService {

    private final VaoAccountRepository vaoAccountRepository;
    private final MaoAccountRepository maoAccountRepository;
    private final VillageRepository villageRepository;
    private final ActivationRequestService activationRequestService;
    private final UserRepository userRepository;
    private final RoleService roleService;

    public VaoProvisionService(
            VaoAccountRepository vaoAccountRepository,
            MaoAccountRepository maoAccountRepository,
            VillageRepository villageRepository,
            ActivationRequestService activationRequestService,
            UserRepository userRepository,
            RoleService roleService
    ) {
        this.vaoAccountRepository = vaoAccountRepository;
        this.maoAccountRepository = maoAccountRepository;
        this.villageRepository = villageRepository;
        this.activationRequestService = activationRequestService;
        this.userRepository = userRepository;
        this.roleService = roleService;
    }

    @Transactional
    public VaoAccount provisionVao(
            String maoId,
            String villageId,
            String vaoName,
            String email,
            String phoneNumber
    ) {

        /* ======================================================
           Normalize inputs
           ====================================================== */

        String normalizedVillageId = normalize(villageId);
        String normalizedName = normalize(vaoName);
        String normalizedEmail = normalize(email).toLowerCase();
        String normalizedPhone = normalize(phoneNumber);

        /* ======================================================
           Validate MAO
           ====================================================== */

        MaoAccount mao = maoAccountRepository.findByMaoId(maoId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("MAO not found: " + maoId)
                );

        if (mao.getStatus() != AccountStatus.ACTIVE) {
            throw new GovernanceViolationException(
                    "Only ACTIVE MAOs can provision VAOs"
            );
        }

        /* ======================================================
           Validate Village
           ====================================================== */

        Village village = villageRepository.findById(normalizedVillageId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Village not found: " + normalizedVillageId
                        )
                );

        if (!village.getMandal().equals(mao.getMandal())) {
            throw new GovernanceViolationException(
                    "MAO is not authorized to manage this village"
            );
        }

        /* ======================================================
           Uniqueness checks
           ====================================================== */

        if (vaoAccountRepository.existsByVillage(village)) {
            throw new GovernanceViolationException(
                    "VAO already exists for village: " + village.getName()
            );
        }

        if (vaoAccountRepository.existsByEmail(normalizedEmail)) {
            throw new InvalidRequestException("Email already in use");
        }

        if (vaoAccountRepository.existsByPhoneNumber(normalizedPhone)) {
            throw new InvalidRequestException("Phone number already in use");
        }

        /* ======================================================
           Create authentication identity
           ====================================================== */

        User user = new User(
                normalizedPhone,
                "PENDING_SETUP",
                AccountStatus.PENDING_ACTIVATION
        );

        user = userRepository.save(user);

        /* ======================================================
           Generate VAO ID
           ====================================================== */

        String vaoId = generateVaoId(village.getId());

        /* ======================================================
           Create VAO account
           ====================================================== */

        VaoAccount vaoAccount = new VaoAccount(
                user,
                vaoId,
                village,
                normalizedName,
                normalizedEmail,
                normalizedPhone
        );

        VaoAccount saved = vaoAccountRepository.save(vaoAccount);

        /* ======================================================
           Assign VAO role automatically
           ====================================================== */

        roleService.assignRole(
                user.getId(),
                "VAO",
                village.getId()
        );

        /* ======================================================
           Trigger activation flow
           ====================================================== */

        activationRequestService.requestActivation(
                "VAO",
                saved.getVaoId()
        );

        return saved;
    }

    /* ======================================================
       VAO ID generator
       ====================================================== */

    private String generateVaoId(String villageId) {

        String random = java.util.UUID.randomUUID()
                .toString()
                .substring(0, 4)
                .toUpperCase();

        return "RLOV-" + villageId + "-" + random;
    }

    /* ======================================================
       Input normalization
       ====================================================== */

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}