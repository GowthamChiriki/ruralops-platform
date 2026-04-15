package com.ruralops.platform.auth.config;

import com.ruralops.platform.auth.entity.User;
import com.ruralops.platform.auth.entity.UserRole;
import com.ruralops.platform.auth.repository.UserRepository;
import com.ruralops.platform.auth.repository.UserRoleRepository;
import com.ruralops.platform.common.enums.AccountStatus;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SuperAdminSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SuperAdminSeeder.class);

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${superadmin.phone}")
    private String superAdminPhone;

    @Value("${superadmin.password}")
    private String superAdminPassword;

    public SuperAdminSeeder(
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /* =====================================================
       RUN ON STARTUP
       ===================================================== */

    @Override
    @Transactional
    public void run(ApplicationArguments args) {

        if (userRepository.findByPhone(superAdminPhone).isPresent()) {
            log.info("Super admin already exists — skipping seed.");
            return;
        }

        /* =========================
           CREATE USER
           ========================= */

        User admin = new User(
                superAdminPhone,
                passwordEncoder.encode(superAdminPassword),
                AccountStatus.ACTIVE
        );

        User saved = userRepository.save(admin);

        /* =========================
           ASSIGN SUPER_ADMIN ROLE
           ========================= */

        UserRole role = new UserRole(saved.getId(), "SUPER_ADMIN", null);
        userRoleRepository.save(role);

        log.info("Super admin seeded successfully with phone: {}", superAdminPhone);
    }
}