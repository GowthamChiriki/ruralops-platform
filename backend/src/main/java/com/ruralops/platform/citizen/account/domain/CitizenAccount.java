package com.ruralops.platform.citizen.account.domain;

import com.ruralops.platform.auth.entity.User;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.governance.domain.Village;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a citizen account within the system.
 *
 * Lifecycle:
 * PENDING_APPROVAL  → Awaiting VAO decision
 * PENDING_ACTIVATION → Approved, waiting for activation
 * ACTIVE → Fully activated
 * REJECTED → Approval denied
 *
 * Identity rule:
 * Each CitizenAccount belongs to exactly one User.
 */
@Entity
@Table(
        name = "citizen_accounts",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "citizen_id"),
                @UniqueConstraint(columnNames = "phone_number"),
                @UniqueConstraint(columnNames = "email"),
                @UniqueConstraint(columnNames = "aadhaar_number"),
                @UniqueConstraint(columnNames = "user_id")
        }
)
public class CitizenAccount {

    /* ======================================================
       Internal identity
       ====================================================== */

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    /**
     * Public citizen identifier.
     * Generated after VAO approval.
     */
    @Column(name = "citizen_id", length = 30, unique = true)
    private String citizenId;

    /**
     * Core authentication identity.
     *
     * JWT userId → users.id → citizen_accounts.user_id
     */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /* ======================================================
       Personal identity
       ====================================================== */

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "father_name", nullable = false, length = 150)
    private String fatherName;

    @Column(name = "aadhaar_number", nullable = false, length = 12)
    private String aadhaarNumber;

    @Column(name = "ration_card_number", nullable = false, length = 20)
    private String rationCardNumber;

    /* ======================================================
       Contact information
       ====================================================== */

    @Column(name = "phone_number", nullable = false, length = 15)
    private String phoneNumber;


    @Column(name = "email", nullable = false, length = 150)
    private String email;

    /* ======================================================
       Governance linkage
       ====================================================== */

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "village_id", nullable = false, updatable = false)
    private Village village;

    @Column(name = "approved_by_vao_id", length = 30)
    private String approvedByVaoId;

    /* ======================================================
       Authentication
       ====================================================== */

    @Column(name = "password_hash")
    private String passwordHash;

    /* ======================================================
       Lifecycle & audit
       ====================================================== */

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private AccountStatus status;

    @Column(name = "registered_at", nullable = false, updatable = false)
    private Instant registeredAt;

    @Column(name = "approved_at")
    private Instant approvedAt;

    protected CitizenAccount() {
        // JPA only
    }

    /**
     * Constructor used during citizen registration.
     */
    public CitizenAccount(
            User user,
            String fullName,
            String fatherName,
            String aadhaarNumber,
            String rationCardNumber,
            String phoneNumber,
            String email,
            Village village
    ) {

        if (user == null) {
            throw new IllegalArgumentException("User identity required");
        }

        this.user = user;
        this.fullName = normalize(fullName);
        this.fatherName = normalize(fatherName);
        this.aadhaarNumber = normalize(aadhaarNumber);
        this.rationCardNumber = normalize(rationCardNumber);
        this.phoneNumber = normalize(phoneNumber);
        this.email = normalize(email).toLowerCase();
        this.village = village;

        this.status = AccountStatus.PENDING_APPROVAL;
        this.registeredAt = Instant.now();
    }

    /* ======================================================
       Domain transitions
       ====================================================== */

    public void approve(String citizenId, String vaoId) {

        if (status != AccountStatus.PENDING_APPROVAL) {
            throw new IllegalStateException(
                    "Citizen cannot be approved in status: " + status
            );
        }

        if (citizenId == null || citizenId.isBlank()) {
            throw new IllegalStateException(
                    "Citizen ID must be generated before approval"
            );
        }

        this.citizenId = citizenId;
        this.approvedByVaoId = vaoId;
        this.approvedAt = Instant.now();
        this.status = AccountStatus.PENDING_ACTIVATION;
    }

    public void reject() {

        if (status != AccountStatus.PENDING_APPROVAL) {
            throw new IllegalStateException(
                    "Citizen cannot be rejected in status: " + status
            );
        }

        this.status = AccountStatus.REJECTED;
    }

    public void activate(String passwordHash) {

        if (status != AccountStatus.PENDING_ACTIVATION) {
            throw new IllegalStateException(
                    "Citizen cannot be activated in status: " + status
            );
        }

        this.passwordHash = passwordHash;
        this.status = AccountStatus.ACTIVE;
    }

    /* ======================================================
       Lifecycle validation
       ====================================================== */

    @PreUpdate
    private void validateLifecycle() {

        if (status == AccountStatus.PENDING_ACTIVATION && citizenId == null) {
            throw new IllegalStateException(
                    "Citizen in PENDING_ACTIVATION without citizenId. Internal ID: " + id
            );
        }

        if (status == AccountStatus.ACTIVE && citizenId == null) {
            throw new IllegalStateException(
                    "Active citizen without citizenId. Internal ID: " + id
            );
        }
    }

    /* ======================================================
       Getters
       ====================================================== */

    public UUID getId() { return id; }
    public String getCitizenId() { return citizenId; }
    public User getUser() { return user; }
    public String getFullName() { return fullName; }
    public String getFatherName() { return fatherName; }
    public String getAadhaarNumber() { return aadhaarNumber; }
    public String getRationCardNumber() { return rationCardNumber; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getEmail() { return email; }
    public Village getVillage() { return village; }
    public String getApprovedByVaoId() { return approvedByVaoId; }
    public AccountStatus getStatus() { return status; }
    public Instant getRegisteredAt() { return registeredAt; }
    public Instant getApprovedAt() { return approvedAt; }
    public String getPasswordHash() { return passwordHash; }

    /* ======================================================
       Helpers
       ====================================================== */

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}