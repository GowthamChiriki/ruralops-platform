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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ComplaintStatusService {

    private static final Logger log = LoggerFactory.getLogger(ComplaintStatusService.class);

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
       START WORK
       ===================================================== */
    @Transactional
    public void startWork(String complaintId, WorkerAccount worker) {

        Complaint complaint = getComplaintOrThrow(complaintId);

        validateWorkerOwnership(complaint, worker);

        if (complaint.getStatus() != ComplaintStatus.ASSIGNED) {
            throw new InvalidRequestException(
                    "Cannot start work. Current status: " + complaint.getStatus()
            );
        }

        complaint.startWork();

        log.info("Work started | complaintId={} | workerId={}",
                complaintId, worker.getWorkerId());
    }

    /* =====================================================
       COMPLETE WORK FLOW
       ===================================================== */
    @Transactional
    public void completeWork(
            WorkerAccount worker,
            WorkerUpdateRequest request
    ) {

        /* =========================
           VALIDATE REQUEST
           ========================= */
        if (request == null) {
            throw new InvalidRequestException("Request body is missing");
        }

        if (request.getComplaintId() == null || request.getComplaintId().isBlank()) {
            throw new InvalidRequestException("Complaint ID is required");
        }

        if (request.getAfterImageUrl() == null || request.getAfterImageUrl().isBlank()) {
            throw new InvalidRequestException("After image is required");
        }

        /* =========================
           FETCH + AUTH
           ========================= */
        Complaint complaint = getComplaintOrThrow(request.getComplaintId());

        validateWorkerOwnership(complaint, worker);

        if (complaint.getStatus() != ComplaintStatus.IN_PROGRESS) {
            throw new InvalidRequestException(
                    "Cannot complete complaint in state: " + complaint.getStatus()
            );
        }

        /* =========================
           1. COMPLETE WORK
           ========================= */
        complaint.completeWork(request.getAfterImageUrl());

        log.info("Complaint marked RESOLVED | complaintId={}", complaint.getComplaintId());

        /* =========================
           2. AI VERIFICATION
           ========================= */
        int score = 0;

        try {
            if (complaint.getBeforeImageUrl() != null &&
                    complaint.getAfterImageUrl() != null) {

                score = aiVerificationService.evaluateCleanliness(
                        complaint.getBeforeImageUrl(),
                        complaint.getAfterImageUrl()
                );
            }
        } catch (Exception ex) {
            log.error("AI verification failed | complaintId={}", complaint.getComplaintId(), ex);
            score = 0; // fallback
        }

        complaint.recordAiVerification(score);

        log.info("AI score recorded | complaintId={} | score={}",
                complaint.getComplaintId(), score);

        /* =========================
           3. MARK VERIFIED
           ========================= */
        complaint.markVerified();

        /* =========================
           4. CLOSE COMPLAINT
           ========================= */
        complaint.close();

        log.info("Complaint CLOSED | complaintId={}", complaint.getComplaintId());
    }

    /* =====================================================
       HELPERS
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