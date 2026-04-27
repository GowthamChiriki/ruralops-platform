package com.ruralops.platform.bootstrap;

import com.ruralops.platform.auth.entity.User;
import com.ruralops.platform.auth.repository.UserRepository;
import com.ruralops.platform.citizen.account.domain.CitizenAccount;
import com.ruralops.platform.citizen.account.repository.CitizenAccountRepository;
import com.ruralops.platform.citizen.profile.domain.CitizenProfile;
import com.ruralops.platform.citizen.profile.repository.CitizenProfileRepository;
import com.ruralops.platform.governance.domain.Village;
import com.ruralops.platform.governance.repository.VillageRepository;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@Order(5)
public class CitizenDataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final CitizenAccountRepository citizenRepository;
    private final CitizenProfileRepository profileRepository;
    private final VillageRepository villageRepository;
    private final PasswordEncoder passwordEncoder;

    public CitizenDataInitializer(
            UserRepository userRepository,
            CitizenAccountRepository citizenRepository,
            CitizenProfileRepository profileRepository,
            VillageRepository villageRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.citizenRepository = citizenRepository;
        this.profileRepository = profileRepository;
        this.villageRepository = villageRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedCitizen();
    }

    private void seedCitizen() {

        String phone = "8888888888";

        // Step 1: Ensure user exists
        User user = userRepository.findByPhone(phone)
                .orElseGet(() ->
                        userRepository.save(
                                new User(
                                        phone,
                                        "TEMP",
                                        com.ruralops.platform.common.enums.AccountStatus.PENDING_ACTIVATION
                                )
                        )
                );

        // Idempotency
        if (citizenRepository.existsByUser_Id(user.getId())) return;

        // Fetch village
        Village village = villageRepository.findById("PNP-2254")
                .orElseThrow(() -> new RuntimeException("Village not found"));

        // --------------------------------
        // 1. CREATE (PENDING_APPROVAL)
        // --------------------------------
        CitizenAccount citizen = new CitizenAccount(
                user,
                "Ravi Kumar",
                "Suresh Kumar",
                "123456789012",
                "RC12345",
                phone,
                "ravi@gov.in",
                village
        );

        citizenRepository.save(citizen);

        // --------------------------------
        // 2. APPROVE (simulate VAO)
        // --------------------------------
        String citizenId = "RLOC-PNP-0001-Z1X2"; // static for seed
        String vaoId = "RLOV-PNP-0001-X9Y8";

        citizen.approve(citizenId, vaoId);

        // --------------------------------
        // 3. ACTIVATE
        // --------------------------------
        String passwordHash = passwordEncoder.encode("Rural@123");
        citizen.activate(passwordHash);

        citizenRepository.save(citizen);

        // --------------------------------
        // 4. PROFILE
        // --------------------------------
        CitizenProfile profile = new CitizenProfile(citizen);

        profile.setFirstName("Ravi");
        profile.setLastName("Kumar");
        profile.setGender("Male");
        profile.setDateOfBirth(LocalDate.of(1995, 5, 10));
        profile.setFatherName("Suresh Kumar");
        profile.setMotherName("Lakshmi");
        profile.setHouseNumber("12-34");
        profile.setStreet("Main Street");
        profile.setPincode("500001");
        profile.setProfilePhotoUrl("profile-url");
        profile.setProfileCompleted(true);

        profileRepository.save(profile);
    }
}