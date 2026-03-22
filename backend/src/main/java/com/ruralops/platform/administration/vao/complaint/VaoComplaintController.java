package com.ruralops.platform.administration.vao.complaint;

import com.ruralops.platform.auth.security.AuthenticatedUserPrincipal;

import com.ruralops.platform.complaints.dto.ComplaintResponse;
import com.ruralops.platform.complaints.domain.ComplaintStatus;
import com.ruralops.platform.complaints.service.ComplaintQueryService;

import com.ruralops.platform.worker.domain.WorkerAccount;
import com.ruralops.platform.worker.repository.WorkerAccountRepository;

import com.ruralops.platform.governance.domain.Village;
import com.ruralops.platform.governance.repository.VillageRepository;

import com.ruralops.platform.common.exception.ResourceNotFoundException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import jakarta.validation.Valid;

import java.util.List;

/**
 * VAO Complaint Monitoring Controller
 *
 * Responsibilities:
 * - Monitor complaints within VAO's village
 * - Filter complaints by status
 * - Inspect complaint details
 * - Monitor worker activity
 * - View complaints by area
 * - Close verified complaints
 */

@RestController
@RequestMapping("/vao/complaints")
public class VaoComplaintController {

    private final ComplaintQueryService complaintQueryService;
    private final VillageRepository villageRepository;
    private final WorkerAccountRepository workerAccountRepository;
    private final VaoComplaintAdministrationService complaintAdministrationService;

    public VaoComplaintController(
            ComplaintQueryService complaintQueryService,
            VillageRepository villageRepository,
            WorkerAccountRepository workerAccountRepository,
            VaoComplaintAdministrationService complaintAdministrationService
    ) {
        this.complaintQueryService = complaintQueryService;
        this.villageRepository = villageRepository;
        this.workerAccountRepository = workerAccountRepository;
        this.complaintAdministrationService = complaintAdministrationService;
    }

    /* =====================================================
       Helper
       ===================================================== */

    private Village getVillage(String villageId) {
        return villageRepository
                .findById(villageId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Village not found: " + villageId
                        )
                );
    }

    private WorkerAccount getWorker(String workerId) {
        return workerAccountRepository
                .findByWorkerId(workerId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Worker not found: " + workerId
                        )
                );
    }

    /* =====================================================
       Village Monitoring
       ===================================================== */

    @GetMapping("/village")
    public ResponseEntity<List<ComplaintResponse>> getVillageComplaints(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        Village village = getVillage(principal.getVillageId());

        return ResponseEntity.ok(
                complaintQueryService.getComplaintsForVillage(village)
        );
    }

    @GetMapping("/village/status/{status}")
    public ResponseEntity<List<ComplaintResponse>> getVillageComplaintsByStatus(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable ComplaintStatus status
    ) {
        Village village = getVillage(principal.getVillageId());

        return ResponseEntity.ok(
                complaintQueryService.getComplaintsForVillageByStatus(village, status)
        );
    }

    @GetMapping("/village/unassigned")
    public ResponseEntity<List<ComplaintResponse>> getUnassignedComplaints(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {
        Village village = getVillage(principal.getVillageId());

        return ResponseEntity.ok(
                complaintQueryService.getUnassignedComplaintsForVillage(village)
        );
    }

    /* =====================================================
       Complaint Details
       ===================================================== */

    @GetMapping("/{complaintId}")
    public ResponseEntity<ComplaintResponse> getComplaintDetails(
            @PathVariable String complaintId
    ) {
        return ResponseEntity.ok(
                complaintQueryService.getComplaint(complaintId)
        );
    }

    /* =====================================================
       Worker Monitoring
       ===================================================== */

    @GetMapping("/worker/{workerId}")
    public ResponseEntity<List<ComplaintResponse>> getWorkerComplaints(
            @PathVariable String workerId
    ) {
        WorkerAccount worker = getWorker(workerId);

        return ResponseEntity.ok(
                complaintQueryService.getComplaintsForWorker(worker)
        );
    }

    /* =====================================================
       Area Monitoring
       ===================================================== */

    @GetMapping("/area/{areaId}")
    public ResponseEntity<List<ComplaintResponse>> getAreaComplaints(
            @PathVariable Long areaId
    ) {
        return ResponseEntity.ok(
                complaintQueryService.getComplaintsForArea(areaId)
        );
    }

    /* =====================================================
       VAO Closure
       ===================================================== */

    @PostMapping("/{complaintId}/close")
    public ResponseEntity<Void> closeComplaint(
            @PathVariable String complaintId,
            @RequestBody(required = false) @Valid VaoCloseRequest request
    ) {
        complaintAdministrationService.closeComplaint(complaintId, request);

        return ResponseEntity.noContent().build();
    }
}