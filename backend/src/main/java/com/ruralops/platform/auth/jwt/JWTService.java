package com.ruralops.platform.auth.jwt;

import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Service;

@Service
public class JWTService {

    private final JWTTokenProvider tokenProvider;

    public JWTService(JWTTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    /* =====================================================
       TOKEN GENERATION
       ===================================================== */

    public String generateAccessToken(String userId, String role, String villageId) {
        return tokenProvider.generateAccessToken(userId, role.toUpperCase(), villageId);
    }

    public String generateRefreshToken(String userId) {
        return tokenProvider.generateRefreshToken(userId);
    }

    /* =====================================================
       TOKEN VALIDATION
       ===================================================== */

    public boolean validateToken(String token) {

        if (token == null || token.isBlank()) {
            return false;
        }

        try {
            if (!tokenProvider.validateToken(token)) {
                return false;
            }

            return !tokenProvider.isTokenExpired(token);

        } catch (Exception ex) {
            return false;
        }
    }

    /* =====================================================
       CLAIM EXTRACTION
       ===================================================== */

    public String extractUserId(String token) {
        return tokenProvider.getUserId(token);
    }

    public String extractRole(String token) {
        return tokenProvider.getRole(token);
    }

    public String extractVillageId(String token) {
        return tokenProvider.getVillageId(token);
    }

    public Claims extractClaims(String token) {
        return tokenProvider.extractAllClaims(token);
    }
}