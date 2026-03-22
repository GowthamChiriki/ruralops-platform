package com.ruralops.platform.bootstrap;

import com.ruralops.platform.administration.mah.domain.MaoAccount;
import com.ruralops.platform.administration.mah.repository.MaoAccountRepository;
import com.ruralops.platform.common.exception.ResourceNotFoundException;
import com.ruralops.platform.governance.domain.Mandal;
import com.ruralops.platform.governance.repository.MandalRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
public class DataInitializer {

    private final MandalRepository mandalRepository;
    private final MaoAccountRepository maoAccountRepository;

    public DataInitializer(
            MandalRepository mandalRepository,
            MaoAccountRepository maoAccountRepository
    ) {
        this.mandalRepository = mandalRepository;
        this.maoAccountRepository = maoAccountRepository;
    }

    @PostConstruct
    public void init() {
        seedMaoAccounts();
    }

    /**
     * Seeds MAO accounts (government appointments).
     * - One MAO per Mandal
     * - Idempotent (safe on restarts)
     * - Uses SAME MAO ID generation strategy as runtime provisioning
     */
    private void seedMaoAccounts() {

        Map<String, MaoSeed> maoAssignments = Map.ofEntries(

                // ---- REAL MAOs
                Map.entry("MDG-3128",
                        new MaoSeed("Podendla Akshay", "6303697942", "akshaypodendla.ruralops@gmail.com")),
                Map.entry("DVP-1335",
                        new MaoSeed("Chiriki Gowtham Sai", "8919071287", "gowthamsai.ruralops@gmail.com")),
                Map.entry("CDV-7100",
                        new MaoSeed("Shiva Shankar Nandaram", "8688614056", "shivashankar.ruralops@gmail.com")),
                Map.entry("NSP-2028",
                        new MaoSeed("Nakkala Yogananda Reddy", "9398260318", "yoganandareddy.ruralops@gmail.com")),

                // ---- REALISTIC MAOs (.org only)
                Map.entry("CDK-4251",
                        new MaoSeed("Srinivas Rao", "9876543201", "srinivas.cdk@ruralops.org")),
                Map.entry("KKP-2752",
                        new MaoSeed("Ravi Teja", "9876543202", "raviteja.kkp@ruralops.org")),
                Map.entry("RVK-4548",
                        new MaoSeed("Venkata Ramana", "9876543203", "ramana.rvk@ruralops.org")),
                Map.entry("BTP-2688",
                        new MaoSeed("Satyanarayana", "9876543204", "satya.btp@ruralops.org")),
                Map.entry("GLG-8650",
                        new MaoSeed("Prasad Naidu", "9876543205", "prasad.glg@ruralops.org")),
                Map.entry("RLG-9017",
                        new MaoSeed("Mohan Reddy", "9876543206", "mohan.rlg@ruralops.org")),
                Map.entry("NTV-8495",
                        new MaoSeed("Kamesh Babu", "9876543207", "kamesh.ntv@ruralops.org")),
                Map.entry("NKP-2134",
                        new MaoSeed("Anil Kumar", "9876543208", "anil.nkp@ruralops.org")),
                Map.entry("KTR-5970",
                        new MaoSeed("Rajesh Chowdary", "9876543209", "rajesh.ktr@ruralops.org")),
                Map.entry("MKV-4303",
                        new MaoSeed("Subrahmanyam", "9876543211", "subbu.mkv@ruralops.org")),
                Map.entry("SRV-3903",
                        new MaoSeed("Suresh Varma", "9876543212", "suresh.srv@ruralops.org"))
        );

        for (Map.Entry<String, MaoSeed> entry : maoAssignments.entrySet()) {

            String mandalId = entry.getKey();
            MaoSeed seed = entry.getValue();

            Mandal mandal = mandalRepository.findById(mandalId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Bootstrap error: Mandal not found: " + mandalId
                            )
                    );

            // ---- Governance rule: one MAO per Mandal (idempotent)
            if (maoAccountRepository.existsByMandal(mandal)) {
                continue;
            }

            String maoId = generateMaoId(mandal.getId());

            MaoAccount maoAccount = new MaoAccount(
                    maoId,
                    mandal,
                    normalizeEmail(seed.email()),
                    seed.phone()
            );

            maoAccountRepository.save(maoAccount);
        }
    }

    /**
     * MAO ID generator (SAME as runtime provisioning).
     * Format: RLOM-<MANDAL_ID>-<RANDOM_4>
     * Example: RLOM-MDG-3128-A7F3
     */
    private String generateMaoId(String mandalId) {
        String random = UUID.randomUUID()
                .toString()
                .substring(0, 4)
                .toUpperCase();

        return "RLOM-" + mandalId + "-" + random;
    }

    /**
     * Ensures no restricted .gov domains are used.
     */
    private String normalizeEmail(String email) {
        return email
                .toLowerCase()
                .replace(".gov", ".org");
    }

    private record MaoSeed(
            String name,
            String phone,
            String email
    ) {}
}
