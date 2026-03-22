package com.ruralops.platform.administration.mah.controller;

import com.ruralops.platform.administration.mah.domain.MaoAccount;
import com.ruralops.platform.administration.mah.dto.MaoActivationRequest;
import com.ruralops.platform.administration.mah.dto.MaoProvisionRequest;
import com.ruralops.platform.administration.mah.dto.MaoVillageVaoView;
import com.ruralops.platform.administration.mah.service.MaoActivationService;
import com.ruralops.platform.administration.mah.service.MaoProvisionService;
import com.ruralops.platform.administration.mah.service.MaoVillageViewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for MAO (Mandal Administrative Officer) operations.
 *
 * Handles provisioning, activation, and read-only village views.
 */
@RestController
@RequestMapping("/administration/mao")
public class MaoController {

    private final MaoProvisionService provisionService;
    private final MaoActivationService activationService;
    private final MaoVillageViewService maoVillageViewService;

    public MaoController(
            MaoProvisionService provisionService,
            MaoActivationService activationService,
            MaoVillageViewService maoVillageViewService
    ) {
        this.provisionService = provisionService;
        this.activationService = activationService;
        this.maoVillageViewService = maoVillageViewService;
    }

    /**
     * Provisions a new MAO account.
     *
     * Intended for system-level or higher-authority use only.
     *
     * Result:
     * - Account is created in PENDING_ACTIVATION status
     * - Activation flow is handled separately
     */
    @PostMapping("/provision")
    public ResponseEntity<String> provision(
            @Valid @RequestBody MaoProvisionRequest request
    ) {
        MaoAccount mao = provisionService.provisionMao(
                request.getMandalId(),
                request.getEmail(),
                request.getPhoneNumber()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        "MAO provisioned successfully. " +
                                "MAO_ID = " + mao.getMaoId() +
                                " (activation pending)"
                );
    }

    /**
     * Activates a MAO account using provided activation details.
     *
     * Intended for first-time activation only.
     */
    @PostMapping("/activate")
    public ResponseEntity<String> activate(
            @Valid @RequestBody MaoActivationRequest request
    ) {
        activationService.activate(request);

        return ResponseEntity.ok("MAO account activated successfully");
    }

    /**
     * Retrieves all villages under the given MAO,
     * including assigned VAO details.
     *
     * Read-only operation.
     */
    @GetMapping("/{maoId}/villages")
    public ResponseEntity<List<MaoVillageVaoView>> getVillagesWithVao(
            @PathVariable String maoId
    ) {
        return ResponseEntity.ok(
                maoVillageViewService.getVillagesWithVao(maoId)
        );
    }

}
