package com.ruralops.platform.auth.service;

import com.ruralops.platform.auth.dto.LoginRequest;
import com.ruralops.platform.auth.dto.LoginResponse;
import com.ruralops.platform.auth.entity.User;
import com.ruralops.platform.auth.entity.UserRole;
import com.ruralops.platform.auth.exception.AccountNotActiveException;
import com.ruralops.platform.auth.exception.AuthenticationException;
import com.ruralops.platform.auth.jwt.JWTService;
import com.ruralops.platform.auth.repository.UserRepository;
import com.ruralops.platform.auth.repository.UserRoleRepository;
import com.ruralops.platform.common.enums.AccountStatus;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthenticationService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthenticationService(
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            PasswordEncoder passwordEncoder,
            JWTService jwtService,
            RefreshTokenService refreshTokenService
    ) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    /* =====================================================
       LOGIN
       ===================================================== */

    @Transactional
    public LoginResponse login(LoginRequest request) {

        String phone = request.getNormalizedPhoneNumber();

        /* =========================
           FIND USER
           ========================= */

        User user = userRepository
                .findByPhone(phone)
                .orElseThrow(() ->
                        new AuthenticationException("Invalid phone number or password"));

        /* =========================
           VERIFY PASSWORD
           ========================= */

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthenticationException("Invalid phone number or password");
        }

        /* =========================
           CHECK ACCOUNT STATUS
           ========================= */

        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new AccountNotActiveException(user.getStatus());
        }

        /* =========================
           LOAD USER ROLES
           ========================= */

        List<UserRole> userRoles = userRoleRepository.findByUserId(user.getId());

        if (userRoles.isEmpty()) {
            throw new AuthenticationException("User has no roles assigned");
        }

        /* =========================
           EXTRACT ROLE LIST
           ========================= */

        List<String> roles = userRoles
                .stream()
                .map(UserRole::getRole)
                .collect(Collectors.toList());

        /* =========================
           SELECT DEFAULT ROLE
           ========================= */

        UserRole activeRole = selectDefaultRole(userRoles);

        UUID userId = user.getId();

        /* =========================
           REVOKE OLD SESSIONS
           ========================= */

        refreshTokenService.revokeAllUserTokens(userId);

        /* =========================
           GENERATE ACCESS TOKEN
           ========================= */

        String accessToken = jwtService.generateAccessToken(
                userId.toString(),
                activeRole.getRole(),
                activeRole.getVillageId()
        );

        /* =========================
           CREATE REFRESH TOKEN
           ========================= */

        var refreshToken = refreshTokenService.createRefreshToken(userId);

        /* =========================
           RETURN RESPONSE
           ========================= */

        return new LoginResponse(
                accessToken,
                refreshToken.getToken(),
                activeRole.getRole(),
                roles,
                userId.toString(),
                activeRole.getVillageId()
        );
    }

    /* =====================================================
       ROLE PRIORITY SELECTION
       ===================================================== */

    private UserRole selectDefaultRole(List<UserRole> roles) {

        return roles.stream()
                .max(Comparator.comparingInt(r -> rolePriority(r.getRole())))
                .orElseThrow();
    }

    /* =====================================================
       ROLE PRIORITY
       ===================================================== */

    private int rolePriority(String role) {

        return switch (role) {

            case "MAO" -> 4;
            case "VAO" -> 3;
            case "WORKER" -> 2;
            case "CITIZEN" -> 1;

            default -> 0;
        };
    }
}