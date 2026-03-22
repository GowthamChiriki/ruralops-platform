package com.ruralops.platform.auth.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "refresh_tokens",
        indexes = {
                @Index(name = "idx_refresh_token_token", columnList = "token"),
                @Index(name = "idx_refresh_token_user", columnList = "user_id"),
                @Index(name = "idx_refresh_token_expiry", columnList = "expiry_date")
        }
)
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /* =========================
       Owner of this token
       ========================= */

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /* =========================
       Token value
       ========================= */

    @Column(nullable = false, unique = true, length = 512, updatable = false)
    private String token;

    /* =========================
       Expiry timestamp
       ========================= */

    @Column(name = "expiry_date", nullable = false)
    private Instant expiryDate;

    /* =========================
       Revocation flag
       ========================= */

    @Column(nullable = false)
    private boolean revoked;

    /* =========================
       Creation timestamp
       ========================= */

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RefreshToken() {
        // JPA only
    }

    public RefreshToken(UUID userId, String token, Instant expiryDate) {
        this.userId = userId;
        this.token = token;
        this.expiryDate = expiryDate;
        this.revoked = false;
        this.createdAt = Instant.now();
    }

    /* =========================
       Getters
       ========================= */

    public Long getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getToken() {
        return token;
    }

    public Instant getExpiryDate() {
        return expiryDate;
    }

    public boolean isRevoked() {
        return revoked;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    /* =========================
       Domain Behavior
       ========================= */

    public void revoke() {
        this.revoked = true;
    }

    public boolean isExpired() {
        return expiryDate.isBefore(Instant.now());
    }

    public boolean isActive() {
        return !revoked && !isExpired();
    }
}