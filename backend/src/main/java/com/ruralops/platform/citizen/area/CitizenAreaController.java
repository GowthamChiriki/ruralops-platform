package com.ruralops.platform.citizen.area;

import com.ruralops.platform.auth.security.AuthenticatedUserPrincipal;
import com.ruralops.platform.governance.dto.AreaResponse;
import com.ruralops.platform.governance.service.AreaService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/citizen/areas")
public class CitizenAreaController {

    private final AreaService areaService;

    public CitizenAreaController(AreaService areaService) {
        this.areaService = areaService;
    }

    /* =====================================================
       GET AREAS FOR CITIZEN'S VILLAGE
       ===================================================== */

    @GetMapping
    public ResponseEntity<List<AreaResponse>> getCitizenAreas(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {

        UUID userId = principal.getUserId();

        List<AreaResponse> areas =
                areaService.getAreasForCitizenVillage(userId);

        return ResponseEntity.ok(areas);
    }
}