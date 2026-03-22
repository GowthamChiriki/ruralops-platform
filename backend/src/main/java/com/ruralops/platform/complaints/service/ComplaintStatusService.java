package com.ruralops.platform.complaints.service;

import com.ruralops.platform.complaints.domain.Complaint;
import com.ruralops.platform.complaints.domain.ComplaintStatus;
import com.ruralops.platform.complaints.dto.WorkerUpdateRequest;
import com.ruralops.platform.complaints.repository.ComplaintRepository;

import com.ruralops.platform.worker.domain.WorkerAccount;

import com.ruralops.platform.ai.verification.AiVerificationService;

import com.ruralops.platform.common.exception.ResourceNotFoundException;
import com.ruralops.platform.common.exception.GovernanceViolationException;
import com.ruralops.platform.common.exception.InvalidRequestException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles complaint lifecycle transitions triggered by workers.
 *
 * Lifecycle:
 *
 * ASSIGNED → IN_PROGRESS → RESOLVED → VERIFIED → CLOSED
 *
 * Responsibilities:
 * - validate worker ownership
 * - enforce lifecycle transitions
 * - persist completion evidence
 * - trigger AI verification
 *
 * NOTE: Read-only citizen queries have been removed from this class.
 *       They live exclusively in ComplaintQueryService to avoid
 *       duplicating query logic across services.
 */
@Service
public class ComplaintStatusService {

    private final ComplaintRepository complaintRepository;
    private final AiVerificationService aiVerificationService;

    public ComplaintStatusService(
            ComplaintRepository complaintRepository,
            AiVerificationService aiVerificationService
    ) {
        this.complaintRepository = complaintRepository;
        this.aiVerificationService = aiVerificationService;
    }

    /* =====================================================
       Worker Lifecycle Actions
       ===================================================== */

    /**
     * Worker begins resolving a complaint.
     */
    @Transactional
    public void startWork(String complaintId, WorkerAccount worker) {
        Complaint complaint = getComplaintOrThrow(complaintId);

        validateWorkerOwnership(complaint, worker);

        if (complaint.getStatus() != ComplaintStatus.ASSIGNED) {
            throw new InvalidRequestException(
                    "Complaint cannot be started in state: "
                            + complaint.getStatus()
            );
        }

        complaint.startWork();
    }

    /**
     * Worker marks complaint resolution complete.
     *
     * The complaintId on the request must match the path-bound ID
     * set by the controller via {@link WorkerUpdateRequest#withComplaintId}.
     * This prevents a worker from redirecting their completion to a
     * complaint they do not own.
     *
     * This triggers AI verification after marking the complaint RESOLVED.
     */
    @Transactional
    public void completeWork(
            WorkerAccount worker,
            WorkerUpdateRequest request
    ) {
        Complaint complaint = getComplaintOrThrow(request.getComplaintId());

        validateWorkerOwnership(complaint, worker);

        if (complaint.getStatus() != ComplaintStatus.IN_PROGRESS) {
            throw new InvalidRequestException(
                    "Complaint cannot be completed in state: "
                            + complaint.getStatus()
            );
        }

        complaint.completeWork(request.getAfterImageUrl());

        int cleanlinessScore = aiVerificationService.evaluateCleanliness(
                complaint.getBeforeImageUrl(),
                complaint.getAfterImageUrl()
        );

        complaint.recordAiVerification(cleanlinessScore);
    }

    /* =====================================================
       Internal Helpers
       ===================================================== */

    private Complaint getComplaintOrThrow(String complaintId) {
        return complaintRepository
                .findByComplaintId(complaintId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Complaint not found: " + complaintId
                        )
                );
    }

    private void validateWorkerOwnership(
            Complaint complaint,
            WorkerAccount worker
    ) {
        if (complaint.getAssignedWorker() == null ||
                !complaint.getAssignedWorker()
                        .getWorkerId()
                        .equals(worker.getWorkerId())) {

            throw new GovernanceViolationException(
                    "Worker not authorized for this complaint"
            );
        }
    }
}