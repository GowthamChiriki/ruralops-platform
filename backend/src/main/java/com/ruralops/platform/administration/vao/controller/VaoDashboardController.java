package com.ruralops.platform.administration.vao.controller;

import com.ruralops.platform.administration.vao.dto.VaoDashboardResponse;
import com.ruralops.platform.administration.vao.service.VaoDashboardService;
import com.ruralops.platform.auth.security.AuthenticatedUserPrincipal;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/vao/dashboard")
public class VaoDashboardController {

    private final VaoDashboardService dashboardService;

    public VaoDashboardController(VaoDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /* =====================================================
       VAO DASHBOARD
       ===================================================== */

    @GetMapping
    public ResponseEntity<VaoDashboardResponse> getDashboard(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {

        UUID userId = principal.getUserId();

        VaoDashboardResponse response =
                dashboardService.getDashboard(userId);

        return ResponseEntity.ok(response);
    }
}