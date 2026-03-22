package com.ruralops.platform.worker.profile.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

/**
 * Request DTO used when a worker updates
 * their profile after it has already been created.
 *
 * Unlike profile completion, most fields are optional
 * to support partial updates.
 */
public class WorkerProfileUpdateRequest {

    /* =========================
       Personal Information
       ========================= */

    @Size(max = 80)
    private String firstName;

    @Size(max = 80)
    private String lastName;

    private String gender;

    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @Min(18)
    @Max(120)
    private Integer age;

    /* =========================
       Family Information
       ========================= */

    @Size(max = 150)
    private String fatherName;

    @Size(max = 150)
    private String motherName;

    /* =========================
       Government Identity
       ========================= */

    @Pattern(regexp = "^[0-9]{12}$", message = "Aadhaar number must be 12 digits")
    private String aadhaarNumber;

    /* =========================
       Address Information
       ========================= */

    @Size(max = 50)
    private String houseNumber;

    @Size(max = 120)
    private String street;

    @Pattern(regexp = "^[0-9]{6}$", message = "Pincode must be 6 digits")
    private String pincode;

    /* =========================
       Worker Professional Info
       ========================= */

    private String workerType;

    private String skillCategory;

    @Size(max = 50)
    private String experience;

    /* =========================
       Media
       ========================= */

    private String profilePhotoUrl;

    /* =========================
       Getters and Setters
       ========================= */

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

    /* =========================
       Utility
       ========================= */

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}