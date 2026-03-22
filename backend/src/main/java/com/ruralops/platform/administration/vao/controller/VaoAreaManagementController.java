package com.ruralops.platform.administration.vao.controller;

import com.ruralops.platform.auth.security.AuthenticatedUserPrincipal;
import com.ruralops.platform.governance.dto.AreaResponse;
import com.ruralops.platform.governance.dto.CreateAreaRequest;
import com.ruralops.platform.governance.service.AreaService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/vao/areas")
public class VaoAreaManagementController {

    private final AreaService areaService;

    public VaoAreaManagementController(AreaService areaService) {
        this.areaService = areaService;
    }

    /* =====================================================
       CREATE AREA
       ===================================================== */

    @PostMapping
    public ResponseEntity<AreaResponse> createArea(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody CreateAreaRequest request
    ) {

        UUID userId = principal.getUserId();

        AreaResponse response =
                areaService.createAreaForVao(userId, request);

        return ResponseEntity.ok(response);
    }

    /* =====================================================
       GET AREAS FOR VAO
       ===================================================== */

    @GetMapping
    public ResponseEntity<List<AreaResponse>> getAreas(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {

        UUID userId = principal.getUserId();

        List<AreaResponse> areas =
                areaService.getAreasForVao(userId);

        return ResponseEntity.ok(areas);
    }
}