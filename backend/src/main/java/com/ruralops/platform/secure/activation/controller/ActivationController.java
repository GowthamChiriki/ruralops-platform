package com.ruralops.platform.secure.activation.controller;

import com.ruralops.platform.secure.activation.service.ActivationRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller responsible for handling account activation requests.
 *
 * Exposes endpoints for requesting or regenerating activation keys.
 */
@RestController
@RequestMapping("/activation")
public class ActivationController {

    private final ActivationRequestService activationRequestService;

    public ActivationController(ActivationRequestService activationRequestService) {
        this.activationRequestService = activationRequestService;
    }

    /**
     * Requests or regenerates an activation key for an account.
     *
     * Security rules:
     * - Client must provide only accountType and accountId.
     * - Email is resolved internally from the system.
     * - Activation key is sent only to the registered email address.
     *
     * Supported account types include:
     * - MAO
     * - VAO
     * - Citizen
     * - Worker
     */
    @PostMapping("/request")
    public ResponseEntity<String> requestActivation(
            @RequestBody ActivationRequest request
    ) {
        activationRequestService.requestActivation(
                request.accountType(),
                request.accountId()
        );

        return ResponseEntity.ok("Activation key sent successfully");
    }

    /* =======================
       Request DTOs
       ======================= */

    /**
     * Request payload for activation.
     *
     * This DTO defines the external trust boundary.
     *
     * The client is allowed to send:
     * - accountType
     * - accountId
     *
     * The client must not send:
     * - email
     * - phone
     * - activation key
     * - any sensitive data
     */
    public record ActivationRequest(
            String accountType,
            String accountId
    ) {}
}
