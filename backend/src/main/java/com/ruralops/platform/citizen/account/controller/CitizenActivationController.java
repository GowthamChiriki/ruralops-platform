package com.ruralops.platform.citizen.account.controller;

import com.ruralops.platform.citizen.account.dto.CitizenActivationRequest;
import com.ruralops.platform.citizen.account.service.CitizenActivationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Citizen Account Activation Controller
 *
 * RESPONSIBILITY:
 * - Accept activation request from citizen
 * - Delegate activation to service layer
 *
 * SECURITY:
 * - Public endpoint
 * - Activation key is the security boundary
 */
@RestController
@RequestMapping("/citizen")
public class CitizenActivationController {

    private final CitizenActivationService citizenActivationService;

    public CitizenActivationController(
            CitizenActivationService citizenActivationService
    ) {
        this.citizenActivationService = citizenActivationService;
    }

    /**
     * Activate a citizen account.
     *
     * FLOW:
     * - Citizen receives activation key via email
     * - Submits activation request
     * - Account becomes ACTIVE
     */
    @PostMapping("/activate")
    public ResponseEntity<String> activateCitizen(
            @Valid @RequestBody CitizenActivationRequest request
    ) {
        citizenActivationService.activate(request);

        return ResponseEntity.ok(
                "Citizen account activated successfully"
        );
    }
}
