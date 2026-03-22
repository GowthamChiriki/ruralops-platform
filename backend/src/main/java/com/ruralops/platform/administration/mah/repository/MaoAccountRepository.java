package com.ruralops.platform.administration.mah.repository;

import com.ruralops.platform.administration.mah.domain.MaoAccount;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.governance.domain.Mandal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MaoAccountRepository extends JpaRepository<MaoAccount, UUID> {

    // Governance lookups
    Optional<MaoAccount> findByMaoId(String maoId);

    Optional<MaoAccount> findByEmail(String email);

    Optional<MaoAccount> findByPhoneNumber(String phoneNumber);

    // Status-aware lookup

    Optional<MaoAccount> findByPhoneNumberAndStatus(
            String phoneNumber,
            AccountStatus status
    );

    // Hierarchy checks

    boolean existsByMandal(Mandal mandal);

    Optional<MaoAccount> findByMandal(Mandal mandal);

    // Uniqueness guards

    boolean existsByMaoId(String maoId);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);
}
