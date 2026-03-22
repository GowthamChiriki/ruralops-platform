package com.ruralops.platform.administration.vao.controller;

import com.ruralops.platform.auth.security.AuthenticatedUserPrincipal;
import com.ruralops.platform.citizen.account.dto.CitizenApprovalRequest;
import com.ruralops.platform.citizen.account.dto.CitizenSummaryResponse;
import com.ruralops.platform.citizen.account.service.CitizenApprovalService;
import com.ruralops.platform.citizen.account.service.CitizenStatusService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/vao/citizens")
public class VaoCitizenManagementController {

    private final CitizenStatusService citizenStatusService;
    private final CitizenApprovalService citizenApprovalService;

    public VaoCitizenManagementController(
            CitizenStatusService citizenStatusService,
            CitizenApprovalService citizenApprovalService
    ) {
        this.citizenStatusService = citizenStatusService;
        this.citizenApprovalService = citizenApprovalService;
    }

    /* =====================================================
       CITIZEN STATISTICS
       ===================================================== */

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getCitizenStats(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {

        UUID userId = principal.getUserId();

        Map<String, Long> stats =
                citizenStatusService.getCitizenStatsForVao(userId);

        return ResponseEntity.ok(stats);
    }

    /* =====================================================
       PENDING CITIZENS
       ===================================================== */

    @GetMapping("/pending")
    public ResponseEntity<List<CitizenSummaryResponse>> getPendingCitizens(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(defaultValue = "0") int page
    ) {

        UUID userId = principal.getUserId();

        List<CitizenSummaryResponse> citizens =
                citizenStatusService.getPendingForVao(userId, page);

        return ResponseEntity.ok(citizens);
    }

    /* =====================================================
       APPROVE / REJECT CITIZEN
       ===================================================== */

    @PostMapping("/decision")
    public ResponseEntity<String> decideCitizen(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody CitizenApprovalRequest request
    ) {

        UUID userId = principal.getUserId();

        UUID citizenInternalId = request.getCitizenInternalId();

        switch (request.getDecision()) {

            case APPROVE ->
                    citizenApprovalService.approveCitizen(
                            citizenInternalId,
                            userId
                    );

            case REJECT ->
                    citizenApprovalService.rejectCitizen(
                            citizenInternalId,
                            userId
                    );
        }

        return ResponseEntity.ok("Citizen decision processed successfully");
    }

    /* =====================================================
       ALL CITIZENS
       ===================================================== */

    @GetMapping("/all")
    public ResponseEntity<List<CitizenSummaryResponse>> getAllCitizens(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam(defaultValue = "0") int page
    ) {

        UUID userId = principal.getUserId();

        List<CitizenSummaryResponse> citizens =
                citizenStatusService.getAllForVao(userId, page);

        return ResponseEntity.ok(citizens);
    }

    /* =====================================================
       SINGLE CITIZEN
       ===================================================== */

    @GetMapping("/{citizenId}")
    public ResponseEntity<CitizenSummaryResponse> getCitizen(
            @PathVariable String citizenId
    ) {

        CitizenSummaryResponse citizen =
                citizenStatusService.getByCitizenId(citizenId);

        return ResponseEntity.ok(citizen);
    }
}