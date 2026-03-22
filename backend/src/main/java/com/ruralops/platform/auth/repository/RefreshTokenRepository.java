package com.ruralops.platform.auth.repository;

import com.ruralops.platform.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /* =====================================================
       Find refresh token by token value
       ===================================================== */

    Optional<RefreshToken> findByToken(String token);

    /* =====================================================
       Get all tokens issued to a user
       ===================================================== */

    List<RefreshToken> findByUserId(UUID userId);

    /* =====================================================
       Get only active (non-revoked) tokens
       ===================================================== */

    List<RefreshToken> findByUserIdAndRevokedFalse(UUID userId);

    /* =====================================================
       Delete expired tokens
       Used by cleanup scheduler
       ===================================================== */

    void deleteByExpiryDateBefore(Instant now);
}