package com.ruralops.platform.governance.repository;

import com.ruralops.platform.governance.domain.Area;
import com.ruralops.platform.governance.domain.Village;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AreaRepository extends JpaRepository<Area, Long> {

    /**
     * Checks if an Area with the given name already exists
     * within the specified Village.
     */
    boolean existsByVillageAndName(Village village, String name);

    /**
     * Finds a specific Area by Village and Area name.
     */
    Optional<Area> findByVillageAndName(Village village, String name);

    /**
     * Returns all Areas belonging to a Village.
     */
    List<Area> findAllByVillage(Village village);

}