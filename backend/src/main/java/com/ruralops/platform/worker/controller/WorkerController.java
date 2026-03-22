package com.ruralops.platform.worker.controller;

import com.ruralops.platform.auth.security.AuthenticatedUserPrincipal;
import com.ruralops.platform.worker.dto.WorkerActivationRequest;
import com.ruralops.platform.worker.dto.WorkerProvisionRequest;
import com.ruralops.platform.worker.dto.WorkerSummaryResponse;

import com.ruralops.platform.worker.service.WorkerActivationService;
import com.ruralops.platform.worker.service.WorkerProvisionService;
import com.ruralops.platform.worker.service.WorkerStatusService;

import com.ruralops.platform.governance.domain.Village;

import com.ruralops.platform.administration.vah.repository.VaoAccountRepository;
import com.ruralops.platform.administration.vah.domain.VaoAccount;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/workers")
public class WorkerController {

    private final WorkerProvisionService provisionService;
    private final WorkerActivationService activationService;
    private final WorkerStatusService statusService;
    private final VaoAccountRepository vaoAccountRepository;

    public WorkerController(
            WorkerProvisionService provisionService,
            WorkerActivationService activationService,
            WorkerStatusService statusService,
            VaoAccountRepository vaoAccountRepository
    ) {
        this.provisionService = provisionService;
        this.activationService = activationService;
        this.statusService = statusService;
        this.vaoAccountRepository = vaoAccountRepository;
    }

    /* =====================================================
       PROVISION WORKER (VAO)
       ===================================================== */

    @PostMapping("/provision")
    public ResponseEntity<String> provisionWorker(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody WorkerProvisionRequest request
    ) {

        UUID userId = principal.getUserId();

        provisionService.provisionWorker(
                userId,
                request.getName(),
                request.getEmail(),
                request.getPhoneNumber(),
                request.getAreaId()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body("Worker provisioned successfully. Activation pending.");
    }

    /* =====================================================
       ACTIVATE WORKER
       ===================================================== */

    @PostMapping("/activate")
    public ResponseEntity<String> activateWorker(
            @Valid @RequestBody WorkerActivationRequest request
    ) {

        activationService.activate(request);

        return ResponseEntity.ok("Worker account activated successfully");
    }

    /* =====================================================
       GET WORKER STATUS
       ===================================================== */

    @GetMapping("/{workerId}/status")
    public ResponseEntity<WorkerSummaryResponse> getWorkerStatus(
            @PathVariable String workerId
    ) {

        WorkerSummaryResponse response =
                statusService.getByWorkerId(workerId);

        return ResponseEntity.ok(response);
    }

    /* =====================================================
       GET WORKERS FOR VAO'S VILLAGE
       ===================================================== */

    @GetMapping("/village")
    public ResponseEntity<List<WorkerSummaryResponse>> getWorkersForVao(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {

        UUID userId = principal.getUserId();

        VaoAccount vao = vaoAccountRepository
                .findByUserId(userId)
                .orElseThrow(() ->
                        new RuntimeException("VAO not found for user: " + userId)
                );

        Village village = vao.getVillage();

        List<WorkerSummaryResponse> workers =
                statusService.getWorkersForVillage(village);

        return ResponseEntity.ok(workers);
    }
}