package com.ruralops.platform.complaints.storage.controller;

import com.ruralops.platform.complaints.storage.service.ComplaintFileStorageService;

import com.ruralops.platform.common.exception.GovernanceViolationException;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Handles complaint evidence uploads.
 *
 * Workflow:
 *
 * Citizen uploads BEFORE image → stored on disk → URL returned
 * Worker  uploads AFTER image  → stored on disk → URL returned
 *
 * The returned URL is stored inside the complaint record.
 *
 * Security:
 *
 * FIX: The path parameter (citizenId / workerId) is compared against the
 * authenticated principal's username. A citizen cannot store a file under
 * another citizen's ID, and a worker cannot store under another worker's ID.
 *
 * This assumes the authentication layer populates UserDetails#getUsername()
 * with the citizen or worker's public ID (citizenId / workerId). Adjust the
 * principal extraction if your security setup uses a different field.
 */
@RestController
@RequestMapping("/complaints/files")
public class ComplaintFileUploadController {

    private final ComplaintFileStorageService storageService;

    public ComplaintFileUploadController(
            ComplaintFileStorageService storageService
    ) {
        this.storageService = storageService;
    }

    /**
     * Citizen uploads issue evidence.
     *
     * POST /complaints/files/before/{citizenId}
     */
    @PostMapping("/before/{citizenId}")
    public ResponseEntity<Map<String, String>> uploadBeforeImage(
            @PathVariable String citizenId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails principal
    ) {
        validateIdentity(principal, citizenId, "citizen");

        String url = storageService.storeBeforeImage(citizenId, file);

        return ResponseEntity.ok(Map.of("url", url));
    }

    /**
     * Worker uploads resolution evidence.
     *
     * POST /complaints/files/after/{workerId}
     */
    @PostMapping("/after/{workerId}")
    public ResponseEntity<Map<String, String>> uploadAfterImage(
            @PathVariable String workerId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails principal
    ) {
        validateIdentity(principal, workerId, "worker");

        String url = storageService.storeAfterImage(workerId, file);

        return ResponseEntity.ok(Map.of("url", url));
    }

    /* =====================================================
       Helper
       ===================================================== */

    /**
     * Verifies that the authenticated user's identity matches the path
     * parameter, preventing users from uploading files under another
     * user's ID.
     *
     * @param principal  the authenticated user (injected by Spring Security)
     * @param pathId     the ID from the URL path
     * @param role       label used in the error message ("citizen" / "worker")
     */
    private void validateIdentity(
            UserDetails principal,
            String pathId,
            String role
    ) {
        if (principal == null) {
            throw new GovernanceViolationException(
                    "Authentication required to upload complaint evidence"
            );
        }

        if (!principal.getUsername().equals(pathId)) {
            throw new GovernanceViolationException(
                    "Authenticated " + role + " does not match upload target ID"
            );
        }
    }
}