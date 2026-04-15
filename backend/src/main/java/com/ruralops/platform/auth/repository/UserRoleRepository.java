package com.ruralops.platform.auth.repository;

import com.ruralops.platform.auth.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {

    /* =====================================================
       FIND ALL ROLES OF A USER
       ===================================================== */

    List<UserRole> findByUserId(UUID userId);

    boolean existsByUserIdAndRole(UUID userId, String role);


    /* =====================================================
       FIND USERS BY ROLE (optional but useful later)
       ===================================================== */

    List<UserRole> findByRole(String role);
    boolean existsByUserIdAndRoleAndVillageId(UUID userId, String role, String villageId);
}