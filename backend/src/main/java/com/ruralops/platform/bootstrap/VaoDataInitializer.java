package com.ruralops.platform.bootstrap;

import com.ruralops.platform.administration.vao.domain.VaoProfile;
import com.ruralops.platform.administration.vao.repository.VaoProfileRepository;
import com.ruralops.platform.administration.vah.domain.VaoAccount;
import com.ruralops.platform.administration.vah.repository.VaoAccountRepository;
import com.ruralops.platform.auth.entity.User;
import com.ruralops.platform.auth.repository.UserRepository;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.governance.domain.Village;
import com.ruralops.platform.governance.repository.VillageRepository;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@Order(4)
public class VaoDataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final VaoAccountRepository vaoRepository;
    private final VaoProfileRepository profileRepository;
    private final VillageRepository villageRepository;
    private final PasswordEncoder passwordEncoder;

    public VaoDataInitializer(
            UserRepository userRepository,
            VaoAccountRepository vaoRepository,
            VaoProfileRepository profileRepository,
            VillageRepository villageRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.vaoRepository = vaoRepository;
        this.profileRepository = profileRepository;
        this.villageRepository = villageRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedVao();
    }

    private void seedVao() {

        String phone = "9999999999";

        // Fetch user
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() ->
                        new RuntimeException("User not found: " + phone));

        // Idempotency
        if (vaoRepository.existsByUser_Id(user.getId())) return;

        // Fetch village
        Village village = villageRepository.findById("PNP-2254")
                .orElseThrow(() ->
                        new RuntimeException("Village not found"));

        // Create VAO account
        VaoAccount vao = new VaoAccount(
                user,
                "RLOV-PNP-0001-X9Y8",
                village,
                "Default VAO",
                "vao@gov.in",
                phone
        );

        // ✅ FIXED ACTIVATION FLOW
        String encodedPassword = passwordEncoder.encode("Rural@123");

        // set password in USER
        user.setPasswordHash(encodedPassword);
        user.setStatus(AccountStatus.ACTIVE);
        userRepository.save(user);

        // activate VAO account
        vao.activate();

        vaoRepository.save(vao);

        // Create profile
        VaoProfile profile = new VaoProfile(vao);

        profile.completeProfile(
                "Default VAO",
                LocalDate.of(1990, 1, 1),
                "Male",
                "Graduate",
                "9999999999",
                "VAO Office Address",
                "profile-url",
                "signature-url",
                "id-proof-url"
        );

        profileRepository.save(profile);
    }
}