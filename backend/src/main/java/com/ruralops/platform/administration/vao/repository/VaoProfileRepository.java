package com.ruralops.platform.administration.vao.repository;

import com.ruralops.platform.administration.vao.domain.VaoProfile;
import com.ruralops.platform.administration.vah.domain.VaoAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for VAO profiles.
 *
 * Provides persistence and query operations
 * for VaoProfile entities.
 */
public interface VaoProfileRepository extends JpaRepository<VaoProfile, UUID> {

    /**
     * Finds the profile belonging to a VAO account.
     */
    Optional<VaoProfile> findByVaoAccount(VaoAccount vaoAccount);

    /**
     * Check if a profile exists for the VAO account.
     */
    boolean existsByVaoAccount(VaoAccount vaoAccount);
}