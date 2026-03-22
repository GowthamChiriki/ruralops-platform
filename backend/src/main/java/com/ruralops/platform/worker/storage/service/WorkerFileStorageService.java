package com.ruralops.platform.worker.storage.service;

import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.FileStorageException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;

import com.ruralops.platform.worker.domain.WorkerAccount;
import com.ruralops.platform.worker.repository.WorkerAccountRepository;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

/**
 * Handles storage of worker uploaded files.
 *
 * Current implementation uses local filesystem storage.
 * Architecture allows migration to cloud storage (S3 / Azure Blob)
 * without changing controller or API contract.
 */
@Slf4j
@Service
public class WorkerFileStorageService {

    private final WorkerAccountRepository workerAccountRepository;

    public WorkerFileStorageService(
            WorkerAccountRepository workerAccountRepository
    ) {
        this.workerAccountRepository = workerAccountRepository;
    }

    /* =========================================================
       ALLOWED FILE TYPES
       ========================================================= */

    private static final Set<String> ALLOWED_IMAGE_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png");

    private static final Set<String> ALLOWED_ATTACHMENT_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png", "application/pdf");

    /* =========================================================
       CONFIGURATION
       ========================================================= */

    @Value("${storage.root:uploads/workers}")
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
       WORK ATTACHMENT STORAGE
       ========================================================= */

    public String storeWorkerAttachment(UUID userId, MultipartFile file) {

        validateFile(file, ALLOWED_ATTACHMENT_TYPES, 10 * 1024 * 1024);

        return storeFile(userId, "attachments", file);
    }

    /* =========================================================
       CORE STORAGE LOGIC
       ========================================================= */

    private String storeFile(UUID userId, String folder, MultipartFile file) {

        WorkerAccount worker = workerAccountRepository
                .findByUser_Id(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Worker account not found for user: " + userId
                        )
                );

        String workerId = sanitizePath(worker.getWorkerId());

        try {

            String extension = getFileExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + extension;

            Path workerFolder = Paths.get(storageRoot, workerId, folder);

            Files.createDirectories(workerFolder);

            Path destination = workerFolder.resolve(filename);

            Files.copy(
                    file.getInputStream(),
                    destination,
                    StandardCopyOption.REPLACE_EXISTING
            );

            String publicUrl = buildPublicUrl(workerId, folder, filename);

            log.info(
                    "File stored successfully | userId={} | workerId={} | folder={} | file={}",
                    userId,
                    workerId,
                    folder,
                    filename
            );

            return publicUrl;

        } catch (IOException e) {

            log.error(
                    "File storage failed for worker {} : {}",
                    workerId,
                    e.getMessage()
            );

            throw new FileStorageException(
                    "Failed to store file for worker " + workerId,
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

    private String buildPublicUrl(String workerId, String folder, String filename) {

        return baseUrl +
                "/uploads/workers/" +
                workerId +
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
            throw new InvalidRequestException("Worker ID must not be blank");
        }

        return input.replaceAll("[^a-zA-Z0-9_\\-]", "_");
    }
}