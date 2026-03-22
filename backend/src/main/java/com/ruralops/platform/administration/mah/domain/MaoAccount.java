package com.ruralops.platform.administration.mah.domain;

import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.governance.domain.Mandal;
import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(
        name = "mao_accounts",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "mao_id"),
                @UniqueConstraint(columnNames = "email"),
                @UniqueConstraint(columnNames = "phone_number")
        }
)
public class MaoAccount {

    /**
     * Internal database identifier (opaque, never exposed).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    /**
     * Deterministic public governance ID.
     * Example: RLOM-MDG-3128-A7F3
     */
    @Column(name = "mao_id", nullable = false, length = 25, updatable = false)
    private String maoId;

    /**
     * Mandal this MAO governs.
     * FK → mandals.id
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mandal_id", nullable = false)
    private Mandal mandal;

    /**
     * Identity & communication (globally unique).
     */
    @Column(nullable = false, length = 150)
    private String email;

    @Column(name = "phone_number", nullable = false, length = 15)
    private String phoneNumber;

    /**
     * Authentication data (exists ONLY after activation).
     */
    @Column(name = "password_hash")
    private String passwordHash;

    /**
     * Semantic account lifecycle state.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AccountStatus status;

    protected MaoAccount() {
        // JPA only
    }

    /**
     * Constructor used ONLY by system provisioning
     * (DataInitializer / higher authority).
     */
    public MaoAccount(
            String maoId,
            Mandal mandal,
            String email,
            String phoneNumber
    ) {
        this.maoId = maoId;
        this.mandal = mandal;
        this.email = email.toLowerCase();
        this.phoneNumber = phoneNumber;
        this.status = AccountStatus.PENDING_ACTIVATION;
        this.passwordHash = null;
    }

    /* =======================
       Getters
       ======================= */

    public UUID getId() {
        return id;
    }

    public String getMaoId() {
        return maoId;
    }

    public Mandal getMandal() {
        return mandal;
    }

    public String getEmail() {
        return email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    /**
     * Convenience helper (optional, safe).
     */
    public boolean isActive() {
        return this.status == AccountStatus.ACTIVE;
    }

    /* =======================
       Domain behavior
       ======================= */

    /**
     * Activates the MAO account after successful activation validation.
     * No flow change — just semantic state.
     */
    public void activate(String passwordHash) {
        if (this.status != AccountStatus.PENDING_ACTIVATION) {
            throw new InvalidRequestException(
                    "MAO account is not eligible for activation"
            );
        }
        this.passwordHash = passwordHash;
        this.status = AccountStatus.ACTIVE;
    }

}
