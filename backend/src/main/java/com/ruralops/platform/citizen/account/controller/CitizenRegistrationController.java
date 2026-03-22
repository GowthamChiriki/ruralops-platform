package com.ruralops.platform.citizen.account.controller;

import com.ruralops.platform.citizen.account.dto.CitizenRegistrationRequest;
import com.ruralops.platform.citizen.account.service.CitizenRegistrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Citizen Registration Controller.
 *
 * RESPONSIBILITY:
 * - Accept citizen self-registration
 * - Create citizen account in PENDING_APPROVAL state
 *
 * SECURITY:
 * - Public endpoint
 * - No authentication required
 * - No activation here
 *
 * FLOW:
 * Citizen → Register → Status Check → VAO Approval → Activation
 */
@RestController
@RequestMapping("/citizen")
public class CitizenRegistrationController {

    private final CitizenRegistrationService registrationService;

    public CitizenRegistrationController(
            CitizenRegistrationService registrationService
    ) {
        this.registrationService = registrationService;
    }

    /**
     * Citizen self-registration.
     *
     * RESULT:
     * - Citizen account created in PENDING_APPROVAL
     * - No citizen ID returned
     * - Client must use status-check flow next
     */
    @PostMapping("/register")
    public ResponseEntity<String> registerCitizen(
            @Valid @RequestBody CitizenRegistrationRequest request
    ) {
        registrationService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        "Citizen registration submitted. Await VAO approval."
                );
    }
}
