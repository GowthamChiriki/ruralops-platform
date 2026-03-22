package com.ruralops.platform.administration.vah.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload used when a VAO activates their account.
 *
 * Preconditions:
 * - The VAO account must already be provisioned.
 * - Activation key verification is handled by the central activation module.
 *
 * This DTO carries only activation data and password input.
 */
public class VaoActivationRequest {

    /**
     * Public VAO identifier.
     */
    @NotBlank(message = "VAO ID is required")
    private String vaoId;

    /**
     * Activation key issued by the system.
     */
    @NotBlank(message = "Activation key is required")
    private String activationKey;

    /**
     * New password chosen by the VAO.
     *
     * Minimum length is enforced here.
     * Additional strength rules are validated elsewhere.
     */
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;

    /**
     * Confirmation of the chosen password.
     */
    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;

    /**
     * Default constructor required for JSON deserialization.
     */
    protected VaoActivationRequest() {
        // For JSON deserialization
    }

    /**
     * Creates a new activation request.
     *
     * Identifiers and activation key are normalized before assignment.
     */
    public VaoActivationRequest(
            String vaoId,
            String activationKey,
            String password,
            String confirmPassword
    ) {
        this.vaoId = normalize(vaoId);
        this.activationKey = normalize(activationKey);
        this.password = password;
        this.confirmPassword = confirmPassword;
    }

    /* =======================
       Getters
       ======================= */

    public String getVaoId() {
        return vaoId;
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
       Validation helpers
       ======================= */

    /**
     * Checks whether password and confirmPassword match.
     *
     * Does not enforce password strength.
     */
    public boolean passwordsMatch() {
        return password != null && password.equals(confirmPassword);
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
