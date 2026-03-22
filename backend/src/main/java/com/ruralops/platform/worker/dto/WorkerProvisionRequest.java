package com.ruralops.platform.worker.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Locale;

/**
 * Request payload used by a VAO to provision a Worker
 * within their village jurisdiction.
 *
 * The system generates the WORKER_ID internally.
 *
 * Resulting account:
 * - Created in PENDING_ACTIVATION state
 * - Activation handled separately
 */
public class WorkerProvisionRequest {

    /**
     * Worker full name.
     */
    @NotBlank(message = "Worker name is required")
    @Size(max = 150, message = "Worker name cannot exceed 150 characters")
    private String name;

    /**
     * Official email address of the worker.
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String email;

    /**
     * Registered mobile number.
     *
     * Must be a valid 10-digit Indian mobile number.
     */
    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^[6-9]\\d{9}$",
            message = "Invalid Indian phone number"
    )
    private String phoneNumber;

    /**
     * Area identifier inside the village.
     *
     * Selected from the VAO's village areas dropdown.
     */
    @NotNull(message = "Area is required")
    private Long areaId;

    /**
     * Default constructor required for JSON deserialization.
     */
    public WorkerProvisionRequest() {
    }

    /* ======================================================
       Getters
       ====================================================== */

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public Long getAreaId() {
        return areaId;
    }

    /* ======================================================
       Setters (used by JSON binding)
       ====================================================== */

    public void setName(String name) {
        this.name = normalize(name);
    }

    public void setEmail(String email) {
        String normalized = normalize(email);
        this.email = normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = normalize(phoneNumber);
    }

    public void setAreaId(Long areaId) {
        this.areaId = areaId;
    }

    /* ======================================================
       Helpers
       ====================================================== */

    /**
     * Trims leading and trailing whitespace.
     */
    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}