package com.ruralops.platform.administration.vah.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request payload used by an MAO to provision a VAO for a village.
 *
 * The MAO provides basic personal details.
 * The system generates the VAO_ID internally.
 *
 * Resulting account:
 * - Created in PENDING_ACTIVATION status
 * - Activation handled separately
 */
public class VaoProvisionRequest {

    /**
     * Identifier of the village where the VAO will be assigned.
     */
    @NotBlank(message = "Village ID is required")
    private String villageId;

    /**
     * Full name of the VAO.
     */
    @NotBlank(message = "VAO name is required")
    private String name;

    /**
     * Official email address of the VAO.
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    /**
     * Registered mobile number of the VAO.
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
     * Default constructor required for JSON deserialization.
     */
    protected VaoProvisionRequest() {
        // For JSON deserialization
    }

    /**
     * Creates a new provisioning request.
     *
     * Input values are normalized before assignment.
     */
    public VaoProvisionRequest(
            String villageId,
            String name,
            String email,
            String phoneNumber
    ) {
        this.villageId = normalize(villageId);
        this.name = normalize(name);
        this.email = normalize(email).toLowerCase();
        this.phoneNumber = normalize(phoneNumber);
    }

    /* =======================
       Getters
       ======================= */

    public String getVillageId() {
        return villageId;
    }

    public String getName() {
        return name;
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

    /**
     * Trims leading and trailing whitespace.
     */
    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}
