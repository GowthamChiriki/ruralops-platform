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

    private static final String VILLAGE_ID = "PNP-2254";

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    public RoleDataInitializer(UserRepository userRepository,
                               UserRoleRepository userRoleRepository) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        assignRoles();
    }

    private void assignRoles() {

        assignRole("9999999999", "VAO", VILLAGE_ID);
        assignRole("8888888888", "CITIZEN", VILLAGE_ID);
    }

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