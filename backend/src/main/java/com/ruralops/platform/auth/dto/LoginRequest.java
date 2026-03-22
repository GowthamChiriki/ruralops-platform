package com.ruralops.platform.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class LoginRequest {

    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^[0-9]{10,15}$",
            message = "Phone number must contain 10–15 digits"
    )
    private String phoneNumber;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100)
    private String password;

    protected LoginRequest() {
        // Required for JSON deserialization
    }

    public LoginRequest(String phoneNumber, String password) {
        this.phoneNumber = phoneNumber;
        this.password = password;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getNormalizedPhoneNumber() {
        return phoneNumber == null ? null : phoneNumber.trim();
    }

    public String getPassword() {
        return password;
    }
}