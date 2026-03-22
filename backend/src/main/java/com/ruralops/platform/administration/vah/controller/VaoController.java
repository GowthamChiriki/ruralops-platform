package com.ruralops.platform.administration.vah.controller;

import com.ruralops.platform.administration.vah.dto.VaoActivationRequest;
import com.ruralops.platform.administration.vah.dto.VaoProvisionRequest;
import com.ruralops.platform.administration.vah.dto.VaoSummaryResponse;
import com.ruralops.platform.administration.vah.service.VaoActivationService;
import com.ruralops.platform.administration.vah.service.VaoProvisionService;
import com.ruralops.platform.administration.vah.service.VaoStatusService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for VAO (Village Administrative Officer) operations.
 *
 * Supports:
 * - Provisioning (by MAO)
 * - First-time activation
 * - Read-only status retrieval
 *
 * Note:
 * Authentication and security context integration
 * are expected to replace explicit identity passing later.
 */
@RestController
@RequestMapping("/administration/vao")
public class VaoController {

    private final VaoProvisionService provisionService;
    private final VaoActivationService activationService;
    private final VaoStatusService statusService;

    public VaoController(
            VaoProvisionService provisionService,
            VaoActivationService activationService,
            VaoStatusService statusService
    ) {
        this.provisionService = provisionService;
        this.activationService = activationService;
        this.statusService = statusService;
    }

    /**
     * Provisions a VAO for a specific village.
     *
     * Expected caller:
     * - An active MAO
     *
     * Current behavior:
     * - maoId is provided explicitly
     * - In-future, this should be derived from the security context
     */
    @PostMapping("/provision/{maoId}")
    public ResponseEntity<String> provisionVao(
            @PathVariable String maoId,
            @Valid @RequestBody VaoProvisionRequest request
    ) {
        provisionService.provisionVao(
                maoId,
                request.getVillageId(),
                request.getName(),
                request.getEmail(),
                request.getPhoneNumber()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        "VAO provisioned successfully. Activation is pending."
                );
    }

    /**
     * Activates a VAO account using activation details.
     *
     * Intended for first-time activation only.
     */
    @PostMapping("/activate")
    public ResponseEntity<String> activateVao(
            @Valid @RequestBody VaoActivationRequest request
    ) {
        activationService.activate(request);

        return ResponseEntity.ok(
                "VAO account activated successfully"
        );
    }

    /**
     * Retrieves the current status of a VAO account.
     *
     * Read-only operation.
     * Used by status-check flows and administrative dashboards.
     */
    @GetMapping("/{vaoId}/status")
    public ResponseEntity<VaoSummaryResponse> getVaoStatus(
            @PathVariable String vaoId
    ) {
        VaoSummaryResponse response =
                statusService.getByVaoId(vaoId);

        return ResponseEntity.ok(response);
    }
}
