package com.ruralops.platform.worker.complaint;

import com.ruralops.platform.auth.security.AuthenticatedUserPrincipal;
import com.ruralops.platform.complaints.dto.ComplaintResponse;
import com.ruralops.platform.complaints.dto.WorkerUpdateRequest;
import com.ruralops.platform.complaints.domain.ComplaintStatus;
import com.ruralops.platform.complaints.service.ComplaintStatusService;
import com.ruralops.platform.complaints.service.ComplaintQueryService;

import com.ruralops.platform.worker.domain.WorkerAccount;
import com.ruralops.platform.worker.security.WorkerAccessGuard;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/workers/complaints")
public class WorkerComplaintController {

    private final ComplaintStatusService complaintStatusService;
    private final ComplaintQueryService complaintQueryService;
    private final WorkerAccessGuard workerAccessGuard;

    public WorkerComplaintController(
            ComplaintStatusService complaintStatusService,
            ComplaintQueryService complaintQueryService,
            WorkerAccessGuard workerAccessGuard
    ) {
        this.complaintStatusService = complaintStatusService;
        this.complaintQueryService = complaintQueryService;
        this.workerAccessGuard = workerAccessGuard;
    }

    /* =====================================================
       Resolve Worker From JWT
       ===================================================== */

    private WorkerAccount resolveWorker(AuthenticatedUserPrincipal principal) {

        UUID userId = principal.getUserId();

        return workerAccessGuard.requireActiveWorker(userId);
    }

    /* =====================================================
       Get assigned complaints
       ===================================================== */

    @GetMapping
    public ResponseEntity<List<ComplaintResponse>> getAssignedComplaints(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {

        WorkerAccount worker = resolveWorker(principal);

        List<ComplaintResponse> complaints =
                complaintQueryService.getComplaintsForWorker(worker);

        return ResponseEntity.ok(complaints);
    }

    /* =====================================================
       Filter complaints by status
       ===================================================== */

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ComplaintResponse>> getAssignedComplaintsByStatus(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable ComplaintStatus status
    ) {

        WorkerAccount worker = resolveWorker(principal);

        List<ComplaintResponse> complaints =
                complaintQueryService.getComplaintsForWorkerByStatus(worker, status);

        return ResponseEntity.ok(complaints);
    }

    /* =====================================================
       Complaint details
       ===================================================== */

    @GetMapping("/{complaintId}")
    public ResponseEntity<ComplaintResponse> getComplaintDetails(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable String complaintId
    ) {

        WorkerAccount worker = resolveWorker(principal);

        ComplaintResponse response =
                complaintQueryService.getComplaintForWorker(worker, complaintId);

        return ResponseEntity.ok(response);
    }

    /* =====================================================
       Start work
       ===================================================== */

    @PatchMapping("/{complaintId}/start")
    public ResponseEntity<Void> startWork(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable String complaintId
    ) {

        WorkerAccount worker = resolveWorker(principal);

        complaintStatusService.startWork(complaintId, worker);

        return ResponseEntity.noContent().build();
    }

    /* =====================================================
       Complete work
       ===================================================== */

    @PatchMapping("/{complaintId}/complete")
    public ResponseEntity<Void> completeWork(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable String complaintId,
            @Valid @RequestBody WorkerUpdateRequest request
    ) {

        WorkerAccount worker = resolveWorker(principal);

        WorkerUpdateRequest boundRequest =
                request.withComplaintId(complaintId);

        complaintStatusService.completeWork(worker, boundRequest);

        return ResponseEntity.noContent().build();
    }
}