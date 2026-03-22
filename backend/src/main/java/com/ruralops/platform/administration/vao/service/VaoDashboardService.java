package com.ruralops.platform.administration.vao.service;

import com.ruralops.platform.administration.vao.dto.VaoDashboardResponse;
import com.ruralops.platform.administration.vah.domain.VaoAccount;
import com.ruralops.platform.administration.vah.repository.VaoAccountRepository;
import com.ruralops.platform.citizen.account.repository.CitizenAccountRepository;
import com.ruralops.platform.worker.repository.WorkerAccountRepository;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.common.exception.ResourceNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class VaoDashboardService {

    private final VaoAccountRepository vaoAccountRepository;
    private final CitizenAccountRepository citizenRepository;
    private final WorkerAccountRepository workerRepository;

    public VaoDashboardService(
            VaoAccountRepository vaoAccountRepository,
            CitizenAccountRepository citizenRepository,
            WorkerAccountRepository workerRepository
    ) {
        this.vaoAccountRepository = vaoAccountRepository;
        this.citizenRepository = citizenRepository;
        this.workerRepository = workerRepository;
    }

    @Transactional(readOnly = true)
    public VaoDashboardResponse getDashboard(UUID userId) {

        /* -------------------------------
           Resolve VAO from identity
        -------------------------------- */

        VaoAccount vao = vaoAccountRepository
                .findByUserId(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "VAO account not found for user: " + userId
                        )
                );

        /* -------------------------------
           Village context
        -------------------------------- */

        String villageId = vao.getVillage().getId();
        String villageName = vao.getVillage().getName();

        /* -------------------------------
           Metrics
        -------------------------------- */

        long totalCitizens =
                citizenRepository.countByVillage_Id(villageId);

        long pendingCitizens =
                citizenRepository.countByVillage_IdAndStatus(
                        villageId,
                        AccountStatus.PENDING_APPROVAL
                );

        long workers =
                workerRepository.countByVillage_Id(villageId);

        long pendingComplaints = 0; // placeholder

        /* -------------------------------
           Response
        -------------------------------- */

        return new VaoDashboardResponse(
                vao.getVaoId(),
                vao.getName(),
                villageName,
                totalCitizens,
                pendingCitizens,
                workers,
                pendingComplaints
        );
    }
}