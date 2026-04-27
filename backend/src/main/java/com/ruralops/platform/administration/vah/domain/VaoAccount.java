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

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "vao_id", nullable = false, length = 30, updatable = false)
    private String vaoId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 150)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "village_id", nullable = false, updatable = false)
    private Village village;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(name = "phone_number", nullable = false, length = 15)
    private String phoneNumber;

    /* ❌ PASSWORD REMOVED */

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AccountStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected VaoAccount() {}

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

    public UUID getId() { return id; }
    public String getVaoId() { return vaoId; }
    public User getUser() { return user; }
    public String getName() { return name; }
    public Village getVillage() { return village; }
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public AccountStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }

    public void activate() {

        if (this.status != AccountStatus.PENDING_ACTIVATION) {
            throw new IllegalStateException(
                    "VAO account cannot be activated in state: " + status
            );
        }

        this.status = AccountStatus.ACTIVE;
    }

    public boolean isActive() {
        return this.status == AccountStatus.ACTIVE;
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}