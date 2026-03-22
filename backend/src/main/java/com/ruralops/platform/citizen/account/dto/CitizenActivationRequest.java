package com.ruralops.platform.citizen.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload used when a Citizen activates their account.
 *
 * CONTRACT:
 * - Citizen account must be in PENDING_ACTIVATION state
 * - Citizen ID must already exist (generated at VAO approval time)
 * - Activation key validation is handled by the central activation module
 * - This DTO carries ONLY activation intent and password input
 *
 * SECURITY:
 * - No lifecycle checks here
 * - No activation logic here
 */
public class CitizenActivationRequest {

    @NotBlank(message = "Citizen ID is required")
    private String citizenId;

    @NotBlank(message = "Activation key is required")
    private String activationKey;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;

    protected CitizenActivationRequest() {
        // For JSON deserialization only
    }

    public CitizenActivationRequest(
            String citizenId,
            String activationKey,
            String password,
            String confirmPassword
    ) {
        this.citizenId = normalize(citizenId);
        this.activationKey = normalize(activationKey);
        this.password = password;
        this.confirmPassword = confirmPassword;
    }

    /* =======================
       Getters
       ======================= */

    public String getCitizenId() {
        return citizenId;
    }

    public String getActivationKey() {
        return activationKey;
    }

    public String getPassword() {
        return password;
    }

    public String getConfirmPassword() {
        return confirmPassword;
    }

    /* =======================
       Helper validation
       ======================= */

    /**
     * Confirms password and confirmPassword match.
     *
     * Note:
     * - Strength, history, and reuse rules are enforced elsewhere
     */
    public boolean passwordsMatch() {
        return password != null && password.equals(confirmPassword);
    }

    /* =======================
       Internal helpers
       ======================= */

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}
