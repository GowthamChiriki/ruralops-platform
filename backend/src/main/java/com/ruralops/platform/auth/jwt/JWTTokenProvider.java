package com.ruralops.platform.auth.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JWTTokenProvider {

    /* =====================================================
       SECRET KEY
       ===================================================== */

    private final SecretKey secretKey;

    public JWTTokenProvider(@Value("${jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /* =====================================================
       TOKEN EXPIRATION
       ===================================================== */

    private static final long ACCESS_TOKEN_EXPIRATION = 15 * 60 * 1000; // 15 minutes
    private static final long REFRESH_TOKEN_EXPIRATION = 30L * 24 * 60 * 60 * 1000; // 30 days

    /* =====================================================
       ACCESS TOKEN GENERATION
       ===================================================== */

    public String generateAccessToken(String userId, String activeRole, String villageId) {

        Date now = new Date();
        Date expiry = new Date(now.getTime() + ACCESS_TOKEN_EXPIRATION);

        return Jwts.builder()
                .setSubject(userId)
                .claim("role", activeRole)
                .claim("villageId", villageId)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    /* =====================================================
       REFRESH TOKEN GENERATION
       ===================================================== */

    public String generateRefreshToken(String userId) {

        Date now = new Date();
        Date expiry = new Date(now.getTime() + REFRESH_TOKEN_EXPIRATION);

        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    /* =====================================================
       CLAIM EXTRACTION
       ===================================================== */

    public Claims extractAllClaims(String token) {

        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /* =====================================================
       CLAIM HELPERS
       ===================================================== */

    public String getUserId(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String getRole(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("role", String.class);
    }

    public String getVillageId(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("villageId", String.class);
    }

    /* =====================================================
       TOKEN VALIDATION
       ===================================================== */

    public boolean isTokenExpired(String token) {
        Date expiration = extractAllClaims(token).getExpiration();
        return expiration.before(new Date());
    }

    public boolean validateToken(String token) {

        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}