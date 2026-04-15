package com.ruralops.platform.administration.vah.repository;

import com.ruralops.platform.administration.vah.domain.VaoAccount;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.governance.domain.Village;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for managing VAO accounts.
 *
 * Provides identity lookups, governance-based queries,
 * and uniqueness checks.
 */
public interface VaoAccountRepository extends JpaRepository<VaoAccount, UUID> {

    /* =======================
       Identity lookups
       ======================= */

    /**
     * Finds VAO by public VAO ID.
     */
    Optional<VaoAccount> findByVaoId(String vaoId);

    /**
     * Finds VAO by authentication user identity.
     *
     * Used by JWT-authenticated services.
     */
    Optional<VaoAccount> findByUserId(UUID userId);

    /**
     * Finds VAO account by email.
     */
    Optional<VaoAccount> findByEmail(String email);

    /**
     * Finds VAO account by phone number.
     */
    Optional<VaoAccount> findByPhoneNumber(String phoneNumber);

    /* =======================
       Governance / hierarchy
       ======================= */

    /**
     * Finds VAO responsible for a village.
     */
    Optional<VaoAccount> findByVillage(Village village);

    /**
     * Checks whether a village already has a VAO.
     */
    boolean existsByVillage(Village village);

    /* =======================
       Status-aware lookup
       ======================= */

    /**
     * Finds VAO by phone number and status.
     */
    Optional<VaoAccount> findByPhoneNumberAndStatus(
            String phoneNumber,
            AccountStatus status
    );

    /* =======================
       Uniqueness guards
       ======================= */

    boolean existsByVaoId(String vaoId);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByUser_Id(UUID userId);
}