package com.ruralops.platform.citizen.complaint;

import com.ruralops.platform.auth.security.AuthenticatedUserPrincipal;

import com.ruralops.platform.citizen.account.domain.CitizenAccount;
import com.ruralops.platform.citizen.security.CitizenAccessGuard;

import com.ruralops.platform.complaints.dto.ComplaintResponse;
import com.ruralops.platform.complaints.domain.ComplaintStatus;
import com.ruralops.platform.complaints.dto.CreateComplaintRequest;

import com.ruralops.platform.complaints.service.ComplaintSubmissionService;
import com.ruralops.platform.complaints.service.ComplaintQueryService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;

/**
 * REST controller for citizen complaint operations.
 *
 * Responsibilities:
 * - submit complaint
 * - view own complaints
 * - filter by status
 * - view complaint details
 *
 * Security model:
 * - citizen identity is obtained from the authenticated JWT principal
 * - no manual parsing of Authorization headers
 */

@RestController
@RequestMapping("/citizen/complaints")
public class CitizenComplaintController {

    private final ComplaintSubmissionService submissionService;
    private final ComplaintQueryService queryService;
    private final CitizenAccessGuard citizenAccessGuard;

    public CitizenComplaintController(
            ComplaintSubmissionService submissionService,
            ComplaintQueryService queryService,
            CitizenAccessGuard citizenAccessGuard
    ) {
        this.submissionService = submissionService;
        this.queryService = queryService;
        this.citizenAccessGuard = citizenAccessGuard;
    }

    /* =====================================================
       Helper
       ===================================================== */

    private CitizenAccount resolveCitizen(AuthenticatedUserPrincipal principal) {
        return citizenAccessGuard.requireActiveCitizen(principal.getUserId());
    }

    /* =====================================================
       Submit Complaint
       ===================================================== */

    @PostMapping
    public ResponseEntity<String> submitComplaint(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestBody CreateComplaintRequest request
    ) {

        CitizenAccount citizen = resolveCitizen(principal);

        submissionService.submitComplaint(citizen, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body("Complaint submitted successfully");
    }

    /* =====================================================
       List My Complaints
       ===================================================== */

    @GetMapping("/my")
    public ResponseEntity<List<ComplaintResponse>> getMyComplaints(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {

        CitizenAccount citizen = resolveCitizen(principal);

        List<ComplaintResponse> complaints =
                queryService.getComplaintsForCitizen(citizen);

        return ResponseEntity.ok(complaints);
    }

    /* =====================================================
       Filter My Complaints By Status
       ===================================================== */

    @GetMapping("/my/status/{status}")
    public ResponseEntity<List<ComplaintResponse>> getMyComplaintsByStatus(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable ComplaintStatus status
    ) {

        CitizenAccount citizen = resolveCitizen(principal);

        List<ComplaintResponse> complaints =
                queryService.getComplaintsForCitizenByStatus(citizen, status);

        return ResponseEntity.ok(complaints);
    }

    /* =====================================================
       View Specific Complaint
       ===================================================== */

    @GetMapping("/{complaintId}")
    public ResponseEntity<ComplaintResponse> getComplaint(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @PathVariable String complaintId
    ) {

        CitizenAccount citizen = resolveCitizen(principal);

        ComplaintResponse complaint =
                queryService.getComplaintForCitizen(citizen, complaintId);

        return ResponseEntity.ok(complaint);
    }
}