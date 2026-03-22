package com.ruralops.platform.administration.vao.storage.controller;

import com.ruralops.platform.administration.vao.storage.service.VaoFileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * REST controller for VAO file uploads.
 *
 * The frontend profile form calls these endpoints BEFORE submitting
 * the profile JSON. Each endpoint:
 *   1. Receives a multipart file
 *   2. Saves it to disk via VaoFileStorageService
 *   3. Returns a JSON { "url": "http://localhost:8080/uploads/vaos/..." }
 *
 * The frontend stores this real server URL in form state, then sends
 * it as profilePhotoUrl / signaturePhotoUrl in the profile JSON body.
 *
 * This is the ONLY correct flow — blob URLs must NEVER be submitted
 * to the profile endpoint.
 *
 * Endpoints:
 *   POST /vao/{vaoId}/files/profile-photo   → saves profile photo
 *   POST /vao/{vaoId}/files/signature       → saves signature
 *   POST /vao/{vaoId}/files/id-proof        → saves ID proof (optional)
 */
@RestController
@RequestMapping("/vao/{vaoId}/files")
public class VaoFileUploadController {

    private final VaoFileStorageService fileStorageService;

    public VaoFileUploadController(VaoFileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    /**
     * Upload profile photo.
     * Returns: { "url": "http://localhost:8080/uploads/vaos/{vaoId}/profile/{uuid}.jpg" }
     */
    @PostMapping("/profile-photo")
    public ResponseEntity<Map<String, String>> uploadProfilePhoto(
            @PathVariable String vaoId,
            @RequestParam("file") MultipartFile file
    ) {
        String url = fileStorageService.storeProfilePhoto(vaoId, file);
        return ResponseEntity.ok(Map.of("url", url));
    }

    /**
     * Upload signature image.
     * Returns: { "url": "http://localhost:8080/uploads/vaos/{vaoId}/signature/{uuid}.jpg" }
     */
    @PostMapping("/signature")
    public ResponseEntity<Map<String, String>> uploadSignature(
            @PathVariable String vaoId,
            @RequestParam("file") MultipartFile file
    ) {
        String url = fileStorageService.storeSignature(vaoId, file);
        return ResponseEntity.ok(Map.of("url", url));
    }

    /**
     * Upload ID proof (optional document).
     * Returns: { "url": "http://localhost:8080/uploads/vaos/{vaoId}/id-proof/{uuid}.jpg" }
     *
     * NOTE: You need to add a storeIdProof() method to VaoFileStorageService
     * that mirrors storeProfilePhoto() but uses folder "id-proof".
     * See the comment in VaoFileStorageService for how to add it.
     */
    @PostMapping("/id-proof")
    public ResponseEntity<Map<String, String>> uploadIdProof(
            @PathVariable String vaoId,
            @RequestParam("file") MultipartFile file
    ) {
        String url = fileStorageService.storeIdProof(vaoId, file);
        return ResponseEntity.ok(Map.of("url", url));
    }
}