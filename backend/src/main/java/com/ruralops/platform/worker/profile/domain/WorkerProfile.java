package com.ruralops.platform.worker.profile.domain;

import com.ruralops.platform.worker.domain.WorkerAccount;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * WorkerProfile stores extended personal and professional
 * information of a field worker after account activation.
 *
 * Core identity and governance data (village, area, email,
 * phone number) remain in WorkerAccount.
 */
@Entity
@Table(name = "worker_profiles")
public class WorkerProfile {

    /* ======================================================
       Primary Identifier
       ====================================================== */

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Each worker has exactly one profile.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_account_id", nullable = false, unique = true)
    private WorkerAccount workerAccount;

    /* ======================================================
       Personal Information
       ====================================================== */

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "gender")
    private String gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "age")
    private Integer age;

    /* ======================================================
       Family Details
       ====================================================== */

    @Column(name = "father_name")
    private String fatherName;

    @Column(name = "mother_name")
    private String motherName;

    /* ======================================================
       Government Identity
       ====================================================== */

    @Column(name = "aadhaar_number", unique = true)
    private String aadhaarNumber;

    /* ======================================================
       Address
       ====================================================== */

    @Column(name = "house_number")
    private String houseNumber;

    @Column(name = "street")
    private String street;

    @Column(name = "pincode")
    private String pincode;

    /* ======================================================
       Work Information
       ====================================================== */

    /**
     * Example:
     * Sanitation Worker
     * Maintenance Worker
     * Electrical Worker
     */
    @Column(name = "worker_type")
    private String workerType;

    /**
     * Category of skills.
     */
    @Column(name = "skill_category")
    private String skillCategory;

    /**
     * Example:
     * 2 years
     * 5 years
     */
    @Column(name = "experience")
    private String experience;

    /* ======================================================
       Profile Media
       ====================================================== */

    @Column(name = "profile_photo_url")
    private String profilePhotoUrl;

    /* ======================================================
       Profile Status
       ====================================================== */

    @Column(name = "profile_completed")
    private boolean profileCompleted = false;

    /* ======================================================
       System Metadata
       ====================================================== */

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public WorkerProfile() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    /* ======================================================
       Getters and Setters
       ====================================================== */

    public UUID getId() {
        return id;
    }

    public WorkerAccount getWorkerAccount() {
        return workerAccount;
    }

    public void setWorkerAccount(WorkerAccount workerAccount) {
        this.workerAccount = workerAccount;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = normalize(firstName);
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = normalize(lastName);
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = normalize(gender);
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getFatherName() {
        return fatherName;
    }

    public void setFatherName(String fatherName) {
        this.fatherName = normalize(fatherName);
    }

    public String getMotherName() {
        return motherName;
    }

    public void setMotherName(String motherName) {
        this.motherName = normalize(motherName);
    }

    public String getAadhaarNumber() {
        return aadhaarNumber;
    }

    public void setAadhaarNumber(String aadhaarNumber) {
        this.aadhaarNumber = normalize(aadhaarNumber);
    }

    public String getHouseNumber() {
        return houseNumber;
    }

    public void setHouseNumber(String houseNumber) {
        this.houseNumber = normalize(houseNumber);
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = normalize(street);
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = normalize(pincode);
    }

    public String getWorkerType() {
        return workerType;
    }

    public void setWorkerType(String workerType) {
        this.workerType = normalize(workerType);
    }

    public String getSkillCategory() {
        return skillCategory;
    }

    public void setSkillCategory(String skillCategory) {
        this.skillCategory = normalize(skillCategory);
    }

    public String getExperience() {
        return experience;
    }

    public void setExperience(String experience) {
        this.experience = normalize(experience);
    }

    public String getProfilePhotoUrl() {
        return profilePhotoUrl;
    }

    public void setProfilePhotoUrl(String profilePhotoUrl) {
        this.profilePhotoUrl = profilePhotoUrl;
    }

    public boolean isProfileCompleted() {
        return profileCompleted;
    }

    public void setProfileCompleted(boolean profileCompleted) {
        this.profileCompleted = profileCompleted;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    /* ======================================================
       Helper
       ====================================================== */

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}