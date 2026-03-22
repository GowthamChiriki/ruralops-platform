package com.ruralops.platform.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class RefreshTokenRequest {

    @NotBlank(message = "Refresh token is required")
    private String refreshToken;

    protected RefreshTokenRequest() {
        // Required for JSON deserialization
    }

    public RefreshTokenRequest(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public String getNormalizedToken() {
        return refreshToken == null ? null : refreshToken.trim();
    }
}