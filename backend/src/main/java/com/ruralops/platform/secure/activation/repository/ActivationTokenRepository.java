package com.ruralops.platform.secure.activation.repository;

import com.ruralops.platform.common.enums.ActivationTokenStatus;
import com.ruralops.platform.secure.activation.domain.ActivationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for managing ActivationToken entities.
 */
public interface ActivationTokenRepository
        extends JpaRepository<ActivationToken, UUID> {

    Optional<ActivationToken> findByAccountTypeAndAccountIdAndStatus(
            String accountType,
            String accountId,
            ActivationTokenStatus status
    );

    List<ActivationToken> findAllByAccountTypeAndAccountIdAndStatus(
            String accountType,
            String accountId,
            ActivationTokenStatus status
    );

    long countByAccountTypeAndAccountIdAndCreatedAtAfter(
            String accountType,
            String accountId,
            Instant after
    );

    /**
     * NEW: Fetch latest ACTIVE token
     */
    Optional<ActivationToken> findTopByAccountTypeAndAccountIdAndStatusOrderByCreatedAtDesc(
            String accountType,
            String accountId,
            ActivationTokenStatus status
    );
}