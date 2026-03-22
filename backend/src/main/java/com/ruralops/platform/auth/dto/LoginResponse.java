package com.ruralops.platform.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Collections;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginResponse {

    private final String accessToken;
    private final String refreshToken;

    private final String activeRole;     // currently logged role
    private final List<String> roles;    // all available roles

    private final String accountId;
    private final String villageId;

    public LoginResponse(
            String accessToken,
            String refreshToken,
            String activeRole,
            List<String> roles,
            String accountId,
            String villageId
    ) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.activeRole = activeRole;
        this.roles = roles == null ? null : Collections.unmodifiableList(roles);
        this.accountId = accountId;
        this.villageId = villageId;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public String getActiveRole() {
        return activeRole;
    }

    public List<String> getRoles() {
        return roles;
    }

    public String getAccountId() {
        return accountId;
    }

    public String getVillageId() {
        return villageId;
    }
}