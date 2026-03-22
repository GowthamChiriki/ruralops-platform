package com.ruralops.platform.common.exception;

/**
 * Base exception for all domain and governance rule violations.
 * These are NOT programming bugs.
 */
public abstract class DomainException extends RuntimeException {

    protected DomainException(String message) {
        super(message);
    }
}
