package com.ruralops.platform.worker.dashboard.service;

import com.ruralops.platform.worker.domain.WorkerAccount;
import com.ruralops.platform.worker.repository.WorkerAccountRepository;

import com.ruralops.platform.worker.dashboard.dto.WorkerDashboardResponse;

import com.ruralops.platform.complaints.repository.ComplaintRepository;
import com.ruralops.platform.complaints.domain.ComplaintStatus;

import com.ruralops.platform.common.exception.ResourceNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Aggregates worker operational metrics
 * and profile data for the dashboard.
 */
@Service
public class WorkerDashboardService {

    private final WorkerAccountRepository workerAccountRepository;
    private final ComplaintRepository complaintRepository;

    public WorkerDashboardService(
            WorkerAccountRepository workerAccountRepository,
            ComplaintRepository complaintRepository
    ) {
        this.workerAccountRepository = workerAccountRepository;
        this.complaintRepository = complaintRepository;
    }

    @Transactional(readOnly = true)
    public WorkerDashboardResponse loadDashboard(UUID userId) {

        /* ---------------------------------------------
           1. Resolve worker from authenticated identity
        --------------------------------------------- */

        WorkerAccount worker = workerAccountRepository
                .findByUser_Id(userId)   // ✅ FIXED
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Worker not found for user: " + userId
                        )
                );

        String workerId = worker.getWorkerId();

        /* ---------------------------------------------
           2. Calculate complaint metrics
        --------------------------------------------- */

        long totalTasks =
                complaintRepository.countByAssignedWorker_WorkerId(workerId);

        long pendingTasks =
                complaintRepository.countByAssignedWorker_WorkerIdAndStatus(
                        workerId,
                        ComplaintStatus.ASSIGNED
                );

        long inProgressTasks =
                complaintRepository.countByAssignedWorker_WorkerIdAndStatus(
                        workerId,
                        ComplaintStatus.IN_PROGRESS
                );

        long completedTasks =
                complaintRepository.countByAssignedWorker_WorkerIdAndStatus(
                        workerId,
                        ComplaintStatus.RESOLVED
                );

        /* ---------------------------------------------
           3. Build response
        --------------------------------------------- */

        WorkerDashboardResponse response = new WorkerDashboardResponse();

        response.setWorkerId(workerId);
        response.setWorkerName(worker.getName());

        response.setVillageName(worker.getVillage().getName());
        response.setAreaName(worker.getArea().getName());

        response.setTotalTasks(totalTasks);
        response.setPendingTasks(pendingTasks);
        response.setInProgressTasks(inProgressTasks);
        response.setCompletedTasks(completedTasks);

        response.setPerformanceScore(0); // AI scoring placeholder

        return response;
    }
}