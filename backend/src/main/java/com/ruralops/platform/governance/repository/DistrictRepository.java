package com.ruralops.platform.governance.repository;

import com.ruralops.platform.governance.domain.District;
import com.ruralops.platform.governance.domain.State;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DistrictRepository extends JpaRepository<District, String> {

    Optional<District> findByName(String name);

    boolean existsByStateAndName(State state, String name);

    Optional<District> findByStateAndName(State state, String name);
}
