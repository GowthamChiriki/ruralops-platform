package com.ruralops.platform.complaints.storage.service;

import com.ruralops.platform.common.exception.FileStorageException;
import com.ruralops.platform.common.exception.InvalidRequestException;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Stores complaint evidence images.
 *
 * File layout:
 *
 * uploads/
 *   complaints/
 *       {citizenId}/before/{uuid}.jpg
 *       {workerId}/after/{uuid}.jpg
 *
 * Public URLs:
 *
 * {baseUrl}/uploads/complaints/{id}/{folder}/{file}
 *
 * Security:
 *
 * File type is validated against both the declared Content-Type header
 * AND the actual file magic bytes (first bytes of the stream), so a
 * client cannot bypass validation by lying about the content type.
 */
@Slf4j
@Service
public class ComplaintFileStorageService {

    /**
     * Allowed MIME types and their corresponding magic byte signatures.
     *
     * JPEG: starts with FF D8 FF
     * PNG:  starts with 89 50 4E 47 0D 0A 1A 0A
     */
    private static final Set<String> ALLOWED_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png");

    private static final Map<String, byte[]> MAGIC_BYTES = Map.of(
            "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF},
            "image/jpg",  new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF},
            "image/png",  new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}
    );

    /** Canonical extension per allowed MIME type. */
    private static final Map<String, String> CANONICAL_EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/jpg",  ".jpg",
            "image/png",  ".png"
    );

    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5 MB

    @Value("${storage.complaints.root:uploads/complaints}")
    private String storageRoot;

    @Value("${storage.base-url:http://localhost:8080}")
    private String baseUrl;

    /* ==========================================
       PUBLIC API
       ========================================== */

    public String storeBeforeImage(String citizenId, MultipartFile file) {
        validate(file);
        return storeFile(citizenId, "before", file);
    }

    public String storeAfterImage(String workerId, MultipartFile file) {
        validate(file);
        return storeFile(workerId, "after", file);
    }

    /* ==========================================
       CORE STORAGE LOGIC
       ========================================== */

    private String storeFile(
            String ownerId,
            String folder,
            MultipartFile file
    ) {
        try {
            String safeId = sanitize(ownerId);

            /*
             * FIX: Use the canonical extension derived from the validated
             * content type rather than parsing the client-supplied filename.
             * This prevents extension spoofing (e.g. evil.php renamed to
             * evil.jpg) from influencing the stored filename.
             */
            String extension = CANONICAL_EXTENSIONS.getOrDefault(
                    file.getContentType().toLowerCase(), ".bin"
            );

            String filename = UUID.randomUUID() + extension;

            Path directory = Paths.get(storageRoot, safeId, folder);
            Files.createDirectories(directory);

            Path destination = directory.resolve(filename);
            Files.copy(
                    file.getInputStream(),
                    destination,
                    StandardCopyOption.REPLACE_EXISTING
            );

            String url = buildUrl(safeId, folder, filename);

            log.info(
                    "Complaint evidence stored | owner={} | folder={} | file={}",
                    safeId, folder, filename
            );

            return url;

        } catch (IOException e) {
            throw new FileStorageException(
                    "Failed to store complaint file", e
            );
        }
    }

    /* ==========================================
       VALIDATION
       ========================================== */

    private void validate(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("File cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new InvalidRequestException("File exceeds 5 MB limit");
        }

        String declaredType = file.getContentType();

        if (declaredType == null ||
                !ALLOWED_TYPES.contains(declaredType.toLowerCase())) {
            throw new InvalidRequestException(
                    "Invalid file type: " + declaredType
            );
        }

        /*
         * FIX: Validate magic bytes in addition to the declared Content-Type.
         *
         * The Content-Type header is client-controlled — a malicious upload
         * can set any value. Reading the first bytes of the actual file data
         * confirms the real format regardless of what the header claims.
         */
        validateMagicBytes(file, declaredType.toLowerCase());
    }

    /**
     * Reads the first N bytes of the file and checks them against the
     * known signature for the declared MIME type.
     */
    private void validateMagicBytes(MultipartFile file, String declaredType) {

        byte[] expected = MAGIC_BYTES.get(declaredType);

        if (expected == null) {
            // Should not reach here — declaredType already passed ALLOWED_TYPES check.
            throw new InvalidRequestException(
                    "Unrecognised file type: " + declaredType
            );
        }

        try (InputStream stream = file.getInputStream()) {

            byte[] header = stream.readNBytes(expected.length);

            if (header.length < expected.length) {
                throw new InvalidRequestException(
                        "File too small to be a valid image"
                );
            }

            for (int i = 0; i < expected.length; i++) {
                if (header[i] != expected[i]) {
                    throw new InvalidRequestException(
                            "File content does not match declared type: " + declaredType
                    );
                }
            }

        } catch (IOException e) {
            throw new FileStorageException(
                    "Failed to read file for validation", e
            );
        }
    }

    /* ==========================================
       HELPERS
       ========================================== */

    private String buildUrl(String id, String folder, String filename) {
        return baseUrl
                + "/uploads/complaints/"
                + id + "/"
                + folder + "/"
                + filename;
    }

    /**
     * Strips characters that could cause path traversal or filesystem issues.
     * Input like "../etc/passwd" becomes "__.._etc_passwd", which is safe.
     */
    private String sanitize(String input) {
        return input.replaceAll("[^a-zA-Z0-9_-]", "_");
    }
}