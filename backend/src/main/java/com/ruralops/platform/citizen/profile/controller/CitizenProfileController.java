package com.ruralops.platform.citizen.profile.controller;

import com.ruralops.platform.auth.security.AuthenticatedUserPrincipal;
import com.ruralops.platform.citizen.profile.dto.CitizenProfileRequest;
import com.ruralops.platform.citizen.profile.dto.CitizenProfileResponse;
import com.ruralops.platform.citizen.profile.service.CitizenProfileService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/citizen/profile")
public class CitizenProfileController {

    private final CitizenProfileService citizenProfileService;

    public CitizenProfileController(CitizenProfileService citizenProfileService) {
        this.citizenProfileService = citizenProfileService;
    }

    /* =====================================================
       CREATE PROFILE
       ===================================================== */

    @PostMapping
    public ResponseEntity<Void> createProfile(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody CitizenProfileRequest request
    ) {

        UUID userId = principal.getUserId();

        citizenProfileService.createProfile(userId, request);

        return ResponseEntity.ok().build();
    }

    /* =====================================================
       UPDATE PROFILE
       ===================================================== */

    @PutMapping
    public ResponseEntity<Void> updateProfile(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @Valid @RequestBody CitizenProfileRequest request
    ) {

        UUID userId = principal.getUserId();

        citizenProfileService.updateProfile(userId, request);

        return ResponseEntity.ok().build();
    }

    /* =====================================================
       GET PROFILE
       ===================================================== */

    @GetMapping
    public ResponseEntity<CitizenProfileResponse> getProfile(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {

        UUID userId = principal.getUserId();

        CitizenProfileResponse response =
                citizenProfileService.getProfile(userId);

        return ResponseEntity.ok(response);
    }

    /* =====================================================
       PROFILE STATUS
       ===================================================== */

    @GetMapping("/status")
    public ResponseEntity<Boolean> isProfileCompleted(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal
    ) {

        UUID userId = principal.getUserId();

        boolean completed =
                citizenProfileService.isProfileCompleted(userId);

        return ResponseEntity.ok(completed);
    }

    /* =====================================================
       UPDATE PROFILE PHOTO
       ===================================================== */

    @PatchMapping("/photo")
    public ResponseEntity<Void> updateProfilePhoto(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam String photoUrl
    ) {

        UUID userId = principal.getUserId();

        CitizenProfileRequest request = new CitizenProfileRequest();
        request.setProfilePhotoUrl(photoUrl);

        citizenProfileService.updateProfile(userId, request);

        return ResponseEntity.ok().build();
    }
}