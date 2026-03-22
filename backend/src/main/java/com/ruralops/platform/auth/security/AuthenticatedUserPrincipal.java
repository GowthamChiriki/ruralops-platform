package com.ruralops.platform.auth.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public class AuthenticatedUserPrincipal implements UserDetails {

    private final UUID userId;
    private final String role;
    private final String villageId;

    private final Collection<? extends GrantedAuthority> authorities;

    public AuthenticatedUserPrincipal(UUID userId, String role, String villageId) {
        this.userId = userId;
        this.role = role;
        this.villageId = villageId;
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    public UUID getUserId() {
        return userId;
    }

    public String getRole() {
        return role;
    }

    public String getVillageId() {
        return villageId;
    }

    /* =====================================================
       AUTHORITIES
       ===================================================== */

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    /* =====================================================
       USERNAME
       ===================================================== */

    @Override
    public String getUsername() {
        return userId.toString();
    }

    /* =====================================================
       PASSWORD NOT USED (JWT)
       ===================================================== */

    @Override
    public String getPassword() {
        return null;
    }

    /* =====================================================
       ACCOUNT FLAGS
       ===================================================== */

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}