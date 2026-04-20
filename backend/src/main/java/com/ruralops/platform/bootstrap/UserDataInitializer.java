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

    private static final String DEFAULT_PASSWORD = "Rural@123";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserDataInitializer(UserRepository userRepository,
                               PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedUsers();
    }

    private void seedUsers() {

        createUser("9999999999"); // VAO
        createUser("8888888888"); // CITIZEN
    }

    private void createUser(String phone) {

        String normalized = normalize(phone);

        if (userRepository.existsByPhone(normalized)) return;

        User user = new User(
                normalized,
                passwordEncoder.encode(DEFAULT_PASSWORD),
                AccountStatus.ACTIVE
        );

        userRepository.save(user);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}