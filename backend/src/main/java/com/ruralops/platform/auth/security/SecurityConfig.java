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
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JWTAuthenticationFilter jwtAuthenticationFilter;
    private final LoginRateLimitFilter loginRateLimitFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(
            JWTAuthenticationFilter jwtAuthenticationFilter,
            LoginRateLimitFilter loginRateLimitFilter,
            CorsConfigurationSource corsConfigurationSource
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.loginRateLimitFilter = loginRateLimitFilter;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http

                /* =====================================================
                   CORS (FIXED PROPERLY)
                   ===================================================== */
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                /* =====================================================
                   DISABLE DEFAULT SECURITY
                   ===================================================== */
                .csrf(csrf -> csrf.disable())
                .httpBasic(httpBasic -> httpBasic.disable())
                .formLogin(form -> form.disable())

                /* =====================================================
                   STATELESS (JWT)
                   ===================================================== */
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                /* =====================================================
                   AUTHORIZATION
                   ===================================================== */
                .authorizeHttpRequests(auth -> auth

                        /* CORS preflight */
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        /* AUTH */
                        .requestMatchers("/auth/login").permitAll()
                        .requestMatchers("/auth/refresh").permitAll()
                        .requestMatchers("/auth/validate").permitAll()

                        /* PUBLIC */
                        .requestMatchers("/citizen/register").permitAll()
                        .requestMatchers("/citizen/login").permitAll()
                        .requestMatchers("/citizen/activate/**").permitAll()
                        .requestMatchers("/activation/request").permitAll()

                        .requestMatchers("/workers/activate/**").permitAll()
                        .requestMatchers("/status/**").permitAll()

                        /* ADMIN */
                        .requestMatchers("/admin/**").hasRole("SUPER_ADMIN")

                        /* VAO */
                        .requestMatchers("/workers/provision").hasAnyRole("VAO", "SUPER_ADMIN")
                        .requestMatchers("/workers/village").hasAnyRole("VAO", "SUPER_ADMIN")
                        .requestMatchers("/vao/**").hasAnyRole("VAO", "SUPER_ADMIN")

                        /* WORKER */
                        .requestMatchers("/workers/complaints/**").hasAnyRole("WORKER", "SUPER_ADMIN")

                        /* CITIZEN */
                        .requestMatchers("/citizen/**").hasAnyRole("CITIZEN", "SUPER_ADMIN")

                        /* MAO */
                        .requestMatchers("/administration/**").hasAnyRole("MAO", "SUPER_ADMIN")

                        .anyRequest().authenticated()
                )

                /* =====================================================
                   FILTERS
                   ===================================================== */

                // ⚠️ TEMP: comment this if login fails
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