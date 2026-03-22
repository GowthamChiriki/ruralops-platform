package com.ruralops.platform.auth.entity;

import com.ruralops.platform.common.enums.AccountStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "users",
        indexes = {
                @Index(name = "idx_users_phone", columnList = "phone")
        }
)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /* =====================================================
       LOGIN IDENTIFIER
       ===================================================== */

    @Column(nullable = false, unique = true, length = 15)
    private String phone;

    /* =====================================================
       PASSWORD HASH
       ===================================================== */

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    /* =====================================================
       ACCOUNT STATUS
       ===================================================== */

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountStatus status;

    /* =====================================================
       CREATION TIMESTAMP
       ===================================================== */

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /* =====================================================
       JPA CONSTRUCTOR
       ===================================================== */

    protected User() {
        // JPA only
    }

    /* =====================================================
       DOMAIN CONSTRUCTOR
       ===================================================== */

    public User(String phone, String passwordHash, AccountStatus status) {
        this.phone = phone;
        this.passwordHash = passwordHash;
        this.status = status;
        this.createdAt = Instant.now();
    }

    /* =====================================================
       GETTERS
       ===================================================== */

    public UUID getId() {
        return id;
    }

    public String getPhone() {
        return phone;
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

    /* =====================================================
       DOMAIN BEHAVIOR
       ===================================================== */

    public void activate() {
        this.status = AccountStatus.ACTIVE;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void setPhone(String phone) {
        this.phone = this.phone;
    }

    public void setStatus(AccountStatus status) {
        this.status = status;
    }

    public void suspend() {
        this.status = AccountStatus.SUSPENDED;
    }

    public boolean isActive() {
        return this.status == AccountStatus.ACTIVE;
    }
}