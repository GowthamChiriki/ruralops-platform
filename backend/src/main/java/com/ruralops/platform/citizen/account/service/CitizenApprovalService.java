package com.ruralops.platform.citizen.account.service;

import com.ruralops.platform.auth.service.RoleService;
import com.ruralops.platform.citizen.account.domain.CitizenAccount;
import com.ruralops.platform.citizen.account.repository.CitizenAccountRepository;
import com.ruralops.platform.citizen.account.util.CitizenIdGenerator;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.common.exception.GovernanceViolationException;
import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;
import com.ruralops.platform.administration.vah.domain.VaoAccount;
import com.ruralops.platform.administration.vah.security.VaoAccessGuard;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service responsible for approving or rejecting citizen registrations.
 *
 * Authority:
 * - Only ACTIVE VAO can approve or reject
 * - VAO can act only on citizens of their own village
 */
@Service
public class CitizenApprovalService {

    private final CitizenAccountRepository citizenAccountRepository;
    private final VaoAccessGuard vaoAccessGuard;
    private final RoleService roleService;

    public CitizenApprovalService(
            CitizenAccountRepository citizenAccountRepository,
            VaoAccessGuard vaoAccessGuard,
            RoleService roleService
    ) {
        this.citizenAccountRepository = citizenAccountRepository;
        this.vaoAccessGuard = vaoAccessGuard;
        this.roleService = roleService;
    }

    /* =====================================================
       APPROVE CITIZEN
       ===================================================== */

    @Transactional
    public String approveCitizen(UUID citizenInternalId, UUID userId) {

        // 1. Resolve and validate VAO identity
        VaoAccount vao = vaoAccessGuard.requireActiveVao(userId);

        // 2. Retrieve citizen
        CitizenAccount citizen = citizenAccountRepository
                .findById(citizenInternalId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Citizen not found: " + citizenInternalId
                        )
                );

        // 3. Status guard
        if (citizen.getStatus() != AccountStatus.PENDING_APPROVAL) {
            throw new InvalidRequestException(
                    "Citizen cannot be approved in status: " + citizen.getStatus()
            );
        }

        // 4. Governance guard
        if (!citizen.getVillage().getId().equals(vao.getVillage().getId())) {
            throw new GovernanceViolationException(
                    "VAO is not authorized to approve this citizen"
            );
        }

        // 5. Generate public citizen ID
        String citizenId = CitizenIdGenerator.generate(citizen.getVillage());

        if (citizenId == null || citizenId.isBlank()) {
            throw new IllegalStateException("Citizen ID generation failed");
        }

        // 6. Perform domain transition
        citizen.approve(citizenId, vao.getVaoId());

        citizenAccountRepository.saveAndFlush(citizen);
        roleService.assignRole(
                citizen.getUser().getId(),
                "CITIZEN",
                citizen.getVillage().getId()
        );

        if (citizen.getCitizenId() == null) {
            throw new IllegalStateException(
                    "Citizen approved but citizenId is still null. Internal ID: " + citizenInternalId
            );
        }

        return citizen.getCitizenId();
    }

    /* =====================================================
       REJECT CITIZEN
       ===================================================== */

    @Transactional
    public void rejectCitizen(UUID citizenInternalId, UUID userId) {

        // 1. Resolve VAO identity
        VaoAccount vao = vaoAccessGuard.requireActiveVao(userId);

        // 2. Retrieve citizen
        CitizenAccount citizen = citizenAccountRepository
                .findById(citizenInternalId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Citizen not found: " + citizenInternalId
                        )
                );

        // 3. Status guard
        if (citizen.getStatus() != AccountStatus.PENDING_APPROVAL) {
            throw new InvalidRequestException(
                    "Citizen cannot be rejected in status: " + citizen.getStatus()
            );
        }

        // 4. Governance guard
        if (!citizen.getVillage().getId().equals(vao.getVillage().getId())) {
            throw new GovernanceViolationException(
                    "VAO is not authorized to reject this citizen"
            );
        }

        citizen.reject();

        citizenAccountRepository.saveAndFlush(citizen);
    }
}