package com.ruralops.platform.auth.controller;

import com.ruralops.platform.auth.dto.LoginRequest;
import com.ruralops.platform.auth.dto.LoginResponse;
import com.ruralops.platform.auth.dto.RefreshTokenRequest;
import com.ruralops.platform.auth.dto.RefreshTokenResponse;
import com.ruralops.platform.auth.dto.RoleSwitchRequest;
import com.ruralops.platform.auth.entity.RefreshToken;
import com.ruralops.platform.auth.entity.UserRole;
import com.ruralops.platform.auth.jwt.JWTService;
import com.ruralops.platform.auth.service.AuthenticationService;
import com.ruralops.platform.auth.service.RefreshTokenService;
import com.ruralops.platform.auth.service.RoleService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationService authenticationService;
    private final RefreshTokenService refreshTokenService;
    private final JWTService jwtService;
    private final RoleService roleService;

    public AuthController(
            AuthenticationService authenticationService,
            RefreshTokenService refreshTokenService,
            JWTService jwtService,
            RoleService roleService
    ) {
        this.authenticationService = authenticationService;
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
        this.roleService = roleService;
    }

    /* =====================================================
       LOGIN
       ===================================================== */

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        LoginResponse response = authenticationService.login(request);
        return ResponseEntity.ok(response);
    }

    /* =====================================================
       REFRESH TOKEN
       ===================================================== */

    @PostMapping("/refresh")
    public ResponseEntity<RefreshTokenResponse> refresh(
            @Valid @RequestBody RefreshTokenRequest request
    ) {

        RefreshToken token =
                refreshTokenService.validateRefreshToken(request.getRefreshToken());

        RefreshToken newToken =
                refreshTokenService.rotateRefreshToken(token);

        UUID userId = token.getUserId();

        UserRole activeRole =
                roleService.getDefaultRole(userId.toString());

        String accessToken =
                jwtService.generateAccessToken(
                        userId.toString(),
                        activeRole.getRole(),
                        activeRole.getVillageId()
                );

        RefreshTokenResponse response =
                new RefreshTokenResponse(
                        accessToken,
                        newToken.getToken()
                );

        return ResponseEntity.ok(response);
    }

    /* =====================================================
       ROLE SWITCH
       ===================================================== */

    @PostMapping("/switch-role")
    public ResponseEntity<LoginResponse> switchRole(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody RoleSwitchRequest request
    ) {

        String token = extractBearerToken(authHeader);

        if (!jwtService.validateToken(token)) {
            throw new RuntimeException("Invalid or expired token");
        }

        String userId = jwtService.extractUserId(token);

        UserRole selectedRole =
                roleService.getRoleForUser(userId, request.getNormalizedRole());

        List<UserRole> userRoles =
                roleService.getRolesForUser(userId);

        List<String> roles =
                userRoles.stream()
                        .map(UserRole::getRole)
                        .collect(Collectors.toList());

        String accessToken =
                jwtService.generateAccessToken(
                        userId,
                        selectedRole.getRole(),
                        selectedRole.getVillageId()
                );

        LoginResponse response =
                new LoginResponse(
                        accessToken,
                        null,
                        selectedRole.getRole(),
                        roles,
                        userId,
                        selectedRole.getVillageId()
                );

        return ResponseEntity.ok(response);
    }

    /* =====================================================
       LOGOUT
       ===================================================== */

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @Valid @RequestBody RefreshTokenRequest request
    ) {

        RefreshToken refreshToken =
                refreshTokenService.validateRefreshToken(request.getRefreshToken());

        refreshTokenService.revokeToken(refreshToken);

        return ResponseEntity.ok().build();
    }

    /* =====================================================
       TOKEN VALIDATION
       ===================================================== */

    @GetMapping("/validate")
    public ResponseEntity<Void> validateToken(
            @RequestHeader("Authorization") String authHeader
    ) {

        String token = extractBearerToken(authHeader);

        if (!jwtService.validateToken(token)) {
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok().build();
    }
    /* =====================================================
       HELPER
       ===================================================== */

    private String extractBearerToken(String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Invalid Authorization header");
        }

        return authHeader.substring(7);
    }
}