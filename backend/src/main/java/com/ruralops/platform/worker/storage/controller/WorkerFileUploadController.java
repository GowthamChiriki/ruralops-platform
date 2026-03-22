package com.ruralops.platform.worker.storage.controller;

import com.ruralops.platform.auth.security.AuthenticatedUserPrincipal;
import com.ruralops.platform.worker.storage.service.WorkerFileStorageService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

/**
 * REST controller responsible for handling
 * worker file uploads.
 *
 * Worker identity is resolved from the JWT.
 */
@RestController
@RequestMapping("/worker/files")
public class WorkerFileUploadController {

    private final WorkerFileStorageService workerFileStorageService;

    public WorkerFileUploadController(
            WorkerFileStorageService workerFileStorageService
    ) {
        this.workerFileStorageService = workerFileStorageService;
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
                workerFileStorageService.storeProfilePhoto(userId, file);

        return ResponseEntity.ok(
                Map.of(
                        "message", "Profile photo uploaded successfully",
                        "url", fileUrl
                )
        );
    }

    /* =========================================================
       WORK ATTACHMENT UPLOAD
       ========================================================= */

    @PostMapping("/attachment")
    public ResponseEntity<Map<String, String>> uploadAttachment(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal,
            @RequestParam("file") MultipartFile file
    ) {

        UUID userId = principal.getUserId();

        String fileUrl =
                workerFileStorageService.storeWorkerAttachment(userId, file);

        return ResponseEntity.ok(
                Map.of(
                        "message", "File uploaded successfully",
                        "url", fileUrl
                )
        );
    }
}