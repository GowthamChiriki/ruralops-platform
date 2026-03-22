package com.ruralops.platform.worker.repository;

import com.ruralops.platform.worker.domain.WorkerAccount;
import com.ruralops.platform.common.enums.AccountStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkerAccountRepository
        extends JpaRepository<WorkerAccount, UUID> {

    /* ======================================================
       Identity Lookups
       ====================================================== */

    // Public worker identifier (ex: WRK-00012)
    Optional<WorkerAccount> findByWorkerId(String workerId);

    // Worker account from authenticated user
    Optional<WorkerAccount> findByUser_Id(UUID userId);

    Optional<WorkerAccount> findByEmail(String email);

    Optional<WorkerAccount> findByPhoneNumber(String phoneNumber);

    /* ======================================================
       Governance Hierarchy
       ====================================================== */

    List<WorkerAccount> findByVillage_Id(String villageId);

    /* ======================================================
       Area Routing
       ====================================================== */

    Optional<WorkerAccount> findByArea_Id(Long areaId);

    Optional<WorkerAccount> findByArea_IdAndStatus(
            Long areaId,
            AccountStatus status
    );

    /* ======================================================
       Operational Queries
       ====================================================== */

    List<WorkerAccount> findByVillage_IdAndStatus(
            String villageId,
            AccountStatus status
    );

    /* ======================================================
       Uniqueness Guards
       ====================================================== */

    boolean existsByWorkerId(String workerId);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByUserId(UUID userId);

    boolean existsByArea_Id(Long areaId);

    /* ======================================================
       Dashboard Metrics
       ====================================================== */

    long countByVillage_Id(String villageId);

    long countByArea_Id(Long areaId);

    long countByVillage_IdAndStatus(
            String villageId,
            AccountStatus status
    );
}