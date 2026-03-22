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
 *
 * Provides query methods for retrieving tokens by account,
 * status, and creation time.
 */
public interface ActivationTokenRepository
        extends JpaRepository<ActivationToken, UUID> {

    /**
     * Finds a single token by account type, account ID, and status.
     *
     * Typically used to retrieve the currently ACTIVE token.
     */
    Optional<ActivationToken> findByAccountTypeAndAccountIdAndStatus(
            String accountType,
            String accountId,
            ActivationTokenStatus status
    );

    /**
     * Finds all tokens for a given account and status.
     *
     * Useful for bulk state transitions (e.g., expiring old tokens).
     */
    List<ActivationToken> findAllByAccountTypeAndAccountIdAndStatus(
            String accountType,
            String accountId,
            ActivationTokenStatus status
    );

    /**
     * Counts how many tokens were created after the specified time
     * for a given account.
     *
     * Used to enforce regeneration limits within a time window.
     */
    long countByAccountTypeAndAccountIdAndCreatedAtAfter(
            String accountType,
            String accountId,
            Instant after
    );
}
