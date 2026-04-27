package com.ruralops.platform.citizen.storage.service;

import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.storage.CloudinaryService;

import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;
import java.util.UUID;

/**
 * Handles storage of citizen uploaded files using Cloudinary.
 *
 * Files are uploaded to:
 *   citizens/{citizenId}/profile
 *   citizens/{citizenId}/complaints
 *
 * Returns public Cloudinary URL.
 */
@Slf4j
@Service
public class CitizenFileStorageService {

    private final CloudinaryService cloudinaryService;

    public CitizenFileStorageService(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    /* =========================================================
       ALLOWED FILE TYPES
       ========================================================= */

    private static final Set<String> ALLOWED_IMAGE_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png");

    private static final Set<String> ALLOWED_COMPLAINT_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png", "application/pdf");

    /* =========================================================
       PROFILE PHOTO STORAGE
       ========================================================= */

    public String storeProfilePhoto(UUID userId, MultipartFile file) {

        validateFile(file, ALLOWED_IMAGE_TYPES, 5 * 1024 * 1024);

        return uploadToCloudinary(userId, "profile", file);
    }

    /* =========================================================
       COMPLAINT FILE STORAGE
       ========================================================= */

    public String storeComplaintFile(UUID userId, MultipartFile file) {

        validateFile(file, ALLOWED_COMPLAINT_TYPES, 10 * 1024 * 1024);

        return uploadToCloudinary(userId, "complaints", file);
    }

    /* =========================================================
       CLOUDINARY STORAGE
       ========================================================= */

    private String uploadToCloudinary(UUID userId, String folder, MultipartFile file) {

        String citizenId = sanitizePath(userId.toString());

        String cloudFolder = "citizens/" + citizenId + "/" + folder;

        String url = cloudinaryService.upload(file, cloudFolder);

        log.info(
                "Citizen file uploaded to Cloudinary | citizenId={} | folder={} | url={}",
                citizenId,
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

        String contentType = file.getContentType();

        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new InvalidRequestException(
                    "File type not allowed: " + contentType
            );
        }

        if (file.getSize() > maxBytes) {
            throw new InvalidRequestException(
                    "File size must not exceed " + (maxBytes / (1024 * 1024)) + "MB"
            );
        }
    }

    /* =========================================================
       HELPERS
       ========================================================= */

    private String sanitizePath(String input) {

        if (input == null || input.isBlank()) {
            throw new InvalidRequestException("Citizen ID must not be blank");
        }

        return input.replaceAll("[^a-zA-Z0-9_\\-]", "_");
    }
}