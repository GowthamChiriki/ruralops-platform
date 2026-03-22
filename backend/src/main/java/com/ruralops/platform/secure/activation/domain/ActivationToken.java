package com.ruralops.platform.secure.activation.domain;

import com.ruralops.platform.common.enums.ActivationTokenStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents an activation token issued for an account.
 *
 * Stores only the hashed token value.
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

    /**
     * Internal database identifier.
     *
     * Generated automatically.
     * Never exposed outside the system.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Account category (MAO, VAO, CITIZEN, WORKER, DAO, etc.).
     */
    @Column(name = "account_type", nullable = false, length = 20)
    private String accountType;

    /**
     * Public account identifier.
     *
     * Example: RLOM-MDG-3128-A7F3
     */
    @Column(name = "account_id", nullable = false, length = 50)
    private String accountId;

    /**
     * Hashed activation key.
     *
     * The raw token value is never stored.
     */
    @Column(name = "token_hash", nullable = false, length = 128)
    private String tokenHash;

    /**
     * Time when the token becomes invalid.
     */
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    /**
     * Current lifecycle state of the token.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ActivationTokenStatus status;

    /**
     * Timestamp when the token was created.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Default constructor required by JPA.
     */
    protected ActivationToken() {
        // For JPA
    }

    /**
     * Creates a new activation token.
     *
     * Intended to be used only by the service layer.
     * New tokens start in ACTIVE state.
     */
    public ActivationToken(
            String accountType,
            String accountId,
            String tokenHash,
            Instant expiresAt
    ) {
        this.accountType = accountType;
        this.accountId = accountId;
        this.tokenHash = tokenHash;
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

    /**
     * Checks whether the token has passed its expiration time.
     */
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    /**
     * Returns true if the token is valid for activation.
     *
     * A token is usable only when:
     * - Status is ACTIVE
     * - It has not expired
     */
    public boolean isActive() {
        return status == ActivationTokenStatus.ACTIVE && !isExpired();
    }

    /**
     * Marks the token as USED.
     *
     * Allowed only when the current state is ACTIVE.
     */
    public void markUsed() {
        if (status != ActivationTokenStatus.ACTIVE) {
            throw new IllegalStateException(
                    "Activation token cannot be used in state: " + status
            );
        }
        this.status = ActivationTokenStatus.USED;
    }

    /**
     * Marks the token as EXPIRED.
     *
     * Safe to call multiple times.
     * Tokens already marked as USED remain unchanged.
     */
    public void markExpired() {
        if (status == ActivationTokenStatus.USED) {
            return;
        }
        this.status = ActivationTokenStatus.EXPIRED;
    }

    /**
     * Updates the state if the token has expired by time.
     *
     * Should be called before performing validation checks.
     */
    public void expireIfNecessary() {
        if (status == ActivationTokenStatus.ACTIVE && isExpired()) {
            this.status = ActivationTokenStatus.EXPIRED;
        }
    }
}
