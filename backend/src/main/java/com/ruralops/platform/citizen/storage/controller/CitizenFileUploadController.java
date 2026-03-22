package com.ruralops.platform.citizen.storage.controller;

import com.ruralops.platform.auth.security.AuthenticatedUserPrincipal;
import com.ruralops.platform.citizen.storage.service.CitizenFileStorageService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

/**
 * REST controller responsible for handling
 * citizen file uploads.
 *
 * Citizen identity is resolved from the JWT.
 */
@RestController
@RequestMapping("/citizen/files")
public class CitizenFileUploadController {

    private final CitizenFileStorageService citizenFileStorageService;

    public CitizenFileUploadController(
            CitizenFileStorageService citizenFileStorageService
    ) {
        this.citizenFileStorageService = citizenFileStorageService;
    }

    /* =========================================================
       PROFILE PHOTO UPLOAD
       ========================================================= */

    @PostMapping("/profile-photo")
    public ResponseEntity<Map<String, String>> uploadProfilePhoto(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam("file") MultipartFile file
    ) {

        UUID userId = principal.getUserId();

        String fileUrl =
                citizenFileStorageService.storeProfilePhoto(userId, file);

        return ResponseEntity.ok(
                Map.of(
                        "message", "Profile photo uploaded successfully",
                        "url", fileUrl
                )
        );
    }

    /* =========================================================
       COMPLAINT FILE UPLOAD
       ========================================================= */

    @PostMapping("/complaint-file")
    public ResponseEntity<Map<String, String>> uploadComplaintFile(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam("file") MultipartFile file
    ) {

        UUID userId = principal.getUserId();

        String fileUrl =
                citizenFileStorageService.storeComplaintFile(userId, file);

        return ResponseEntity.ok(
                Map.of(
                        "message", "File uploaded successfully",
                        "url", fileUrl
                )
        );
    }
}