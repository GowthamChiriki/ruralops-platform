package com.ruralops.platform.auth.security;

import com.ruralops.platform.auth.jwt.JWTAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JWTAuthenticationFilter jwtAuthenticationFilter;
    private final LoginRateLimitFilter loginRateLimitFilter;

    public SecurityConfig(
            JWTAuthenticationFilter jwtAuthenticationFilter,
            LoginRateLimitFilter loginRateLimitFilter
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.loginRateLimitFilter = loginRateLimitFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http

                /* =====================================================
                   CORS SUPPORT
                   ===================================================== */

                .cors(cors -> {})

                /* =====================================================
                   DISABLE DEFAULT SECURITY FEATURES
                   ===================================================== */

                .csrf(csrf -> csrf.disable())
                .httpBasic(httpBasic -> httpBasic.disable())
                .formLogin(form -> form.disable())

                /* =====================================================
                   STATELESS SESSION (JWT)
                   ===================================================== */

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                /* =====================================================
                   AUTHORIZATION RULES
                   ===================================================== */

                .authorizeHttpRequests(auth -> auth

                        /* CORS preflight */
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        /* =====================================================
                           AUTH ENDPOINTS
                           ===================================================== */

                        .requestMatchers("/auth/login").permitAll()
                        .requestMatchers("/auth/refresh").permitAll()
                        .requestMatchers("/auth/validate").permitAll()

                        /* =====================================================
                           PUBLIC REGISTRATION
                           ===================================================== */

                        .requestMatchers("/citizen/register").permitAll()
                        .requestMatchers("/citizen/login").permitAll()
                        .requestMatchers("/citizen/activate/**").permitAll()
                        .requestMatchers("/activation/request").permitAll()

                        .requestMatchers("/workers/activate/**").permitAll()
                        .requestMatchers("/status/**").permitAll()

                        /* uploads */
                        .requestMatchers("/uploads/**").permitAll()

                        /* =====================================================
                           SUPER ADMIN — full access to everything
                           ===================================================== */

                        .requestMatchers("/**").hasRole("SUPER_ADMIN")

                        /* =====================================================
                           VAO ACTIONS
                           ===================================================== */

                        .requestMatchers("/workers/provision").hasRole("VAO")
                        .requestMatchers("/workers/village").hasRole("VAO")
                        .requestMatchers("/vao/**").hasRole("VAO")

                        /* =====================================================
                           WORKER ACTIONS
                           ===================================================== */

                        .requestMatchers("/workers/complaints/**").hasRole("WORKER")

                        /* =====================================================
                           CITIZEN ACTIONS
                           ===================================================== */

                        .requestMatchers("/citizen/**").hasRole("CITIZEN")

                        /* =====================================================
                           MAO ADMIN
                           ===================================================== */

                        .requestMatchers("/administration/**").hasRole("MAO")

                        .anyRequest().authenticated()
                )

                /* =====================================================
                   FILTER CHAIN
                   ===================================================== */

                .addFilterBefore(
                        loginRateLimitFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}