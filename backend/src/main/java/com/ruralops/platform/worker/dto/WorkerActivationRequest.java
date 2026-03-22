package com.ruralops.platform.worker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class WorkerActivationRequest {

    @NotBlank(message = "Worker ID is required")
    private String workerId;

    @NotBlank(message = "Activation key is required")
    private String activationKey;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
    private String password;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;

    protected WorkerActivationRequest() {}

    public WorkerActivationRequest(
            String workerId,
            String activationKey,
            String password,
            String confirmPassword
    ) {
        this.workerId = normalize(workerId).toUpperCase();
        this.activationKey = normalize(activationKey).toUpperCase();
        this.password = password;
        this.confirmPassword = confirmPassword;
    }

    public String getWorkerId() {
        return workerId;
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

    public boolean passwordsMatch() {
        return password != null && password.equals(confirmPassword);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}