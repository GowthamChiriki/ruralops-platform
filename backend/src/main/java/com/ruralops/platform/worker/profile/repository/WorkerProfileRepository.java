package com.ruralops.platform.worker.profile.repository;

import com.ruralops.platform.worker.profile.domain.WorkerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository responsible for database operations
 * related to WorkerProfile entities.
 *
 * Spring Data JPA automatically implements these
 * methods based on method naming conventions.
 */
public interface WorkerProfileRepository
        extends JpaRepository<WorkerProfile, UUID> {

    /* ======================================================
       Worker Account Lookup
       ====================================================== */

    /**
     * Finds profile by worker account internal ID.
     */
    Optional<WorkerProfile> findByWorkerAccount_Id(UUID workerAccountId);

    /**
     * Checks whether profile exists for a worker account.
     */
    boolean existsByWorkerAccount_Id(UUID workerAccountId);

    /* ======================================================
       Government Identity Lookup
       ====================================================== */

    /**
     * Finds worker profile using Aadhaar number.
     */
    Optional<WorkerProfile> findByAadhaarNumber(String aadhaarNumber);

}