package com.ruralops.platform.auth.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(
        name = "user_roles",
        indexes = {
                @Index(name = "idx_user_roles_user", columnList = "user_id"),
                @Index(name = "idx_user_roles_role", columnList = "role")
        },
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_user_role_scope",
                        columnNames = {"user_id", "role", "village_id"}
                )
        }
)
public class UserRole {

    /* =====================================================
       PRIMARY KEY
       ===================================================== */

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /* =====================================================
       USER REFERENCE
       ===================================================== */

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /* =====================================================
       ROLE NAME
       ===================================================== */

    @Column(nullable = false, length = 20)
    private String role;

    /* =====================================================
       OPTIONAL SCOPE
       ===================================================== */

    @Column(name = "village_id", length = 50)
    private String villageId;

    /* =====================================================
       JPA CONSTRUCTOR (required)
       ===================================================== */

    protected UserRole() {
        // Required by JPA
    }

    /* =====================================================
       DOMAIN CONSTRUCTOR
       ===================================================== */

    public UserRole(UUID userId, String role, String villageId) {

        if (userId == null) {
            throw new IllegalArgumentException("UserId cannot be null");
        }

        if (role == null || role.isBlank()) {
            throw new IllegalArgumentException("Role cannot be blank");
        }

        this.userId = userId;
        this.role = role.trim().toUpperCase();
        this.villageId = villageId;
    }

    /* =====================================================
       GETTERS
       ===================================================== */

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getRole() {
        return role;
    }

    public String getVillageId() {
        return villageId;
    }

    /* =====================================================
       DOMAIN HELPERS
       ===================================================== */

    public boolean isScopedToVillage() {
        return villageId != null;
    }
}