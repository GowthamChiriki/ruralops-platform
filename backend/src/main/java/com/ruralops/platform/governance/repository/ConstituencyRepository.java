package com.ruralops.platform.governance.repository;

import com.ruralops.platform.governance.domain.Constituency;
import com.ruralops.platform.governance.domain.District;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConstituencyRepository extends JpaRepository<Constituency, String> {
    Optional<Constituency> findByName(String name);

    boolean existsByDistrictAndName(District district, String name);
}
