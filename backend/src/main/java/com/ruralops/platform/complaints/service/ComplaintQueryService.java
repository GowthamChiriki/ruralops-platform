package com.ruralops.platform.complaints.service;

import com.ruralops.platform.complaints.domain.Complaint;
import com.ruralops.platform.complaints.domain.ComplaintStatus;
import com.ruralops.platform.complaints.dto.ComplaintResponse;
import com.ruralops.platform.complaints.repository.ComplaintRepository;

import com.ruralops.platform.citizen.account.domain.CitizenAccount;
import com.ruralops.platform.worker.domain.WorkerAccount;
import com.ruralops.platform.governance.domain.Village;

import com.ruralops.platform.common.exception.GovernanceViolationException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Read-only service responsible for retrieving complaint data.
 *
 * Used by:
 * - Citizen dashboards
 * - Worker dashboards
 * - VAO monitoring panels
 */
@Service
@Transactional(readOnly = true)
public class ComplaintQueryService {

    private final ComplaintRepository complaintRepository;

    public ComplaintQueryService(
            ComplaintRepository complaintRepository
    ) {
        this.complaintRepository = complaintRepository;
    }

    /* ========================================
       Citizen Queries
       ======================================== */

    public List<ComplaintResponse> getComplaintsForCitizen(
            CitizenAccount citizen
    ) {
        return complaintRepository
                .findByCitizen_IdOrderByCreatedAtDesc(citizen.getId())
                .stream()
                .map(ComplaintResponse::from)
                .toList();
    }

    public List<ComplaintResponse> getComplaintsForCitizenByStatus(
            CitizenAccount citizen,
            ComplaintStatus status
    ) {
        return complaintRepository
                .findByCitizen_IdAndStatus(citizen.getId(), status)
                .stream()
                .map(ComplaintResponse::from)
                .toList();
    }

    public ComplaintResponse getComplaintForCitizen(
            CitizenAccount citizen,
            String complaintId
    ) {
        Complaint complaint = getComplaintOrThrow(complaintId);

        if (!complaint.getCitizen().getId().equals(citizen.getId())) {
            throw new GovernanceViolationException(
                    "Citizen not authorized to view this complaint"
            );
        }

        return ComplaintResponse.from(complaint);
    }

    /* ========================================
       Worker Queries
       ======================================== */

    public List<ComplaintResponse> getComplaintsForWorker(
            WorkerAccount worker
    ) {
        return complaintRepository
                .findByAssignedWorker_WorkerId(worker.getWorkerId())
                .stream()
                .map(ComplaintResponse::from)
                .toList();
    }

    public List<ComplaintResponse> getComplaintsForWorkerByStatus(
            WorkerAccount worker,
            ComplaintStatus status
    ) {
        return complaintRepository
                .findByAssignedWorker_WorkerIdAndStatus(
                        worker.getWorkerId(),
                        status
                )
                .stream()
                .map(ComplaintResponse::from)
                .toList();
    }

    /**
     * FIX: Returns a complaint only if it is assigned to the given worker.
     * Prevents workers from reading complaints belonging to other workers.
     */
    public ComplaintResponse getComplaintForWorker(
            WorkerAccount worker,
            String complaintId
    ) {
        Complaint complaint = getComplaintOrThrow(complaintId);

        if (complaint.getAssignedWorker() == null ||
                !complaint.getAssignedWorker()
                        .getWorkerId()
                        .equals(worker.getWorkerId())) {

            throw new GovernanceViolationException(
                    "Worker not authorized to view this complaint"
            );
        }

        return ComplaintResponse.from(complaint);
    }

    /* ========================================
       VAO Village Queries
       ======================================== */

    public List<ComplaintResponse> getComplaintsForVillage(
            Village village
    ) {
        return complaintRepository
                .findByVillage_Id(village.getId())
                .stream()
                .map(ComplaintResponse::from)
                .toList();
    }

    public List<ComplaintResponse> getComplaintsForVillageByStatus(
            Village village,
            ComplaintStatus status
    ) {
        return complaintRepository
                .findByVillage_IdAndStatus(village.getId(), status)
                .stream()
                .map(ComplaintResponse::from)
                .toList();
    }

    /**
     * VAO dashboard – complaints waiting for worker assignment.
     * Only surfaces AWAITING_ASSIGNMENT state, not raw SUBMITTED,
     * so the VAO sees complaints that have completed routing.
     */
    public List<ComplaintResponse> getUnassignedComplaintsForVillage(
            Village village
    ) {
        return complaintRepository
                .findByVillage_IdAndStatus(
                        village.getId(),
                        ComplaintStatus.AWAITING_ASSIGNMENT
                )
                .stream()
                .map(ComplaintResponse::from)
                .toList();
    }

    /* ========================================
       Single Complaint Lookup
       ======================================== */

    public ComplaintResponse getComplaint(String complaintId) {
        return ComplaintResponse.from(getComplaintOrThrow(complaintId));
    }

    public List<ComplaintResponse> getComplaintsForArea(Long areaId) {
        return complaintRepository
                .findByArea_Id(areaId)
                .stream()
                .map(ComplaintResponse::from)
                .toList();
    }

    /* ========================================
       Internal
       ======================================== */

    private Complaint getComplaintOrThrow(String complaintId) {
        return complaintRepository
                .findByComplaintId(complaintId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Complaint not found: " + complaintId
                        )
                );
    }
}