package com.ruralops.platform.administration.vao.domain;

import com.ruralops.platform.administration.vah.domain.VaoAccount;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * VAO operational profile.
 *
 * Contains extended identity and operational
 * information used by the VAO dashboard.
 *
 * This entity is intentionally separated from
 * VaoAccount to keep authentication and profile
 * concerns independent.
 */
@Entity
@Table(name = "vao_profiles")
public class VaoProfile {

    /* ==============================
       Internal Database Identifier
       ============================== */

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    /* ==============================
       VAO Account Relation
       ============================== */

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "vao_account_id",
            nullable = false,
            unique = true
    )
    private VaoAccount vaoAccount;

    /* ==============================
       Personal Details
       ============================== */

    @Column(name = "full_name", length = 150)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 20)
    private String gender;

    @Column(length = 120)
    private String qualification;

    /* ==============================
       Contact
       ============================== */

    @Column(name = "alternate_phone", length = 15)
    private String alternatePhone;

    @Column(name = "office_address", length = 300)
    private String officeAddress;

    /* ==============================
       Identity Artifacts
       ============================== */

    @Column(name = "profile_photo_url", length = 500)
    private String profilePhotoUrl;

    @Column(name = "signature_photo_url", length = 500)
    private String signaturePhotoUrl;

    @Column(name = "id_proof_url", length = 500)
    private String idProofUrl;

    /* ==============================
       Profile State
       ============================== */

    @Column(name = "profile_completed", nullable = false)
    private boolean profileCompleted;

    /* ==============================
       Audit
       ============================== */

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    protected VaoProfile() {
        // JPA
    }

    /**
     * Constructor used when a VAO profile
     * is initialized after activation.
     */
    public VaoProfile(VaoAccount vaoAccount) {
        this.vaoAccount = vaoAccount;
        this.profileCompleted = false;
        this.createdAt = Instant.now();
    }

    /* ==============================
       Getters
       ============================== */

    public UUID getId() {
        return id;
    }

    public VaoAccount getVaoAccount() {
        return vaoAccount;
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

    public boolean isProfileCompleted() {
        return profileCompleted;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    /* ==============================
       Domain Behavior
       ============================== */

    public void completeProfile(
            String fullName,
            LocalDate dateOfBirth,
            String gender,
            String qualification,
            String alternatePhone,
            String officeAddress,
            String profilePhotoUrl,
            String signaturePhotoUrl,
            String idProofUrl
    ) {

        this.fullName = fullName;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.qualification = qualification;

        this.alternatePhone = alternatePhone;
        this.officeAddress = officeAddress;

        this.profilePhotoUrl = profilePhotoUrl;
        this.signaturePhotoUrl = signaturePhotoUrl;
        this.idProofUrl = idProofUrl;

        this.profileCompleted = true;
        this.updatedAt = Instant.now();
    }
}