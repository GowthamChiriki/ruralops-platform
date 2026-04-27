package com.ruralops.platform.secure.status.dto;

import com.ruralops.platform.common.enums.AccountStatus;

/**
 * Unified response for account status check.
 *
 * Represents ONE account belonging to a phone number.
 */
public class StatusCheckResponse {

    private final String accountType;
    private final String accountId;
    private final AccountStatus status;
    private final boolean canActivate;
    private final String nextAction;

    /**
     * NEW: Activation key (only present when applicable)
     */
    private final String activationKey;

    public StatusCheckResponse(
            String accountType,
            String accountId,
            AccountStatus status,
            boolean canActivate,
            String nextAction,
            String activationKey
    ) {
        this.accountType = accountType;
        this.accountId = accountId;
        this.status = status;
        this.canActivate = canActivate;
        this.nextAction = nextAction;
        this.activationKey = activationKey;
    }

    public String getAccountType() {
        return accountType;
    }

    public String getAccountId() {
        return accountId;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public boolean isCanActivate() {
        return canActivate;
    }

    public String getNextAction() {
        return nextAction;
    }

    /**
     * NEW getter
     */
    public String getActivationKey() {
        return activationKey;
    }
}