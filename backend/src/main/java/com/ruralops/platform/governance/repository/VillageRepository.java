package com.ruralops.platform.governance.repository;

import com.ruralops.platform.governance.domain.Mandal;
import com.ruralops.platform.governance.domain.Village;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VillageRepository extends JpaRepository<Village, String> {

    boolean existsByMandalAndName(Mandal mandal, String name);
    Optional<Village> findByName(String name);

    Optional<Village> findByMandalAndName(Mandal mandal, String name);

    List<Village> findAllByMandal(Mandal mandal);
}
