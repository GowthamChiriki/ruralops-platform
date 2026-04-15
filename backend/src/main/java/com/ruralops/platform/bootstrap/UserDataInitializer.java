package com.ruralops.platform.bootstrap;

import com.ruralops.platform.auth.entity.User;
import com.ruralops.platform.auth.repository.UserRepository;
import com.ruralops.platform.common.enums.AccountStatus;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(2)
public class UserDataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserDataInitializer(UserRepository userRepository,
                               PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /* =====================================================
       RUN AFTER GOVERNANCE INITIALIZER
       ===================================================== */

    @Override
    public void run(ApplicationArguments args) {
        seedUsers();
    }

    /* =====================================================
       USER SEEDING
       ===================================================== */

    private void seedUsers() {

        createUser("9999999999"); // SUPER_ADMIN
        createUser("8888888888"); // MAO
        createUser("7777777777"); // VAO

    }

    /* =====================================================
       CREATE USER (IDEMPOTENT)
       ===================================================== */

    private void createUser(String phone) {

        // prevent duplicate insertion
        if (userRepository.existsByPhone(phone)) return;

        User user = new User(
                phone,
                passwordEncoder.encode("Rural@123"),
                AccountStatus.ACTIVE
        );

        userRepository.save(user);
    }
}