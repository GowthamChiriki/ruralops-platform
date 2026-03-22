package com.ruralops.platform.auth.exception;

import com.ruralops.platform.common.enums.AccountStatus;

public class AccountNotActiveException extends RuntimeException {

    public AccountNotActiveException(AccountStatus status) {
        super("Account not active: " + status);
    }
}