package com.ruralops.platform.citizen.profile.repository;

import com.ruralops.platform.citizen.profile.domain.CitizenProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository responsible for database access
 * for CitizenProfile entities.
 *
 * Spring Data JPA automatically implements
 * the methods based on naming conventions.
 */
public interface CitizenProfileRepository extends JpaRepository<CitizenProfile, UUID> {

    /**
     * Find profile by citizen account ID
     */
    Optional<CitizenProfile> findByCitizenAccount_Id(UUID citizenAccountId);

    /**
     * Check if profile already exists for this account
     */
    boolean existsByCitizenAccount_Id(UUID citizenAccountId);

    /**
     * Find profile using Aadhaar number
     */
}