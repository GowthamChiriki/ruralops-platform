package com.ruralops.platform.bootstrap;

import com.ruralops.platform.governance.domain.*;
import com.ruralops.platform.governance.repository.*;
import jakarta.annotation.PostConstruct;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Map;

@Component
@Order(1)
public class GovernanceDataInitializer {

    private final StateRepository stateRepository;
    private final DistrictRepository districtRepository;
    private final ConstituencyRepository constituencyRepository;
    private final MandalRepository mandalRepository;
    private final VillageRepository villageRepository;

    public GovernanceDataInitializer(
            StateRepository stateRepository,
            DistrictRepository districtRepository,
            ConstituencyRepository constituencyRepository,
            MandalRepository mandalRepository,
            VillageRepository villageRepository
    ) {
        this.stateRepository = stateRepository;
        this.districtRepository = districtRepository;
        this.constituencyRepository = constituencyRepository;
        this.mandalRepository = mandalRepository;
        this.villageRepository = villageRepository;
    }

    @PostConstruct
    public void init() {
        seedStates();
        seedDistricts();
        seedConstituencies();
        seedMandals();
        seedVillages();
    }

    // ================= STATES =================
    private void seedStates() {

        Map<String, String> states = Map.ofEntries(
                Map.entry("IN-AP-9515", "Andhra Pradesh"),
                Map.entry("IN-AR-6460", "Arunachal Pradesh"),
                Map.entry("IN-AS-2461", "Assam"),
                Map.entry("IN-BR-5506", "Bihar"),
                Map.entry("IN-CG-5200", "Chhattisgarh"),
                Map.entry("IN-GA-9769", "Goa"),
                Map.entry("IN-GJ-7208", "Gujarat"),
                Map.entry("IN-HR-2228", "Haryana"),
                Map.entry("IN-HP-6870", "Himachal Pradesh"),
                Map.entry("IN-JH-4885", "Jharkhand"),
                Map.entry("IN-KA-5466", "Karnataka"),
                Map.entry("IN-KL-3514", "Kerala"),
                Map.entry("IN-MP-1163", "Madhya Pradesh"),
                Map.entry("IN-MH-5314", "Maharashtra"),
                Map.entry("IN-MN-9210", "Manipur"),
                Map.entry("IN-ML-4115", "Meghalaya"),
                Map.entry("IN-MZ-4707", "Mizoram"),
                Map.entry("IN-NL-6040", "Nagaland"),
                Map.entry("IN-OD-7376", "Odisha"),
                Map.entry("IN-PB-7278", "Punjab"),
                Map.entry("IN-RJ-9102", "Rajasthan"),
                Map.entry("IN-SK-8230", "Sikkim"),
                Map.entry("IN-TN-9711", "Tamil Nadu"),
                Map.entry("IN-TS-2939", "Telangana"),
                Map.entry("IN-TR-1455", "Tripura"),
                Map.entry("IN-UP-1787", "Uttar Pradesh"),
                Map.entry("IN-UK-4593", "Uttarakhand"),
                Map.entry("IN-WB-9776", "West Bengal"),
                Map.entry("IN-DL-9436", "Delhi")
        );

        states.forEach((id, name) -> {
            if (stateRepository.existsById(id)) return;

            State state = new State();
            state.setId(id);
            state.setName(name);
            state.setActive(true);
            state.setCreatedAt(Instant.now());

            stateRepository.save(state);
        });
    }

    // ================= DISTRICTS =================
    private void seedDistricts() {

        Map<String, DistrictSeed> districts = Map.ofEntries(

                // Andhra Pradesh
                Map.entry("VSKP-7038", new DistrictSeed("Visakhapatnam", "IN-AP-9515")),
                Map.entry("AKP-5274", new DistrictSeed("Anakapalli", "IN-AP-9515")),
                Map.entry("ATP-9710", new DistrictSeed("Anantapur", "IN-AP-9515")),
                Map.entry("CTR-2038", new DistrictSeed("Chittoor", "IN-AP-9515")),

                // Telangana
                Map.entry("HYD-1116", new DistrictSeed("Hyderabad", "IN-TS-2939")),
                Map.entry("WRG-9485", new DistrictSeed("Warangal", "IN-TS-2939")),
                Map.entry("KRM-7405", new DistrictSeed("Karimnagar", "IN-TS-2939"))
        );

        districts.forEach((id, seed) -> {
            if (districtRepository.existsById(id)) return;

            State state = stateRepository.findById(seed.stateId()).orElseThrow();

            District d = new District();
            d.setId(id);
            d.setName(seed.name());
            d.setState(state);
            d.setActive(true);
            d.setCreatedAt(Instant.now());

            districtRepository.save(d);
        });
    }

    // ================= CONSTITUENCIES =================
    private void seedConstituencies() {

        Map<String, ConstituencySeed> data = Map.ofEntries(

                Map.entry("PNDT-5435", new ConstituencySeed("Pendurthi", "VSKP-7038")),
                Map.entry("VZN-5743", new ConstituencySeed("Visakhapatnam North", "VSKP-7038")),
                Map.entry("GJW-7235", new ConstituencySeed("Gajuwaka", "VSKP-7038")),

                Map.entry("MDG-3128", new ConstituencySeed("Madugula", "AKP-5274")),
                Map.entry("CDV-7100", new ConstituencySeed("Chodavaram", "AKP-5274")),
                Map.entry("NPT-2028", new ConstituencySeed("Narsipatnam", "AKP-5274"))
        );

        data.forEach((id, seed) -> {
            if (constituencyRepository.existsById(id)) return;

            District d = districtRepository.findById(seed.districtId()).orElseThrow();

            Constituency c = new Constituency();
            c.setId(id);
            c.setName(seed.name());
            c.setDistrict(d);
            c.setActive(true);
            c.setCreatedAt(Instant.now());

            constituencyRepository.save(c);
        });
    }

    // ================= MANDALS =================
    private void seedMandals() {

        Map<String, MandalSeed> data = Map.ofEntries(

                Map.entry("DVP-1335", new MandalSeed("Devarapalle", "MDG-3128")),
                Map.entry("CDK-4251", new MandalSeed("Cheedikada", "MDG-3128")),
                Map.entry("BTP-2688", new MandalSeed("Butchayyapeta", "CDV-7100")),
                Map.entry("NKP-2134", new MandalSeed("Nakkapalli", "NPT-2028"))
        );

        data.forEach((id, seed) -> {
            if (mandalRepository.existsById(id)) return;

            Constituency c = constituencyRepository.findById(seed.constituencyId()).orElseThrow();

            Mandal m = new Mandal();
            m.setId(id);
            m.setName(seed.name());
            m.setConstituency(c);
            m.setActive(true);
            m.setCreatedAt(Instant.now());

            mandalRepository.save(m);
        });
    }

    // ================= VILLAGES =================
    private void seedVillages() {

        Map<String, VillageSeed> data = Map.ofEntries(

                Map.entry("PNP-2254", new VillageSeed("Pedanandipalle Agraharam", "DVP-1335")),
                Map.entry("ALM-5889", new VillageSeed("Alamanda", "DVP-1335")),
                Map.entry("BTP-4500", new VillageSeed("Bethapudi", "DVP-1335")),
                Map.entry("GRS-6975", new VillageSeed("Garisingi", "DVP-1335"))
        );

        data.forEach((id, seed) -> {
            if (villageRepository.existsById(id)) return;

            Mandal m = mandalRepository.findById(seed.mandalId()).orElseThrow();

            Village v = new Village();
            v.setId(id);
            v.setName(seed.name());
            v.setMandal(m);
            v.setActive(true);
            v.setCreatedAt(Instant.now());

            villageRepository.save(v);
        });
    }

    // ================= RECORDS =================
    private record DistrictSeed(String name, String stateId) {}
    private record ConstituencySeed(String name, String districtId) {}
    private record MandalSeed(String name, String constituencyId) {}
    private record VillageSeed(String name, String mandalId) {}
}