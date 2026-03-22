package com.ruralops.platform.secure.status.controller;

import com.ruralops.platform.secure.status.dto.StatusCheckRequest;
import com.ruralops.platform.secure.status.dto.StatusCheckResponse;
import com.ruralops.platform.secure.status.service.StatusCheckService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/status")
public class StatusCheckController {

    private final StatusCheckService statusCheckService;

    public StatusCheckController(StatusCheckService statusCheckService) {
        this.statusCheckService = statusCheckService;
    }

    /**
     * Check account status using phone number.
     *
     * SAFE:
     * - Read-only
     * - No authentication required
     * - No side effects
     *
     * Supports multiple accounts per phone number.
     */
    @PostMapping("/check")
    public ResponseEntity<List<StatusCheckResponse>> checkStatus(
            @Valid @RequestBody StatusCheckRequest request
    ) {

        List<StatusCheckResponse> responses =
                statusCheckService.checkByPhoneNumber(
                        request.getPhoneNumber()
                );

        return ResponseEntity.ok(responses);
    }
}