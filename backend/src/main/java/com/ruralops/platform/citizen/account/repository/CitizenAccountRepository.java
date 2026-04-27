package com.ruralops.platform.citizen.account.repository;

import com.ruralops.platform.citizen.account.domain.CitizenAccount;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.governance.domain.Village;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CitizenAccountRepository
        extends JpaRepository<CitizenAccount, UUID> {

    /* =====================================================
       IDENTITY LOOKUPS
       ===================================================== */

    Optional<CitizenAccount> findByCitizenId(String citizenId);

    /* FIXED METHOD */
    Optional<CitizenAccount> findByUser_Id(UUID userId);

    Optional<CitizenAccount> findByPhoneNumber(String phoneNumber);

    Optional<CitizenAccount> findByEmail(String email);

    Optional<CitizenAccount> findByAadhaarNumber(String aadhaarNumber);

    /* =====================================================
       UNIQUENESS VALIDATION
       ===================================================== */

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByAadhaarNumber(String aadhaarNumber);

    boolean existsByUser_Id(UUID userId);

    /* =====================================================
       VAO APPROVAL WORKFLOW
       ===================================================== */

    List<CitizenAccount> findAllByVillageAndStatus(
            Village village,
            AccountStatus status
    );

    /* =====================================================
       PAGINATED QUERIES
       ===================================================== */

    Page<CitizenAccount> findByVillage_Id(
            String villageId,
            Pageable pageable
    );

    Page<CitizenAccount> findByVillage_IdAndStatus(
            String villageId,
            AccountStatus status,
            Pageable pageable
    );

    /* =====================================================
       DASHBOARD METRICS
       ===================================================== */

    long countByVillage_Id(String villageId);

    long countByVillage_IdAndStatus(
            String villageId,
            AccountStatus status
    );

}