package com.ruralops.platform.administration.mah.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request payload used by higher authority / system
 * to provision a MAO for a Mandal.
 *
 * CONTRACT:
 * - Provisions a MAO account in PENDING_ACTIVATION state
 * - Does NOT activate the account
 * - Does NOT assign credentials
 * - Activation is handled by the central activation system
 */
public class MaoProvisionRequest {

    @NotBlank(message = "Mandal ID is required")
    private String mandalId;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^[6-9]\\d{9}$",
            message = "Invalid Indian phone number"
    )
    private String phoneNumber;

    protected MaoProvisionRequest() {
        // For JSON deserialization
    }

    public MaoProvisionRequest(
            String mandalId,
            String email,
            String phoneNumber
    ) {
        this.mandalId = normalize(mandalId);
        this.email = normalize(email).toLowerCase();
        this.phoneNumber = normalize(phoneNumber);
    }

    /* =======================
       Getters
       ======================= */

    public String getMandalId() {
        return mandalId;
    }

    public String getEmail() {
        return email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    /* =======================
       Internal helpers
       ======================= */

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}
