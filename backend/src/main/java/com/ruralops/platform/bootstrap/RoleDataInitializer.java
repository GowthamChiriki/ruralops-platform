package com.ruralops.platform.bootstrap;

import com.ruralops.platform.auth.entity.User;
import com.ruralops.platform.auth.entity.UserRole;
import com.ruralops.platform.auth.repository.UserRepository;
import com.ruralops.platform.auth.repository.UserRoleRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(3)
public class RoleDataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    public RoleDataInitializer(UserRepository userRepository,
                               UserRoleRepository userRoleRepository) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
    }

    /* =====================================================
       RUN AFTER USER INITIALIZER
       ===================================================== */

    @Override
    public void run(ApplicationArguments args) {
        assignRoles();
    }

    /* =====================================================
       ROLE ASSIGNMENT
       ===================================================== */

    private void assignRoles() {

        //  SUPER ADMIN
        assignRole("9999999999", "SUPER_ADMIN", null);

        //  MAO (global / mandal-level)
        assignRole("8888888888", "MAO", null);

        //  VAO (village scoped)
        assignRole("7777777777", "VAO", "PNP-2254");

    }

    /* =====================================================
       SAFE ROLE ASSIGNMENT (IDEMPOTENT)
       ===================================================== */

    private void assignRole(String phone, String role, String villageId) {

        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found: " + phone));

        boolean exists = userRoleRepository
                .existsByUserIdAndRoleAndVillageId(
                        user.getId(),
                        role,
                        villageId
                );

        if (exists) return;

        UserRole userRole = new UserRole(
                user.getId(),
                role,
                villageId
        );

        userRoleRepository.save(userRole);
    }
}