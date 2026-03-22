package com.ruralops.platform.complaints.service;

import com.ruralops.platform.complaints.domain.Complaint;
import com.ruralops.platform.complaints.domain.ComplaintStatus;
import com.ruralops.platform.complaints.repository.ComplaintRepository;
import com.ruralops.platform.worker.domain.WorkerAccount;
import com.ruralops.platform.worker.repository.WorkerAccountRepository;
import com.ruralops.platform.governance.domain.Area;
import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.RoutingException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ComplaintRoutingService {

    private static final Logger log =
            LoggerFactory.getLogger(ComplaintRoutingService.class);

    private final WorkerAccountRepository workerAccountRepository;
    private final ComplaintRepository complaintRepository;

    public ComplaintRoutingService(
            WorkerAccountRepository workerAccountRepository,
            ComplaintRepository complaintRepository
    ) {
        this.workerAccountRepository = workerAccountRepository;
        this.complaintRepository = complaintRepository;
    }

    /**
     * Attempts to route a newly submitted complaint to the worker
     * assigned to its area.
     *
     * FIX: Throws a typed {@link RoutingException} when no worker is
     * available, so callers can distinguish "expected no-worker" from
     * "unexpected infrastructure failure".
     *
     * FIX: Guards against complaints that arrive in AWAITING_ASSIGNMENT
     * state (e.g. on a retry path) in addition to the initial SUBMITTED
     * state, preventing an IllegalStateException from the domain.
     */

    public void routeComplaint(Complaint complaint) {

        Area area = complaint.getArea();

        if (area == null) {
            throw new InvalidRequestException(
                    "Complaint must belong to an area before routing"
            );
        }

        WorkerAccount worker = workerAccountRepository
                .findByArea_Id(area.getId())
                .orElse(null);

        if (worker == null) {

            /*
             * Mark the complaint as waiting — but only if it is still in
             * SUBMITTED state. If it has already been moved to
             * AWAITING_ASSIGNMENT (e.g. a retry), skip the transition.
             */
            if (complaint.getStatus() == ComplaintStatus.SUBMITTED) {
                complaint.markAwaitingAssignment();
                complaintRepository.save(complaint);
            }

            log.warn(
                    "No worker found for area {}. Complaint {} is AWAITING_ASSIGNMENT",
                    area.getId(),
                    complaint.getComplaintId()
            );

            throw new RoutingException(
                    "No worker assigned to area: " + area.getId()
            );
        }

        complaint.assignWorker(worker);

        complaintRepository.save(complaint);

        log.info(
                "Complaint {} assigned to worker {}",
                complaint.getComplaintId(),
                worker.getWorkerId()
        );
    }

    /**
     * Called when a new worker is provisioned for an area.
     * Assigns all AWAITING_ASSIGNMENT complaints for that area.
     */
    @Transactional
    public void rerouteAreaComplaints(Area area, WorkerAccount worker) {

        log.info(
                "Scanning area {} for pending complaints",
                area.getId()
        );

        List<Complaint> complaints =
                complaintRepository.findByAreaAndAssignedWorkerIsNull(area);

        if (complaints.isEmpty()) {
            log.info(
                    "No pending complaints found for area {}",
                    area.getId()
            );
            return;
        }

        for (Complaint complaint : complaints) {
            complaint.assignWorker(worker);
            complaintRepository.save(complaint);

            log.info(
                    "Complaint {} automatically assigned to worker {}",
                    complaint.getComplaintId(),
                    worker.getWorkerId()
            );
        }

        log.info(
                "{} complaints assigned to worker {} for area {}",
                complaints.size(),
                worker.getWorkerId(),
                area.getId()
        );
    }
}