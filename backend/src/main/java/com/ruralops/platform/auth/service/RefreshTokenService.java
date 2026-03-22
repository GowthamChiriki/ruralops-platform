package com.ruralops.platform.auth.service;

import com.ruralops.platform.auth.entity.RefreshToken;
import com.ruralops.platform.auth.exception.InvalidTokenException;
import com.ruralops.platform.auth.repository.RefreshTokenRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    private static final long REFRESH_TOKEN_VALIDITY_SECONDS =
            30L * 24 * 60 * 60; // 30 days

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    /* =====================================================
       CREATE REFRESH TOKEN
       ===================================================== */

    @Transactional
    public RefreshToken createRefreshToken(UUID userId) {

        String tokenValue = UUID.randomUUID().toString();

        Instant expiryDate =
                Instant.now().plusSeconds(REFRESH_TOKEN_VALIDITY_SECONDS);

        RefreshToken token =
                new RefreshToken(userId, tokenValue, expiryDate);

        return refreshTokenRepository.save(token);
    }

    /* =====================================================
       VALIDATE TOKEN
       ===================================================== */

    public RefreshToken validateRefreshToken(String tokenValue) {

        RefreshToken token =
                refreshTokenRepository.findByToken(tokenValue)
                        .orElseThrow(() ->
                                new InvalidTokenException("Refresh token not found"));

        if (!token.isActive()) {
            throw new InvalidTokenException("Refresh token invalid");
        }

        return token;
    }

    /* =====================================================
       REVOKE SINGLE TOKEN
       ===================================================== */

    @Transactional
    public void revokeToken(RefreshToken token) {

        if (!token.isRevoked()) {
            token.revoke();
            refreshTokenRepository.save(token);
        }
    }

    /* =====================================================
       REVOKE ALL USER TOKENS
       ===================================================== */

    @Transactional
    public void revokeAllUserTokens(UUID userId) {

        List<RefreshToken> activeTokens =
                refreshTokenRepository.findByUserIdAndRevokedFalse(userId);

        if (activeTokens.isEmpty()) {
            return;
        }

        activeTokens.forEach(RefreshToken::revoke);

        refreshTokenRepository.saveAll(activeTokens);
    }

    /* =====================================================
       ROTATE REFRESH TOKEN
       ===================================================== */

    @Transactional
    public RefreshToken rotateRefreshToken(RefreshToken oldToken) {

        if (!oldToken.isActive()) {
            throw new InvalidTokenException("Refresh token invalid");
        }

        oldToken.revoke();
        refreshTokenRepository.save(oldToken);

        return createRefreshToken(oldToken.getUserId());
    }

    /* =====================================================
       CLEANUP EXPIRED TOKENS
       ===================================================== */

    @Transactional
    public void deleteExpiredTokens() {
        refreshTokenRepository.deleteByExpiryDateBefore(Instant.now());
    }
}