package com.ruralops.platform.governance.repository;

import com.ruralops.platform.governance.domain.Constituency;
import com.ruralops.platform.governance.domain.Mandal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MandalRepository extends JpaRepository<Mandal, String> {

    boolean existsByConstituencyAndName(Constituency constituency, String name);

    Optional<Mandal> findByConstituencyAndName(Constituency constituency, String name);
}
