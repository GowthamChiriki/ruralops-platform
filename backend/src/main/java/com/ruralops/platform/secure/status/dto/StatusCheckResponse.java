package com.ruralops.platform.secure.status.dto;

import com.ruralops.platform.common.enums.AccountStatus;

/**
 * Unified response for account status check.
 *
 * Represents ONE account belonging to a phone number.
 * The API may return multiple responses when a user
 * has multiple roles (Citizen, Worker, VAO, etc).
 *
 * Example API response:
 *
 * [
 *   { accountType: "CITIZEN", ... },
 *   { accountType: "WORKER", ... }
 * ]
 *
 * READ-ONLY
 * IMMUTABLE
 * STABLE API CONTRACT
 */
public class StatusCheckResponse {

    /**
     * Account type.
     * Example: MAO, VAO, CITIZEN, WORKER
     */
    private final String accountType;

    /**
     * Public account identifier.
     * Example: RLOM-MDG-3128-A7F3
     */
    private final String accountId;

    /**
     * Current lifecycle status.
     */
    private final AccountStatus status;

    /**
     * Whether the account is eligible for activation.
     */
    private final boolean canActivate;

    /**
     * Next allowed action for the user.
     *
     * Examples:
     * - REQUEST_ACTIVATION
     * - LOGIN
     * - WAIT_FOR_APPROVAL
     * - CONTACT_SUPPORT
     */
    private final String nextAction;

    public StatusCheckResponse(
            String accountType,
            String accountId,
            AccountStatus status,
            boolean canActivate,
            String nextAction
    ) {
        this.accountType = accountType;
        this.accountId = accountId;
        this.status = status;
        this.canActivate = canActivate;
        this.nextAction = nextAction;
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
}