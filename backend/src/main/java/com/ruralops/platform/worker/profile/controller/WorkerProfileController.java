package com.ruralops.platform.worker.profile.controller;

import com.ruralops.platform.auth.security.AuthenticatedUserPrincipal;
import com.ruralops.platform.worker.profile.dto.WorkerProfileCompletionRequest;
import com.ruralops.platform.worker.profile.dto.WorkerProfileUpdateRequest;
import com.ruralops.platform.worker.profile.dto.WorkerProfileResponse;
import com.ruralops.platform.worker.profile.service.WorkerProfileService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller exposing worker profile APIs.
 *
 * The worker identity is derived from the authenticated JWT token.
 * No workerId is accepted from the client.
 */
@RestController
@RequestMapping("/worker/profile")
public class WorkerProfileController {

    private final WorkerProfileService workerProfileService;

    public WorkerProfileController(WorkerProfileService workerProfileService) {
        this.workerProfileService = workerProfileService;
    }

    /* ======================================================
       Create Worker Profile
       ====================================================== */

    @PostMapping
    public ResponseEntity<Void> createProfile(
            @AuthenticationPrincipal AuthenticatedUserPrincipal user,
            @Valid @RequestBody WorkerProfileCompletionRequest request
    ) {

        workerProfileService.createProfile(user.getUserId(), request);

        return ResponseEntity.ok().build();
    }

    /* ======================================================
       Update Worker Profile
       ====================================================== */

    @PutMapping
    public ResponseEntity<Void> updateProfile(
            @AuthenticationPrincipal AuthenticatedUserPrincipal user,
            @Valid @RequestBody WorkerProfileUpdateRequest request
    ) {

        workerProfileService.updateProfile(user.getUserId(), request);

        return ResponseEntity.ok().build();
    }

    /* ======================================================
       Get Worker Profile
       ====================================================== */

    @GetMapping
    public ResponseEntity<WorkerProfileResponse> getProfile(
            @AuthenticationPrincipal AuthenticatedUserPrincipal user
    ) {

        WorkerProfileResponse response =
                workerProfileService.getProfile(user.getUserId());

        return ResponseEntity.ok(response);
    }

    /* ======================================================
       Profile Completion Status
       ====================================================== */

    @GetMapping("/status")
    public ResponseEntity<Boolean> isProfileCompleted(
            @AuthenticationPrincipal AuthenticatedUserPrincipal user
    ) {

        boolean completed =
                workerProfileService.isProfileCompleted(user.getUserId());

        return ResponseEntity.ok(completed);
    }

    /* ======================================================
       Profile Photo Update
       ====================================================== */

    @PatchMapping("/photo")
    public ResponseEntity<Void> updateProfilePhoto(
            @AuthenticationPrincipal AuthenticatedUserPrincipal user,
            @RequestParam String photoUrl
    ) {

        workerProfileService.updateProfilePhoto(user.getUserId(), photoUrl);

        return ResponseEntity.ok().build();
    }
}