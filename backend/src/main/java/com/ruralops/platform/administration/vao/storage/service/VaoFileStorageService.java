package com.ruralops.platform.administration.vao.storage.service;

import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.storage.CloudinaryService;

import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

/**
 * Handles storage of VAO uploaded files using Cloudinary.
 *
 * Files are uploaded to Cloudinary folders:
 *   vaos/{vaoId}/profile
 *   vaos/{vaoId}/signature
 *   vaos/{vaoId}/id-proof
 *
 * Returns secure public URL from Cloudinary.
 */
@Slf4j
@Service
public class VaoFileStorageService {

    private final CloudinaryService cloudinaryService;

    public VaoFileStorageService(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    /* =========================================================
       ALLOWED FILE TYPES
       ========================================================= */

    private static final Set<String> ALLOWED_IMAGE_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png");

    private static final Set<String> ALLOWED_DOC_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png", "application/pdf");

    /* =========================================================
       PUBLIC API
       ========================================================= */

    /** Store VAO profile photo. Max 5 MB. */
    public String storeProfilePhoto(String vaoId, MultipartFile file) {
        validateFile(file, ALLOWED_IMAGE_TYPES, 5 * 1024 * 1024);
        return uploadToCloudinary(vaoId, "profile", file);
    }

    /** Store VAO signature. Max 3 MB. */
    public String storeSignature(String vaoId, MultipartFile file) {
        validateFile(file, ALLOWED_IMAGE_TYPES, 3 * 1024 * 1024);
        return uploadToCloudinary(vaoId, "signature", file);
    }

    /** Store VAO ID proof. Max 5 MB. */
    public String storeIdProof(String vaoId, MultipartFile file) {
        validateFile(file, ALLOWED_DOC_TYPES, 5 * 1024 * 1024);
        return uploadToCloudinary(vaoId, "id-proof", file);
    }

    /* =========================================================
       CLOUDINARY STORAGE
       ========================================================= */

    private String uploadToCloudinary(String vaoId, String folder, MultipartFile file) {

        String sanitizedId = sanitizePath(vaoId);

        String cloudFolder = "vaos/" + sanitizedId + "/" + folder;

        String url = cloudinaryService.upload(file, cloudFolder);

        log.info(
                "VAO file uploaded to Cloudinary | vaoId={} | folder={} | url={}",
                sanitizedId,
                folder,
                url
        );

        return url;
    }

    /* =========================================================
       VALIDATION
       ========================================================= */

    private void validateFile(MultipartFile file, Set<String> allowedTypes, long maxBytes) {

        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("File cannot be empty");
        }

        String type = file.getContentType();

        if (type == null || !allowedTypes.contains(type.toLowerCase())) {
            throw new InvalidRequestException(
                    "Invalid file type: " + type + ". Allowed: " + allowedTypes
            );
        }

        if (file.getSize() > maxBytes) {
            throw new InvalidRequestException(
                    "File size " + file.getSize() + " exceeds limit of " + maxBytes + " bytes"
            );
        }
    }

    /* =========================================================
       HELPERS
       ========================================================= */

    private String sanitizePath(String input) {
        return input.replaceAll("[^a-zA-Z0-9_\\-]", "_");
    }
}