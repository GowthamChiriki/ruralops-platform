package com.ruralops.platform.administration.vao.controller;

import com.ruralops.platform.administration.vao.dto.VaoProfileCompletionRequest;
import com.ruralops.platform.administration.vao.dto.VaoProfileResponse;
import com.ruralops.platform.administration.vao.service.VaoProfileService;
import com.ruralops.platform.auth.security.AuthenticatedUserPrincipal;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Handles VAO profile lifecycle operations.
 *
 * Identity is resolved from JWT via AuthenticatedUserPrincipal.
 */
@RestController
@RequestMapping("/vao/profile")
public class VaoProfileController {

    private final VaoProfileService profileService;

    public VaoProfileController(VaoProfileService profileService) {
        this.profileService = profileService;
    }

    /* =====================================================
       PROFILE COMPLETION STATUS
       ===================================================== */

    @GetMapping("/status")
    public ResponseEntity<Boolean> getProfileStatus(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {

        UUID userId = extractUserId(principal);

        boolean completed =
                profileService.isProfileCompleted(userId);

        return ResponseEntity.ok(completed);
    }

    /* =====================================================
       GET PROFILE DETAILS
       ===================================================== */

    @GetMapping
    public ResponseEntity<VaoProfileResponse> getProfile(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {

        UUID userId = extractUserId(principal);

        VaoProfileResponse profile =
                profileService.getProfileDetails(userId);

        return ResponseEntity.ok(profile);
    }

    /* =====================================================
       COMPLETE PROFILE
       ===================================================== */

    @PostMapping("/complete")
    public ResponseEntity<String> completeProfile(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody VaoProfileCompletionRequest request
    ) {

        UUID userId = extractUserId(principal);

        profileService.completeProfile(userId, request);

        return ResponseEntity.ok(
                "VAO profile completed successfully"
        );
    }

    /* =====================================================
       UPDATE PROFILE
       ===================================================== */

    @PutMapping
    public ResponseEntity<String> updateProfile(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody VaoProfileCompletionRequest request
    ) {

        UUID userId = extractUserId(principal);

        profileService.updateProfile(userId, request);

        return ResponseEntity.ok(
                "VAO profile updated successfully"
        );
    }

    /* =====================================================
       HELPER
       ===================================================== */

    private UUID extractUserId(AuthenticatedUserPrincipal principal) {

        if (principal == null) {
            throw new IllegalStateException(
                    "Authenticated principal is missing"
            );
        }

        return principal.getUserId();
    }
}