package com.ruralops.platform.administration.vao.storage.service;

import com.ruralops.platform.common.exception.FileStorageException;
import com.ruralops.platform.common.exception.InvalidRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

/**
 * Handles storage of VAO uploaded files.
 *
 * Files are saved to: {storageRoot}/{vaoId}/{folder}/{uuid}.ext
 * e.g.  uploads/vaos/VAO-001/profile/abc123.jpg
 *
 * The returned URL is the full public URL:
 * e.g.  http://localhost:8080/uploads/vaos/VAO-001/profile/abc123.jpg
 *
 * StaticResourceConfig maps /uploads/** → file:uploads/ so Spring
 * serves these files directly. See WebMvcConfig / StaticResourceConfig.
 */
@Slf4j
@Service
public class VaoFileStorageService {

    private static final Set<String> ALLOWED_IMAGE_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png");

    private static final Set<String> ALLOWED_DOC_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png", "application/pdf");

    @Value("${storage.root:uploads/vaos}")
    private String storageRoot;

    @Value("${storage.base-url:http://localhost:8080}")
    private String baseUrl;

    /* =========================================================
       PUBLIC API
       ========================================================= */

    /** Store VAO profile photo. Max 5 MB. JPG/PNG only. */
    public String storeProfilePhoto(String vaoId, MultipartFile file) {
        validateFile(file, ALLOWED_IMAGE_TYPES, 5 * 1024 * 1024);
        return storeFile(vaoId, "profile", file);
    }

    /** Store VAO signature image. Max 3 MB. JPG/PNG only. */
    public String storeSignature(String vaoId, MultipartFile file) {
        validateFile(file, ALLOWED_IMAGE_TYPES, 3 * 1024 * 1024);
        return storeFile(vaoId, "signature", file);
    }

    /** Store VAO ID proof document. Max 5 MB. JPG/PNG/PDF. */
    public String storeIdProof(String vaoId, MultipartFile file) {
        validateFile(file, ALLOWED_DOC_TYPES, 5 * 1024 * 1024);
        return storeFile(vaoId, "id-proof", file);
    }

    /* =========================================================
       CORE STORAGE
       ========================================================= */

    private String storeFile(String vaoId, String folder, MultipartFile file) {
        try {
            String sanitizedId = sanitizePath(vaoId);
            String extension   = getFileExtension(file.getOriginalFilename());
            String filename    = UUID.randomUUID() + extension;

            Path vaoFolder  = Paths.get(storageRoot, sanitizedId, folder);
            Files.createDirectories(vaoFolder);

            Path destination = vaoFolder.resolve(filename);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            String publicUrl = buildPublicUrl(sanitizedId, folder, filename);

            log.info("VAO file stored | vaoId={} | folder={} | file={} | url={}",
                    sanitizedId, folder, filename, publicUrl);

            return publicUrl;

        } catch (IOException e) {
            throw new FileStorageException("Failed to store file for VAO " + vaoId, e);
        }
    }

    /* =========================================================
       VALIDATION
       ========================================================= */

    private void validateFile(MultipartFile file, Set<String> allowedTypes, long maxBytes) {
        if (file == null || file.isEmpty())
            throw new InvalidRequestException("File cannot be empty");

        String type = file.getContentType();
        if (type == null || !allowedTypes.contains(type.toLowerCase()))
            throw new InvalidRequestException("Invalid file type: " + type +
                    ". Allowed: " + allowedTypes);

        if (file.getSize() > maxBytes)
            throw new InvalidRequestException(
                    "File size " + file.getSize() + " exceeds limit of " + maxBytes + " bytes");
    }

    /* =========================================================
       HELPERS
       ========================================================= */

    /**
     * Builds the public URL the browser will use to fetch the file.
     * Format: {baseUrl}/uploads/vaos/{vaoId}/{folder}/{filename}
     *
     * StaticResourceConfig must map /uploads/** → file:uploads/
     * so Spring Boot serves the file from disk.
     */
    private String buildPublicUrl(String vaoId, String folder, String filename) {
        // storageRoot is e.g. "uploads/vaos"
        // We need the URL path to match the resource handler mapping.
        // StaticResourceConfig maps:  /uploads/** → file:uploads/
        // So URL path is:  /uploads/vaos/{vaoId}/{folder}/{filename}
        return baseUrl + "/" + storageRoot + "/" + vaoId + "/" + folder + "/" + filename;
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf(".")).toLowerCase();
    }

    private String sanitizePath(String input) {
        return input.replaceAll("[^a-zA-Z0-9_\\-]", "_");
    }
}