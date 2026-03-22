package com.ruralops.platform.citizen.profile.dto;

import com.ruralops.platform.citizen.profile.domain.CitizenProfile;
import com.ruralops.platform.citizen.account.domain.CitizenAccount;

import java.time.LocalDate;

public class CitizenProfileResponse {

    /* =========================
       Identity
       ========================= */

    private String citizenId;

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

    /* =========================
       Government Identity
       ========================= */

    private String aadhaarNumber;
    private String rationCardNumber;

    /* =========================
       Address
       ========================= */

    private String houseNumber;
    private String street;
    private String pincode;

    /* =========================
       Media
       ========================= */

    private String profilePhotoUrl;

    /* =========================
       Status
       ========================= */

    private boolean profileCompleted;

    /* =====================================================
       STATIC MAPPER (Fix for your error)
       ===================================================== */

    public static CitizenProfileResponse from(CitizenProfile profile) {

        CitizenProfileResponse response = new CitizenProfileResponse();

        CitizenAccount account = profile.getCitizenAccount();

        response.setCitizenId(account.getCitizenId());
        response.setPhoneNumber(account.getPhoneNumber());
        response.setEmail(account.getEmail());
        response.setVillageName(account.getVillage().getName());

        response.setFirstName(profile.getFirstName());
        response.setLastName(profile.getLastName());
        response.setGender(profile.getGender());
        response.setDateOfBirth(profile.getDateOfBirth());
        response.setAge(profile.getAge());

        response.setFatherName(profile.getFatherName());
        response.setMotherName(profile.getMotherName());

        response.setAadhaarNumber(account.getAadhaarNumber());
        response.setRationCardNumber(account.getRationCardNumber());

        response.setHouseNumber(profile.getHouseNumber());
        response.setStreet(profile.getStreet());
        response.setPincode(profile.getPincode());

        response.setProfilePhotoUrl(profile.getProfilePhotoUrl());

        response.setProfileCompleted(profile.isProfileCompleted());

        return response;
    }

    /* =========================
       Getters / Setters
       ========================= */

    public String getCitizenId() { return citizenId; }

    public void setCitizenId(String citizenId) { this.citizenId = citizenId; }

    public String getFirstName() { return firstName; }

    public void setFirstName(String firstName) { this.firstName = normalize(firstName); }

    public String getLastName() { return lastName; }

    public void setLastName(String lastName) { this.lastName = normalize(lastName); }

    public String getGender() { return gender; }

    public void setGender(String gender) { this.gender = normalize(gender); }

    public LocalDate getDateOfBirth() { return dateOfBirth; }

    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public Integer getAge() { return age; }

    public void setAge(Integer age) { this.age = age; }

    public String getFatherName() { return fatherName; }

    public void setFatherName(String fatherName) { this.fatherName = normalize(fatherName); }

    public String getMotherName() { return motherName; }

    public void setMotherName(String motherName) { this.motherName = normalize(motherName); }

    public String getPhoneNumber() { return phoneNumber; }

    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = normalize(phoneNumber); }

    public String getEmail() { return email; }

    public void setEmail(String email) { this.email = normalize(email); }

    public String getVillageName() { return villageName; }

    public void setVillageName(String villageName) { this.villageName = normalize(villageName); }

    public String getAadhaarNumber() { return aadhaarNumber; }

    public void setAadhaarNumber(String aadhaarNumber) { this.aadhaarNumber = normalize(aadhaarNumber); }

    public String getRationCardNumber() { return rationCardNumber; }

    public void setRationCardNumber(String rationCardNumber) { this.rationCardNumber = normalize(rationCardNumber); }

    public String getHouseNumber() { return houseNumber; }

    public void setHouseNumber(String houseNumber) { this.houseNumber = normalize(houseNumber); }

    public String getStreet() { return street; }

    public void setStreet(String street) { this.street = normalize(street); }

    public String getPincode() { return pincode; }

    public void setPincode(String pincode) { this.pincode = normalize(pincode); }

    public String getProfilePhotoUrl() { return profilePhotoUrl; }

    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }

    public boolean isProfileCompleted() { return profileCompleted; }

    public void setProfileCompleted(boolean profileCompleted) { this.profileCompleted = profileCompleted; }

    /* =========================
       Utility
       ========================= */

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}