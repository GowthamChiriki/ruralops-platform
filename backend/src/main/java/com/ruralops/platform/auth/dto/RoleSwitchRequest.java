package com.ruralops.platform.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class RoleSwitchRequest {

    @NotBlank(message = "Role is required")
    private String role;

    protected RoleSwitchRequest() {
        // Required by Jackson for JSON deserialization
    }

    public RoleSwitchRequest(String role) {
        this.role = role;
    }

    public String getRole() {
        return role;
    }

    /* Optional: normalize role value */
    public String getNormalizedRole() {
        return role == null ? null : role.trim().toUpperCase();
    }
}