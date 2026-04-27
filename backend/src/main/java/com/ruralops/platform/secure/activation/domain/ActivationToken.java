package com.ruralops.platform.secure.activation.domain;

import com.ruralops.platform.common.enums.ActivationTokenStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents an activation token issued for an account.
 *
 * Stores:
 * - hashed token (for validation)
 * - raw token (for controlled retrieval via API)
 *
 * Manages token lifecycle (ACTIVE, USED, EXPIRED).
 */
@Entity
@Table(
        name = "activation_tokens",
        indexes = {
                @Index(
                        name = "idx_activation_account",
                        columnList = "account_type, account_id"
                ),
                @Index(
                        name = "idx_activation_status",
                        columnList = "status"
                )
        }
)
public class ActivationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "account_type", nullable = false, length = 20)
    private String accountType;

    @Column(name = "account_id", nullable = false, length = 50)
    private String accountId;

    /**
     * Hashed activation key (used for validation)
     */
    @Column(name = "token_hash", nullable = false, length = 128)
    private String tokenHash;

    /**
     * NEW: Raw activation key (temporary storage)
     */
    @Column(name = "raw_token", length = 64)
    private String rawToken;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ActivationTokenStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ActivationToken() {
        // For JPA
    }

    /**
     * UPDATED CONSTRUCTOR
     */
    public ActivationToken(
            String accountType,
            String accountId,
            String tokenHash,
            String rawToken,
            Instant expiresAt
    ) {
        this.accountType = accountType;
        this.accountId = accountId;
        this.tokenHash = tokenHash;
        this.rawToken = rawToken;
        this.expiresAt = expiresAt;
        this.status = ActivationTokenStatus.ACTIVE;
        this.createdAt = Instant.now();
    }

    /* =======================
       Getters
       ======================= */

    public UUID getId() {
        return id;
    }

    public String getAccountType() {
        return accountType;
    }

    public String getAccountId() {
        return accountId;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    /**
     * NEW GETTER
     */
    public String getRawToken() {
        return rawToken;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public ActivationTokenStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    /* =======================
       Domain behavior
       ======================= */

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public boolean isActive() {
        return status == ActivationTokenStatus.ACTIVE && !isExpired();
    }

    public void markUsed() {
        if (status != ActivationTokenStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Activation token cannot be used in state: " + status
            );
        }
        this.status = ActivationTokenStatus.USED;

        // Optional: clear raw token after use
        this.rawToken = null;
    }

    public void markExpired() {
        if (status == ActivationTokenStatus.USED) {
            return;
        }
        this.status = ActivationTokenStatus.EXPIRED;

        // Optional: clear raw token after expiry
        this.rawToken = null;
    }

    public void expireIfNecessary() {
        if (status == ActivationTokenStatus.ACTIVE && isExpired()) {
            this.status = ActivationTokenStatus.EXPIRED;

            // Optional cleanup
            this.rawToken = null;
        }
    }
}