package com.ruralops.platform.worker.service;

import com.ruralops.platform.worker.domain.WorkerAccount;
import com.ruralops.platform.worker.dto.WorkerSummaryResponse;
import com.ruralops.platform.worker.repository.WorkerAccountRepository;

import com.ruralops.platform.common.exception.ResourceNotFoundException;

import com.ruralops.platform.governance.domain.Area;
import com.ruralops.platform.governance.domain.Village;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service responsible for retrieving Worker account status.
 */
@Service
@Transactional(readOnly = true)
public class WorkerStatusService {

    private final WorkerAccountRepository workerAccountRepository;

    public WorkerStatusService(
            WorkerAccountRepository workerAccountRepository
    ) {
        this.workerAccountRepository = workerAccountRepository;
    }

    /**
     * Fetch worker status by Worker ID.
     */
    public WorkerSummaryResponse getByWorkerId(String workerId) {

        WorkerAccount worker = workerAccountRepository
                .findByWorkerId(workerId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Worker not found: " + workerId
                        )
                );

        return toSummary(worker);
    }

    /**
     * Fetch worker status by phone number.
     */
    public WorkerSummaryResponse getByPhoneNumber(String phoneNumber) {

        WorkerAccount worker = workerAccountRepository
                .findByPhoneNumber(phoneNumber)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Worker not found with phone number: " + phoneNumber
                        )
                );

        return toSummary(worker);
    }

    /**
     * Returns all workers belonging to a village.
     */
    public List<WorkerSummaryResponse> getWorkersForVillage(Village village) {

        return workerAccountRepository
                .findByVillage_Id(village.getId())
                .stream()
                .map(this::toSummary)
                .toList();
    }

    /**
     * Returns all workers assigned to a specific area.
     */
    public List<WorkerSummaryResponse> getWorkersForArea(Area area) {

        return workerAccountRepository
                .findByArea_Id(area.getId())
                .stream()
                .map(this::toSummary)
                .toList();
    }
    /* =========================
       Mapping helper
       ========================= */

    private WorkerSummaryResponse toSummary(WorkerAccount worker) {

        Village village = worker.getVillage();
        Area area = worker.getArea();

        return new WorkerSummaryResponse(
                worker.getWorkerId(),
                worker.getName(),
                village.getId(),
                village.getName(),
                area.getId(),
                area.getName(),
                worker.getStatus()
        );
    }
}