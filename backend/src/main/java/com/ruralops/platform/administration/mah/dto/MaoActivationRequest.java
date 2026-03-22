package com.ruralops.platform.administration.mah.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload used when a MAO activates their account.
 *
 * CONTRACT:
 * - MAO account must already be provisioned
 * - Activation key validation is handled by the central activation module
 * - This DTO ONLY carries activation intent + password
 */
public class MaoActivationRequest {

    @NotBlank(message = "MAO ID is required")
    private String maoId;

    @NotBlank(message = "Activation key is required")
    private String activationKey;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;

    protected MaoActivationRequest() {
        // For JSON deserialization
    }

    public MaoActivationRequest(
            String maoId,
            String activationKey,
            String password,
            String confirmPassword
    ) {
        this.maoId = normalize(maoId);
        this.activationKey = normalize(activationKey);
        this.password = password;
        this.confirmPassword = confirmPassword;
    }

    public String getMaoId() {
        return maoId;
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

    // Validation helpers


    /**
     * Simple password match check.
     * Strength and policy rules are enforced elsewhere.
     */
    public boolean passwordsMatch() {
        return password != null && password.equals(confirmPassword);
    }

    // Internal helpers

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}
