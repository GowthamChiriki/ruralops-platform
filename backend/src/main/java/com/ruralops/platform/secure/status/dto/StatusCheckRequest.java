package com.ruralops.platform.secure.status.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request payload used to check account status by phone number.
 *
 * This DTO is read-only and does not expose sensitive data.
 * Validation rules ensure basic input correctness.
 *
 * Applicable to all supported account types.
 */
public class StatusCheckRequest {

    /**
     * Registered phone number of the account.
     *
     * Must be a valid 10-digit Indian mobile number
     * starting with digits 6–9.
     */
    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^[6-9]\\d{9}$",
            message = "Invalid Indian phone number"
    )
    private String phoneNumber;

    /**
     * Default constructor required for JSON deserialization.
     */
    protected StatusCheckRequest() {
        // For JSON deserialization
    }

    /**
     * Creates a new status check request.
     *
     * The phone number is normalized during construction.
     */
    public StatusCheckRequest(String phoneNumber) {
        this.phoneNumber = normalize(phoneNumber);
    }

    /**
     * Returns the normalized phone number.
     *
     * Normalization is applied once during construction or binding.
     */
    public String getPhoneNumber() {
        return phoneNumber;
    }

    /* =======================
       Internal helpers
       ======================= */

    /**
     * Trims leading and trailing whitespace.
     */
    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}
