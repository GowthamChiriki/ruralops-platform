package com.ruralops.platform.administration.vao.dto;

import java.time.LocalDate;

/**
 * Full profile details returned by GET /vao/{vaoId}/profile.
 *
 * This DTO contains all fields that the frontend profile form
 * needs to pre-fill for update mode.
 *
 * Field names MUST match the React form state keys exactly:
 *   fullName, dateOfBirth, gender, qualification,
 *   alternatePhone, officeAddress,
 *   profilePhotoUrl, signaturePhotoUrl, idProofUrl
 */
public class VaoProfileResponse {

    /* =======================
       Identity
       ======================= */

    private final String vaoId;

    /** Maps to form field: fullName */
    private final String fullName;

    /** Maps to form field: dateOfBirth */
    private final LocalDate dateOfBirth;

    /** Maps to form field: gender */
    private final String gender;

    /** Maps to form field: qualification (optional) */
    private final String qualification;

    /* =======================
       Contact
       ======================= */

    /** Maps to form field: alternatePhone */
    private final String alternatePhone;

    /** Maps to form field: officeAddress */
    private final String officeAddress;

    /* =======================
       Governance context
       ======================= */

    /** Needed by frontend for complaint filtering */
    private final String villageId;

    /** Human readable village name */
    private final String villageName;

    /* =======================
       Verification artifacts
       ======================= */

    /** Maps to form field: profilePhotoUrl */
    private final String profilePhotoUrl;

    /** Maps to form field: signaturePhotoUrl */
    private final String signaturePhotoUrl;

    /** Maps to form field: idProofUrl */
    private final String idProofUrl;

    /* =======================
       Profile state
       ======================= */

    private final boolean profileCompleted;

    /* =======================
       Constructor
       ======================= */

    public VaoProfileResponse(
            String vaoId,
            String fullName,
            LocalDate dateOfBirth,
            String gender,
            String qualification,
            String alternatePhone,
            String officeAddress,
            String villageId,
            String villageName,
            String profilePhotoUrl,
            String signaturePhotoUrl,
            String idProofUrl,
            boolean profileCompleted
    ) {
        this.vaoId = vaoId;
        this.fullName = fullName;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.qualification = qualification;
        this.alternatePhone = alternatePhone;
        this.officeAddress = officeAddress;
        this.villageId = villageId;
        this.villageName = villageName;
        this.profilePhotoUrl = profilePhotoUrl;
        this.signaturePhotoUrl = signaturePhotoUrl;
        this.idProofUrl = idProofUrl;
        this.profileCompleted = profileCompleted;
    }

    /* =======================
       Getters
       ======================= */

    public String getVaoId() {
        return vaoId;
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

    public String getVillageId() {
        return villageId;
    }

    public String getVillageName() {
        return villageName;
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

    public boolean isProfileCompleted() {
        return profileCompleted;
    }
}