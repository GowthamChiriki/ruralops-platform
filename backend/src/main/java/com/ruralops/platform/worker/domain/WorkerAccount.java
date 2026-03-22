package com.ruralops.platform.worker.domain;

import com.ruralops.platform.auth.entity.User;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.governance.domain.Area;
import com.ruralops.platform.governance.domain.Village;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

/**
 * Represents a field worker responsible for a specific village area.
 *
 * Routing rule:
 * Area → exactly ONE worker
 *
 * Authentication rule:
 * WorkerAccount belongs to exactly ONE User identity.
 */
@Entity
@Table(
        name = "worker_accounts",
        indexes = {
                @Index(name = "idx_worker_village", columnList = "village_id"),
                @Index(name = "idx_worker_area", columnList = "area_id")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_worker_worker_id", columnNames = "worker_id"),
                @UniqueConstraint(name = "uq_worker_email", columnNames = "email"),
                @UniqueConstraint(name = "uq_worker_phone", columnNames = "phone_number"),
                @UniqueConstraint(name = "uq_worker_area", columnNames = "area_id"),
                @UniqueConstraint(name = "uq_worker_user", columnNames = "user_id")
        }
)
public class WorkerAccount {

    /* ======================================================
       Internal Identifier
       ====================================================== */

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    /**
     * Public worker identifier.
     *
     * Example:
     * RLOW-VLG-9021-A3F9
     */
    @Column(name = "worker_id", nullable = false, length = 40, updatable = false)
    private String workerId;

    /**
     * Core authentication identity.
     *
     * JWT userId → users.id → worker_accounts.user_id
     */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /* ======================================================
       Worker Information
       ====================================================== */

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    /* ======================================================
       Governance Anchors
       ====================================================== */

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "village_id", nullable = false, updatable = false)
    private Village village;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "area_id", nullable = false)
    private Area area;

    /* ======================================================
       Contact Information
       ====================================================== */

    @Column(name = "email", nullable = false, length = 150)
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
    @Column(name = "status", nullable = false, length = 30)
    private AccountStatus status;

    /* ======================================================
       Audit Fields
       ====================================================== */

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected WorkerAccount() {
        // Required by JPA
    }

    /**
     * Constructor used when VAO provisions a worker.
     */
    public WorkerAccount(
            User user,
            String workerId,
            Village village,
            Area area,
            String name,
            String email,
            String phoneNumber
    ) {

        if (user == null) {
            throw new IllegalArgumentException("User identity required");
        }

        if (workerId == null || workerId.isBlank()) {
            throw new IllegalArgumentException("Worker ID required");
        }

        this.user = user;
        this.workerId = workerId;
        this.village = village;
        this.area = area;

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

    public String getWorkerId() {
        return workerId;
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

    public Area getArea() {
        return area;
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
       Domain Behavior
       ====================================================== */

    /**
     * Activates worker account.
     */
    public void activate(String passwordHash) {

        if (this.status != AccountStatus.PENDING_ACTIVATION) {
            throw new IllegalStateException(
                    "Worker account cannot be activated in state: " + status
            );
        }

        if (passwordHash == null || passwordHash.isBlank()) {
            throw new IllegalArgumentException("Password hash required");
        }

        this.passwordHash = passwordHash;
        this.status = AccountStatus.ACTIVE;
    }

    /**
     * Suspend worker account.
     */
    public void suspend() {

        if (this.status != AccountStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Only active workers can be suspended"
            );
        }

        this.status = AccountStatus.SUSPENDED;
    }

    /**
     * Returns whether worker account is active.
     */
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