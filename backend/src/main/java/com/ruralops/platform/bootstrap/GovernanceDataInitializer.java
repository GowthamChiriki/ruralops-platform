package com.ruralops.platform.bootstrap;

import com.ruralops.platform.governance.domain.*;
import com.ruralops.platform.governance.repository.*;

import jakarta.annotation.PostConstruct;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.Instant;
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

    /* =====================================================
       STATES
       ===================================================== */

    private void seedStates() {

        Map<String, String> states = Map.ofEntries(
                Map.entry("IN-AP-9515", "Andhra Pradesh"),
                Map.entry("IN-TS-2939", "Telangana"),
                Map.entry("IN-TN-9711", "Tamil Nadu")
        );

        states.forEach((id, name) -> {

            if (stateRepository.existsById(id)) return;

            State state = new State();

            state.setId(id);
            state.setName(name);
            state.setActive(true);
            state.setCreatedAt(Instant.now());

            // 🔥 CRITICAL FIX (this caused your crash)
            state.setType("STATE"); // or StateType.STATE if enum

            stateRepository.save(state);
        });
    }

    /* =====================================================
       DISTRICTS
       ===================================================== */

    private void seedDistricts() {

        Map<String, DistrictSeed> districts = Map.ofEntries(

                Map.entry("VSKP-7038", new DistrictSeed("Visakhapatnam", "IN-AP-9515")),
                Map.entry("AKP-5274", new DistrictSeed("Anakapalli", "IN-AP-9515")),
                Map.entry("HYD-1116", new DistrictSeed("Hyderabad", "IN-TS-2939"))
        );

        districts.forEach((id, seed) -> {

            if (districtRepository.existsById(id)) return;

            State state = stateRepository.findById(seed.stateId())
                    .orElseThrow(() -> new RuntimeException("State not found: " + seed.stateId()));

            District d = new District();

            d.setId(id);
            d.setName(seed.name());
            d.setState(state);
            d.setActive(true);
            d.setCreatedAt(Instant.now());

            districtRepository.save(d);
        });
    }

    /* =====================================================
       CONSTITUENCIES
       ===================================================== */

    private void seedConstituencies() {

        Map<String, ConstituencySeed> data = Map.ofEntries(

                Map.entry("MDG-3128", new ConstituencySeed("Madugula", "AKP-5274")),
                Map.entry("PNDT-5435", new ConstituencySeed("Pendurthi", "VSKP-7038"))
        );

        data.forEach((id, seed) -> {

            if (constituencyRepository.existsById(id)) return;

            District district = districtRepository.findById(seed.districtId())
                    .orElseThrow(() -> new RuntimeException("District not found: " + seed.districtId()));

            Constituency c = new Constituency();

            c.setId(id);
            c.setName(seed.name());
            c.setDistrict(district);
            c.setActive(true);
            c.setCreatedAt(Instant.now());

            constituencyRepository.save(c);
        });
    }

    /* =====================================================
       MANDALS
       ===================================================== */

    private void seedMandals() {

        Map<String, MandalSeed> data = Map.ofEntries(

                Map.entry("DVP-1335", new MandalSeed("Devarapalle", "MDG-3128"))
        );

        data.forEach((id, seed) -> {

            if (mandalRepository.existsById(id)) return;

            Constituency constituency = constituencyRepository.findById(seed.constituencyId())
                    .orElseThrow(() -> new RuntimeException("Constituency not found: " + seed.constituencyId()));

            Mandal m = new Mandal();

            m.setId(id);
            m.setName(seed.name());
            m.setConstituency(constituency);
            m.setActive(true);
            m.setCreatedAt(Instant.now());

            mandalRepository.save(m);
        });
    }

    /* =====================================================
       VILLAGES
       ===================================================== */

    private void seedVillages() {

        Map<String, VillageSeed> data = Map.ofEntries(

                Map.entry("PNP-2254", new VillageSeed("Pedanandipalle Agraharam", "DVP-1335"))
        );

        data.forEach((id, seed) -> {

            if (villageRepository.existsById(id)) return;

            Mandal mandal = mandalRepository.findById(seed.mandalId())
                    .orElseThrow(() -> new RuntimeException("Mandal not found: " + seed.mandalId()));

            Village v = new Village();

            v.setId(id);
            v.setName(seed.name());
            v.setMandal(mandal);
            v.setActive(true);
            v.setCreatedAt(Instant.now());

            villageRepository.save(v);
        });
    }

    /* =====================================================
       RECORDS
       ===================================================== */

    private record DistrictSeed(String name, String stateId) {}
    private record ConstituencySeed(String name, String districtId) {}
    private record MandalSeed(String name, String constituencyId) {}
    private record VillageSeed(String name, String mandalId) {}
}