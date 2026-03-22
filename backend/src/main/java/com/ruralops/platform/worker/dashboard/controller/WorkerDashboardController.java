package com.ruralops.platform.worker.dashboard.controller;

import com.ruralops.platform.auth.security.AuthenticatedUserPrincipal;
import com.ruralops.platform.worker.dashboard.dto.WorkerDashboardResponse;
import com.ruralops.platform.worker.dashboard.service.WorkerDashboardService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/workers/dashboard")
public class WorkerDashboardController {

    private final WorkerDashboardService workerDashboardService;

    public WorkerDashboardController(
            WorkerDashboardService workerDashboardService
    ) {
        this.workerDashboardService = workerDashboardService;
    }

    /* =========================================
       Main Dashboard Endpoint
       ========================================= */

    @GetMapping
    public ResponseEntity<WorkerDashboardResponse> loadDashboard(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {

        UUID userId = principal.getUserId();

        WorkerDashboardResponse dashboard =
                workerDashboardService.loadDashboard(userId);

        return ResponseEntity.ok(dashboard);
    }

    /* =========================================
       Quick Profile Summary
       ========================================= */

    @GetMapping("/profile-summary")
    public ResponseEntity<WorkerDashboardResponse> getProfileSummary(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {

        UUID userId = principal.getUserId();

        WorkerDashboardResponse dashboard =
                workerDashboardService.loadDashboard(userId);

        return ResponseEntity.ok(dashboard);
    }

    /* =========================================
       Dashboard Refresh
       ========================================= */

    @GetMapping("/refresh")
    public ResponseEntity<WorkerDashboardResponse> refreshDashboard(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {

        UUID userId = principal.getUserId();

        WorkerDashboardResponse dashboard =
                workerDashboardService.loadDashboard(userId);

        return ResponseEntity.ok(dashboard);
    }
}