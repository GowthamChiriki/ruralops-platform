package com.ruralops.platform.citizen.dashboard.controller;

import com.ruralops.platform.auth.security.AuthenticatedUserPrincipal;
import com.ruralops.platform.citizen.dashboard.dto.CitizenDashboardResponse;
import com.ruralops.platform.citizen.dashboard.service.CitizenDashboardService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/citizen/dashboard")
public class CitizenDashboardController {

    private final CitizenDashboardService citizenDashboardService;

    public CitizenDashboardController(
            CitizenDashboardService citizenDashboardService
    ) {
        this.citizenDashboardService = citizenDashboardService;
    }

    /* =====================================================
       LOAD DASHBOARD
       ===================================================== */

    @GetMapping
    public ResponseEntity<CitizenDashboardResponse> loadDashboard(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {

        UUID userId = principal.getUserId();

        CitizenDashboardResponse dashboard =
                citizenDashboardService.loadDashboard(userId);

        return ResponseEntity.ok(dashboard);
    }

    /* =====================================================
       REFRESH DASHBOARD
       ===================================================== */

    @GetMapping("/refresh")
    public ResponseEntity<CitizenDashboardResponse> refreshDashboard(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {

        UUID userId = principal.getUserId();

        CitizenDashboardResponse dashboard =
                citizenDashboardService.loadDashboard(userId);

        return ResponseEntity.ok(dashboard);
    }
}