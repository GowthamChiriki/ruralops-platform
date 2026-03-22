package com.ruralops.platform.auth.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    /* =====================================================
       BUCKET CONFIGURATION
       ===================================================== */

    private Bucket createBucket() {

        Bandwidth limit = Bandwidth.builder()
                .capacity(5)
                .refillGreedy(5, Duration.ofMinutes(1))
                .build();

        BucketConfiguration configuration =
                BucketConfiguration.builder()
                        .addLimit(limit)
                        .build();

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    /* =====================================================
       FILTER LOGIC
       ===================================================== */

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        if ("/auth/login".equals(path) && "POST".equalsIgnoreCase(method)) {

            String clientIp = getClientIp(request);

            Bucket bucket = buckets.computeIfAbsent(clientIp, ip -> createBucket());

            if (!bucket.tryConsume(1)) {

                response.setStatus(429);
                response.setContentType("application/json");

                response.getWriter().write(
                        "{\"error\":\"Too many login attempts. Please try again later.\"}"
                );

                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    /* =====================================================
       CLIENT IP RESOLUTION
       ===================================================== */

    private String getClientIp(HttpServletRequest request) {

        String forwarded = request.getHeader("X-Forwarded-For");

        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0];
        }

        return request.getRemoteAddr();
    }
}