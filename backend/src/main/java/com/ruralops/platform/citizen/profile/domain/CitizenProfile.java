package com.ruralops.platform.citizen.profile.domain;

import com.ruralops.platform.citizen.account.domain.CitizenAccount;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.util.UUID;

/**
 * CitizenProfile stores extended demographic and personal
 * information of a citizen after account activation.
 *
 * Identity data such as phone, email, and village are stored
 * in CitizenAccount.
 */

@Entity
@Table(name = "citizen_profiles")
public class CitizenProfile {

    /* =====================================================
       Primary Identifier
       ===================================================== */

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Each profile belongs to exactly one citizen account.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citizen_account_id", nullable = false, unique = true)
    private CitizenAccount citizenAccount;

    /* =====================================================
       Personal Information
       ===================================================== */

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "gender")
    private String gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    /* =====================================================
       Family Information
       ===================================================== */

    @Column(name = "father_name")
    private String fatherName;

    @Column(name = "mother_name")
    private String motherName;

    /* =====================================================
       Address Information
       ===================================================== */

    @Column(name = "house_number")
    private String houseNumber;

    @Column(name = "street")
    private String street;

    @Column(name = "pincode")
    private String pincode;

    /* =====================================================
       Profile Media
       ===================================================== */

    @Column(name = "profile_photo_url")
    private String profilePhotoUrl;

    /* =====================================================
       Profile Status
       ===================================================== */

    @Column(name = "profile_completed")
    private boolean profileCompleted = false;

    /* =====================================================
       Audit Metadata
       ===================================================== */

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /* =====================================================
       Constructors
       ===================================================== */

    protected CitizenProfile() {
        // JPA only
    }

    /**
     * Creates a new citizen profile for a citizen account.
     */
    public CitizenProfile(CitizenAccount citizenAccount) {

        if (citizenAccount == null) {
            throw new IllegalArgumentException("Citizen account is required");
        }

        this.citizenAccount = citizenAccount;
    }

    /* =====================================================
       JPA Lifecycle
       ===================================================== */

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    /* =====================================================
       Derived Fields
       ===================================================== */

    /**
     * Age is derived dynamically from date of birth.
     */
    public Integer getAge() {

        if (dateOfBirth == null) {
            return null;
        }

        return Period.between(dateOfBirth, LocalDate.now()).getYears();
    }

    /* =====================================================
       Getters
       ===================================================== */

    public UUID getId() {
        return id;
    }

    public CitizenAccount getCitizenAccount() {
        return citizenAccount;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getGender() {
        return gender;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public String getFatherName() {
        return fatherName;
    }

    public String getMotherName() {
        return motherName;
    }

    public String getHouseNumber() {
        return houseNumber;
    }

    public String getStreet() {
        return street;
    }

    public String getPincode() {
        return pincode;
    }

    public String getProfilePhotoUrl() {
        return profilePhotoUrl;
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

    /* =====================================================
       Setters
       ===================================================== */

    public void setFirstName(String firstName) {
        this.firstName = normalize(firstName);
    }

    public void setLastName(String lastName) {
        this.lastName = normalize(lastName);
    }

    public void setGender(String gender) {
        this.gender = normalize(gender);
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public void setFatherName(String fatherName) {
        this.fatherName = normalize(fatherName);
    }

    public void setMotherName(String motherName) {
        this.motherName = normalize(motherName);
    }

    public void setHouseNumber(String houseNumber) {
        this.houseNumber = normalize(houseNumber);
    }

    public void setStreet(String street) {
        this.street = normalize(street);
    }

    public void setPincode(String pincode) {
        this.pincode = normalize(pincode);
    }

    public void setProfilePhotoUrl(String profilePhotoUrl) {
        this.profilePhotoUrl = profilePhotoUrl;
    }

    public void setProfileCompleted(boolean profileCompleted) {
        this.profileCompleted = profileCompleted;
    }

    /* =====================================================
       Helpers
       ===================================================== */

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}