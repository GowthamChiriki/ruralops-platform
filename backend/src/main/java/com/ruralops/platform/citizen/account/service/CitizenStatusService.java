package com.ruralops.platform.citizen.account.service;

import com.ruralops.platform.citizen.account.domain.CitizenAccount;
import com.ruralops.platform.citizen.account.dto.CitizenSummaryResponse;
import com.ruralops.platform.citizen.account.repository.CitizenAccountRepository;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.common.exception.ResourceNotFoundException;
import com.ruralops.platform.governance.domain.Mandal;
import com.ruralops.platform.governance.domain.Village;
import com.ruralops.platform.administration.vah.domain.VaoAccount;
import com.ruralops.platform.administration.vah.security.VaoAccessGuard;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class CitizenStatusService {

    private final CitizenAccountRepository citizenAccountRepository;
    private final VaoAccessGuard vaoAccessGuard;

    public CitizenStatusService(
            CitizenAccountRepository citizenAccountRepository,
            VaoAccessGuard vaoAccessGuard
    ) {
        this.citizenAccountRepository = citizenAccountRepository;
        this.vaoAccessGuard = vaoAccessGuard;
    }

    /* =====================================================
       VAO DASHBOARD STATISTICS
       ===================================================== */

    public Map<String, Long> getCitizenStatsForVao(UUID userId) {

        VaoAccount vao = vaoAccessGuard.requireActiveVao(userId);

        String villageId = vao.getVillage().getId();

        long totalCitizens =
                citizenAccountRepository.countByVillage_Id(villageId);

        long pendingCitizens =
                citizenAccountRepository.countByVillage_IdAndStatus(
                        villageId,
                        AccountStatus.PENDING_APPROVAL
                );

        long activeCitizens =
                citizenAccountRepository.countByVillage_IdAndStatus(
                        villageId,
                        AccountStatus.ACTIVE
                );

        long rejectedCitizens =
                citizenAccountRepository.countByVillage_IdAndStatus(
                        villageId,
                        AccountStatus.REJECTED
                );

        return Map.of(
                "totalCitizens", totalCitizens,
                "pendingApprovals", pendingCitizens,
                "activeCitizens", activeCitizens,
                "rejectedCitizens", rejectedCitizens
        );
    }

    /* =====================================================
       VAO CITIZEN LISTING (PAGINATED)
       ===================================================== */

    public List<CitizenSummaryResponse> getAllForVao(UUID userId, int page) {

        VaoAccount vao = vaoAccessGuard.requireActiveVao(userId);

        Pageable pageable = PageRequest.of(page, 5);

        Page<CitizenAccount> citizens =
                citizenAccountRepository.findByVillage_Id(
                        vao.getVillage().getId(),
                        pageable
                );

        return citizens.stream()
                .map(this::toSummary)
                .toList();
    }

    public List<CitizenSummaryResponse> getPendingForVao(UUID userId, int page) {

        VaoAccount vao = vaoAccessGuard.requireActiveVao(userId);

        Pageable pageable = PageRequest.of(page, 5);

        Page<CitizenAccount> citizens =
                citizenAccountRepository.findByVillage_IdAndStatus(
                        vao.getVillage().getId(),
                        AccountStatus.PENDING_APPROVAL,
                        pageable
                );

        return citizens.stream()
                .map(this::toSummary)
                .toList();
    }

    /* =====================================================
       PUBLIC STATUS LOOKUPS
       ===================================================== */

    public CitizenSummaryResponse getByPhoneNumber(String phoneNumber) {

        CitizenAccount citizen =
                citizenAccountRepository.findByPhoneNumber(phoneNumber)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Citizen not found for phone number"
                                )
                        );

        return toSummary(citizen);
    }

    public CitizenSummaryResponse getByCitizenId(String citizenId) {

        CitizenAccount citizen =
                citizenAccountRepository.findByCitizenId(citizenId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Citizen not found: " + citizenId
                                )
                        );

        return toSummary(citizen);
    }

    /* =====================================================
       ENTITY → DTO MAPPING
       ===================================================== */

    private CitizenSummaryResponse toSummary(CitizenAccount citizen) {

        AccountStatus status = citizen.getStatus();

        Village village = citizen.getVillage();
        Mandal mandal = village.getMandal();

        return new CitizenSummaryResponse(
                citizen.getId(),
                citizen.getCitizenId(),
                citizen.getFullName(),
                citizen.getFatherName(),
                citizen.getPhoneNumber(),
                citizen.getEmail(),
                village.getId(),
                village.getName(),
                mandal.getId(),
                mandal.getName(),
                citizen.getApprovedByVaoId(),
                status,
                status == AccountStatus.PENDING_ACTIVATION,
                nextActionFor(status)
        );
    }

    private CitizenSummaryResponse.NextAction nextActionFor(AccountStatus status) {

        return switch (status) {

            case PENDING_APPROVAL ->
                    CitizenSummaryResponse.NextAction.WAIT_FOR_APPROVAL;

            case PENDING_ACTIVATION ->
                    CitizenSummaryResponse.NextAction.REQUEST_ACTIVATION;

            case ACTIVE ->
                    CitizenSummaryResponse.NextAction.ACCOUNT_ACTIVE;

            case REJECTED, SUSPENDED ->
                    CitizenSummaryResponse.NextAction.CONTACT_SUPPORT;

            default ->
                    CitizenSummaryResponse.NextAction.CONTACT_SUPPORT;
        };
    }
}