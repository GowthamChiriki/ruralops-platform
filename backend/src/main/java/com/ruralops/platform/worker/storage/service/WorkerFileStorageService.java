package com.ruralops.platform.worker.storage.service;

import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;
import com.ruralops.platform.common.storage.CloudinaryService;

import com.ruralops.platform.worker.domain.WorkerAccount;
import com.ruralops.platform.worker.repository.WorkerAccountRepository;

import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;
import java.util.UUID;

/**
 * Handles storage of worker uploaded files using Cloudinary.
 *
 * Files are uploaded to:
 *   workers/{workerId}/profile
 *   workers/{workerId}/attachments
 *
 * Returns public Cloudinary URL.
 */
@Slf4j
@Service
public class WorkerFileStorageService {

    private final WorkerAccountRepository workerAccountRepository;
    private final CloudinaryService cloudinaryService;

    public WorkerFileStorageService(
            WorkerAccountRepository workerAccountRepository,
            CloudinaryService cloudinaryService
    ) {
        this.workerAccountRepository = workerAccountRepository;
        this.cloudinaryService = cloudinaryService;
    }

    /* =========================================================
       ALLOWED FILE TYPES
       ========================================================= */

    private static final Set<String> ALLOWED_IMAGE_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png");

    private static final Set<String> ALLOWED_ATTACHMENT_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png", "application/pdf");

    /* =========================================================
       PROFILE PHOTO STORAGE
       ========================================================= */

    public String storeProfilePhoto(UUID userId, MultipartFile file) {

        validateFile(file, ALLOWED_IMAGE_TYPES, 5 * 1024 * 1024);

        return uploadToCloudinary(userId, "profile", file);
    }

    /* =========================================================
       WORK ATTACHMENT STORAGE
       ========================================================= */

    public String storeWorkerAttachment(UUID userId, MultipartFile file) {

        validateFile(file, ALLOWED_ATTACHMENT_TYPES, 10 * 1024 * 1024);

        return uploadToCloudinary(userId, "attachments", file);
    }

    /* =========================================================
       CLOUDINARY STORAGE
       ========================================================= */

    private String uploadToCloudinary(UUID userId, String folder, MultipartFile file) {

        WorkerAccount worker = workerAccountRepository
                .findByUser_Id(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Worker account not found for user: " + userId
                        )
                );

        String workerId = sanitizePath(worker.getWorkerId());

        String cloudFolder = "workers/" + workerId + "/" + folder;

        String url = cloudinaryService.upload(file, cloudFolder);

        log.info(
                "Worker file uploaded to Cloudinary | userId={} | workerId={} | folder={} | url={}",
                userId,
                workerId,
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
            throw new InvalidRequestException("Worker ID must not be blank");
        }

        return input.replaceAll("[^a-zA-Z0-9_\\-]", "_");
    }
}