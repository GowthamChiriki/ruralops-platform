package com.ruralops.platform.administration.vah.domain;

import com.ruralops.platform.auth.entity.User;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.governance.domain.Village;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(
        name = "vao_accounts",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "vao_id"),
                @UniqueConstraint(columnNames = "email"),
                @UniqueConstraint(columnNames = "phone_number"),
                @UniqueConstraint(columnNames = "village_id"),
                @UniqueConstraint(columnNames = "user_id")
        }
)
public class VaoAccount {

    /* ======================================================
       Internal Identifier
       ====================================================== */

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    /**
     * Public governance identifier.
     * Example: RLOV-VLG-9021-A3F9
     */
    @Column(name = "vao_id", nullable = false, length = 30, updatable = false)
    private String vaoId;

    /**
     * Core authentication identity.
     *
     * JWT userId → users.id → vao_accounts.user_id
     */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /* ======================================================
       VAO Information
       ====================================================== */

    @Column(nullable = false, length = 150)
    private String name;

    /* ======================================================
       Governance Anchors
       ====================================================== */

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "village_id", nullable = false, updatable = false)
    private Village village;

    /* ======================================================
       Contact Information
       ====================================================== */

    @Column(nullable = false, length = 150)
    private String email;

    @Column(name = "phone_number", nullable = false, length = 15)
    private String phoneNumber;

    /* ======================================================
       Authentication
       ====================================================== */

    @Column(name = "password_hash")
    private String passwordHash;

    /* ======================================================
       Account Lifecycle
       ====================================================== */

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AccountStatus status;

    /* ======================================================
       Audit
       ====================================================== */

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected VaoAccount() {
        // JPA only
    }

    /**
     * Constructor used when MAO provisions a VAO.
     */
    public VaoAccount(
            User user,
            String vaoId,
            Village village,
            String name,
            String email,
            String phoneNumber
    ) {

        if (user == null) {
            throw new IllegalArgumentException("User identity required");
        }

        if (vaoId == null || vaoId.isBlank()) {
            throw new IllegalArgumentException("VAO ID required");
        }

        this.user = user;
        this.vaoId = vaoId;
        this.village = village;
        this.name = normalize(name);
        this.email = normalize(email).toLowerCase(Locale.ROOT);
        this.phoneNumber = normalize(phoneNumber);

        this.status = AccountStatus.PENDING_ACTIVATION;
        this.createdAt = Instant.now();
    }

    /* ======================================================
       Getters
       ====================================================== */

    public UUID getId() {
        return id;
    }

    public String getVaoId() {
        return vaoId;
    }

    public User getUser() {
        return user;
    }

    public String getName() {
        return name;
    }

    public Village getVillage() {
        return village;
    }

    public String getEmail() {
        return email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    /* ======================================================
       Domain behavior
       ====================================================== */

    /**
     * Activates VAO account.
     */
    public void activate(String passwordHash) {

        if (this.status != AccountStatus.PENDING_ACTIVATION) {
            throw new IllegalStateException(
                    "VAO account cannot be activated in state: " + status
            );
        }

        if (passwordHash == null || passwordHash.isBlank()) {
            throw new IllegalArgumentException("Password hash required");
        }

        this.passwordHash = passwordHash;
        this.status = AccountStatus.ACTIVE;
    }

    public boolean isActive() {
        return this.status == AccountStatus.ACTIVE;
    }

    /* ======================================================
       Helpers
       ====================================================== */

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}