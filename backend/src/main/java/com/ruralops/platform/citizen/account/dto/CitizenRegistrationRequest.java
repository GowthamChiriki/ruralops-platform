package com.ruralops.platform.citizen.account.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request payload used when a citizen registers for the first time.
 *
 * Flow:
 * Citizen → Registration → PENDING_APPROVAL (by VAO)
 *
 * Governance rules:
 * - No public IDs are generated here
 * - No password is accepted at this stage
 * - Citizen selects only the Village
 * - Mandal, District, and State are resolved server-side
 *
 * This DTO is write-only and used only during registration.
 */
public class CitizenRegistrationRequest {

    /* =======================
       Personal details
       ======================= */

    /**
     * Citizen's full legal name.
     */
    @NotBlank(message = "Full name is required")
    @Size(max = 150, message = "Full name is too long")
    private String fullName;

    /**
     * Father's name as declared during registration.
     */
    @NotBlank(message = "Father name is required")
    @Size(max = 150, message = "Father name is too long")
    private String fatherName;

    /* =======================
       Identity documents
       ======================= */

    /**
     * Aadhaar number.
     *
     * Used for uniqueness and verification.
     * Not used for authentication.
     */
    @NotBlank(message = "Aadhaar number is required")
    @Pattern(
            regexp = "^[0-9]{12}$",
            message = "Aadhaar number must be exactly 12 digits"
    )
    private String aadhaarNumber;

    /**
     * Ration card number.
     *
     * Family-level identifier.
     * Multiple citizens may share the same value.
     */
    @NotBlank(message = "Ration card number is required")
    @Size(max = 20, message = "Ration card number is too long")
    private String rationCardNumber;

    /* =======================
       Contact information
       ======================= */

    /**
     * Registered mobile number.
     */
    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^[6-9]\\d{9}$",
            message = "Invalid Indian phone number"
    )
    private String phoneNumber;

    /**
     * Registered email address.
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    /* =======================
       Governance selection
       ======================= */

    /**
     * Selected village identifier.
     *
     * All higher-level geography is derived internally.
     */
    @NotBlank(message = "Village ID is required")
    private String villageId;

    /**
     * Default constructor required for JSON deserialization.
     */
    protected CitizenRegistrationRequest() {
        // For JSON deserialization only
    }

    /**
     * Creates a new registration request.
     *
     * Input values are normalized before assignment.
     */
    public CitizenRegistrationRequest(
            String fullName,
            String fatherName,
            String aadhaarNumber,
            String rationCardNumber,
            String phoneNumber,
            String email,
            String villageId
    ) {
        this.fullName = normalize(fullName);
        this.fatherName = normalize(fatherName);
        this.aadhaarNumber = normalize(aadhaarNumber);
        this.rationCardNumber = normalize(rationCardNumber);
        this.phoneNumber = normalize(phoneNumber);
        this.email = normalize(email).toLowerCase();
        this.villageId = normalize(villageId);
    }

    /* =======================
       Getters
       ======================= */

    public String getFullName() {
        return fullName;
    }

    public String getFatherName() {
        return fatherName;
    }

    public String getAadhaarNumber() {
        return aadhaarNumber;
    }

    public String getRationCardNumber() {
        return rationCardNumber;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getEmail() {
        return email;
    }

    public String getVillageId() {
        return villageId;
    }

    /* =======================
       Internal helpers
       ======================= */

    /**
     * Trims leading and trailing whitespace.
     */
    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}
