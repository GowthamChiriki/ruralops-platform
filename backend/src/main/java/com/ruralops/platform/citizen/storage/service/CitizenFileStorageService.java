package com.ruralops.platform.citizen.storage.service;

import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.FileStorageException;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

/**
 * Handles storage of citizen uploaded files.
 *
 * Current implementation uses local filesystem storage.
 * Architecture allows migration to cloud storage (S3 / Azure Blob)
 * without changing controller or API contract.
 */
@Slf4j
@Service
public class CitizenFileStorageService {

    /* =========================================================
       ALLOWED FILE TYPES
       ========================================================= */

    private static final Set<String> ALLOWED_IMAGE_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png");

    private static final Set<String> ALLOWED_COMPLAINT_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png", "application/pdf");

    /* =========================================================
       CONFIGURATION
       ========================================================= */

    @Value("${storage.root:uploads/citizens}")
    private String storageRoot;

    @Value("${storage.base-url:http://localhost:8080}")
    private String baseUrl;

    /* =========================================================
       PROFILE PHOTO STORAGE
       ========================================================= */

    public String storeProfilePhoto(UUID userId, MultipartFile file) {

        validateFile(file, ALLOWED_IMAGE_TYPES, 5 * 1024 * 1024);

        return storeFile(userId, "profile", file);
    }

    /* =========================================================
       COMPLAINT ATTACHMENT STORAGE
       ========================================================= */

    public String storeComplaintFile(UUID userId, MultipartFile file) {

        validateFile(file, ALLOWED_COMPLAINT_TYPES, 10 * 1024 * 1024);

        return storeFile(userId, "complaints", file);
    }

    /* =========================================================
       CORE STORAGE LOGIC
       ========================================================= */

    private String storeFile(UUID userId, String folder, MultipartFile file) {

        String citizenId = sanitizePath(userId.toString());

        try {

            String extension = getFileExtension(file.getOriginalFilename());

            String filename = UUID.randomUUID() + extension;

            Path citizenFolder = Paths.get(storageRoot, citizenId, folder);

            Files.createDirectories(citizenFolder);

            Path destination = citizenFolder.resolve(filename);

            Files.copy(
                    file.getInputStream(),
                    destination,
                    StandardCopyOption.REPLACE_EXISTING
            );

            String publicUrl = buildPublicUrl(citizenId, folder, filename);

            log.info(
                    "File stored successfully | citizenId={} | folder={} | file={}",
                    citizenId,
                    folder,
                    filename
            );

            return publicUrl;

        } catch (IOException e) {

            log.error(
                    "File storage failed for citizen {} : {}",
                    citizenId,
                    e.getMessage()
            );

            throw new FileStorageException(
                    "Failed to store file for citizen " + citizenId,
                    e
            );
        }
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

    private String buildPublicUrl(String citizenId, String folder, String filename) {

        return baseUrl +
                "/uploads/citizens/" +
                citizenId +
                "/" +
                folder +
                "/" +
                filename;
    }

    private String getFileExtension(String filename) {

        if (filename == null || !filename.contains(".")) {
            return "";
        }

        return filename.substring(filename.lastIndexOf(".")).toLowerCase();
    }

    /**
     * Prevents path traversal attacks.
     */
    private String sanitizePath(String input) {

        if (input == null || input.isBlank()) {
            throw new InvalidRequestException("Citizen ID must not be blank");
        }

        return input.replaceAll("[^a-zA-Z0-9_\\-]", "_");
    }
}