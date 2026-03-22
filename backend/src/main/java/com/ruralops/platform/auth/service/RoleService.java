package com.ruralops.platform.auth.service;

import com.ruralops.platform.auth.entity.UserRole;
import com.ruralops.platform.auth.repository.UserRoleRepository;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class RoleService {

    private final UserRoleRepository userRoleRepository;

    public RoleService(UserRoleRepository userRoleRepository) {
        this.userRoleRepository = userRoleRepository;
    }

    /* =========================================
       ASSIGN ROLE TO USER
       ========================================= */

    @Transactional
    public void assignRole(UUID userId, String roleName, String villageId) {

        String normalizedRole = roleName.trim().toUpperCase();

        boolean exists = userRoleRepository
                .existsByUserIdAndRole(userId, normalizedRole);

        if (exists) {
            return;
        }

        UserRole role = new UserRole(userId, normalizedRole, villageId);

        userRoleRepository.save(role);
    }

    /* =========================================
       GET ALL ROLES FOR USER
       ========================================= */

    public List<UserRole> getRolesForUser(String userId) {

        UUID id = UUID.fromString(userId);

        List<UserRole> roles = userRoleRepository.findByUserId(id);

        if (roles.isEmpty()) {
            throw new IllegalStateException("User has no roles assigned");
        }

        return roles;
    }

    /* =========================================
       GET DEFAULT ROLE (highest priority)
       ========================================= */

    public UserRole getDefaultRole(String userId) {

        return getRolesForUser(userId)
                .stream()
                .max(Comparator.comparingInt(r -> rolePriority(r.getRole())))
                .orElseThrow(() ->
                        new IllegalStateException("No roles found for user"));
    }

    /* =========================================
       VALIDATE ROLE SWITCH
       ========================================= */

    public UserRole getRoleForUser(String userId, String role) {

        String normalizedRole = role.trim().toUpperCase();

        return getRolesForUser(userId)
                .stream()
                .filter(r -> r.getRole().equals(normalizedRole))
                .findFirst()
                .orElseThrow(() ->
                        new IllegalArgumentException("Role not assigned to user"));
    }

    /* =========================================
       ROLE PRIORITY
       ========================================= */

    private int rolePriority(String role) {

        return switch (role) {

            case "MAO" -> 4;
            case "VAO" -> 3;
            case "WORKER" -> 2;
            case "CITIZEN" -> 1;

            default -> 0;
        };
    }
}