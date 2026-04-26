package com.ruralops.platform.auth.jwt;

import com.ruralops.platform.auth.security.AuthenticatedUserPrincipal;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class JWTAuthenticationFilter extends OncePerRequestFilter {

    private final JWTService jwtService;

    public JWTAuthenticationFilter(JWTService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        try {

            String authHeader = request.getHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {

                String token = authHeader.substring(7);

                /* =========================
                   VALIDATE TOKEN
                   ========================= */

                if (jwtService.validateToken(token)
                        && SecurityContextHolder.getContext().getAuthentication() == null) {

                    /* =========================
                       EXTRACT CLAIMS
                       ========================= */

                    Claims claims = jwtService.extractClaims(token);

                    String subject = claims.getSubject();
                    String role = claims.get("role", String.class);

                    if (role != null && role.startsWith("ROLE_")) {
                        role = role.substring(5);
                    }
                    String villageId = claims.get("villageId", String.class);

                    if (subject == null || role == null || role.isBlank()) {
                        filterChain.doFilter(request, response);
                        return;
                    }

                    /* =========================
                       CONVERT SUBJECT → UUID
                       ========================= */

                    UUID userId = UUID.fromString(subject);

                    /* =========================
                       BUILD PRINCIPAL
                       ========================= */

                    AuthenticatedUserPrincipal principal =
                            new AuthenticatedUserPrincipal(userId, role, villageId);

                    /* =========================
                       CREATE AUTHENTICATION
                       ========================= */

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    principal,
                                    null,
                                    principal.getAuthorities()
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    /* =========================
                       STORE AUTHENTICATION
                       ========================= */

                    SecurityContextHolder.getContext().setAuthentication(authentication);


                }
            }

        } catch (Exception ex) {

            /* If JWT fails, clear context but allow request to proceed.
               Security rules later will decide access. */

            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}