package com.ruralops.platform.administration.vao.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * Request payload used by VAO to complete
 * their operational profile after activation.
 *
 * This DTO represents data submitted from
 * the frontend profile completion form.
 */
public class VaoProfileCompletionRequest {

    /* =========================
       Personal Details
       ========================= */

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotNull(message = "Date of birth is required")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Gender is required")
    private String gender;

    private String qualification;

    /* =========================
       Contact Details
       ========================= */

    private String alternatePhone;

    @NotBlank(message = "Office address is required")
    private String officeAddress;

    /* =========================
       Verification Artifacts
       ========================= */

    @NotBlank(message = "Profile photo is required")
    private String profilePhotoUrl;

    @NotBlank(message = "Signature photo is required")
    private String signaturePhotoUrl;

    private String idProofUrl;

    protected VaoProfileCompletionRequest() {
        // For JSON deserialization
    }

    public String getFullName() {
        return fullName;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public String getGender() {
        return gender;
    }

    public String getQualification() {
        return qualification;
    }

    public String getAlternatePhone() {
        return alternatePhone;
    }

    public String getOfficeAddress() {
        return officeAddress;
    }

    public String getProfilePhotoUrl() {
        return profilePhotoUrl;
    }

    public String getSignaturePhotoUrl() {
        return signaturePhotoUrl;
    }

    public String getIdProofUrl() {
        return idProofUrl;
    }
}