package com.ruralops.platform.bootstrap;

import com.ruralops.platform.administration.mah.domain.MaoAccount;
import com.ruralops.platform.administration.mah.repository.MaoAccountRepository;
import com.ruralops.platform.administration.vah.domain.VaoAccount;
import com.ruralops.platform.administration.vah.repository.VaoAccountRepository;
import com.ruralops.platform.auth.entity.User;
import com.ruralops.platform.auth.repository.UserRepository;
import com.ruralops.platform.governance.domain.Mandal;
import com.ruralops.platform.governance.domain.Village;
import com.ruralops.platform.governance.repository.MandalRepository;
import com.ruralops.platform.governance.repository.VillageRepository;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(4) // AFTER users + roles + governance
public class MaoVaoDataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final MaoAccountRepository maoRepo;
    private final VaoAccountRepository vaoRepo;
    private final MandalRepository mandalRepo;
    private final VillageRepository villageRepo;

    public MaoVaoDataInitializer(
            UserRepository userRepository,
            MaoAccountRepository maoRepo,
            VaoAccountRepository vaoRepo,
            MandalRepository mandalRepo,
            VillageRepository villageRepo
    ) {
        this.userRepository = userRepository;
        this.maoRepo = maoRepo;
        this.vaoRepo = vaoRepo;
        this.mandalRepo = mandalRepo;
        this.villageRepo = villageRepo;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedMao();
        seedVao();
    }

    /* =====================================================
       MAO SEEDING
       ===================================================== */

    private void seedMao() {

        String phone = "8888888888";

        // idempotent check
        if (maoRepo.existsByPhoneNumber(phone)) return;

        // fetch mandal (ID-based)
        Mandal mandal = mandalRepo.findById("MDG-3128")
                .orElseThrow(() ->
                        new RuntimeException("Mandal not found: MDG-4832"));

        MaoAccount mao = new MaoAccount(
                "RLOM-MDG-0001-A1B2", // static seed ID
                mandal,
                "mao@gov.in",
                phone
        );

        maoRepo.save(mao);
    }

    /* =====================================================
       VAO SEEDING
       ===================================================== */

    private void seedVao() {

        String phone = "7777777777";

        // fetch linked user
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() ->
                        new RuntimeException("User not found: " + phone));

        // idempotent check (IMPORTANT: nested property)
        if (vaoRepo.existsByUser_Id(user.getId())) return;

        // fetch village (ID-based)
        Village village = villageRepo.findById("PNP-2254")
                .orElseThrow(() ->
                        new RuntimeException("Village not found: PNP-2254"));

        VaoAccount vao = new VaoAccount(
                user,
                "RLOV-PNP-0001-X9Y8", // static seed ID
                village,
                "Default VAO",
                "vao@gov.in",
                phone
        );

        vaoRepo.save(vao);
    }
}