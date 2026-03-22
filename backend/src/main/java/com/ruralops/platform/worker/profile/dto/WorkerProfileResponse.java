package com.ruralops.platform.worker.profile.dto;

import java.time.LocalDate;

/**
 * Response DTO returned when retrieving
 * worker profile information.
 *
 * Combines data from:
 * - WorkerProfile
 * - WorkerAccount
 * - Village
 * - Area
 *
 * Used by worker dashboard APIs.
 */
public class WorkerProfileResponse {

    /* =========================
       Identity
       ========================= */

    private String workerId;

    /* =========================
       Personal Information
       ========================= */

    private String firstName;
    private String lastName;
    private String gender;
    private LocalDate dateOfBirth;
    private Integer age;

    /* =========================
       Family
       ========================= */

    private String fatherName;
    private String motherName;

    /* =========================
       Contact
       ========================= */

    private String phoneNumber;
    private String email;

    /* =========================
       Governance
       ========================= */

    private String villageName;
    private String areaName;

    /* =========================
       Government Identity
       ========================= */

    private String aadhaarNumber;

    /* =========================
       Address
       ========================= */

    private String houseNumber;
    private String street;
    private String pincode;

    /* =========================
       Professional Information
       ========================= */

    private String workerType;
    private String skillCategory;
    private String experience;

    /* =========================
       Media
       ========================= */

    private String profilePhotoUrl;

    /* =========================
       Status
       ========================= */

    private boolean profileCompleted;

    /* =========================
       Getters and Setters
       ========================= */

    public String getWorkerId() {
        return workerId;
    }

    public void setWorkerId(String workerId) {
        this.workerId = workerId;
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

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = normalize(phoneNumber);
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = normalize(email);
    }

    public String getVillageName() {
        return villageName;
    }

    public void setVillageName(String villageName) {
        this.villageName = normalize(villageName);
    }

    public String getAreaName() {
        return areaName;
    }

    public void setAreaName(String areaName) {
        this.areaName = normalize(areaName);
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

    /* =========================
       Utility
       ========================= */

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}