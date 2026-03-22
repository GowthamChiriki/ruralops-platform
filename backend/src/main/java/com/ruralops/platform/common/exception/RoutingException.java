package com.ruralops.platform.common.exception;

/**
 * Thrown when a complaint cannot be routed because no worker
 * is currently assigned to its area.
 *
 * This is an expected operational condition, not an infrastructure
 * failure. Callers (e.g. ComplaintSubmissionService) should catch
 * this specifically and handle it gracefully — typically by leaving
 * the complaint in AWAITING_ASSIGNMENT state for VAO action.
 *
 * Contrast with unexpected routing failures (DB errors, NPEs) which
 * should propagate as unchecked exceptions and roll back the transaction.
 */
public class RoutingException extends RuntimeException {

    public RoutingException(String message) {
        super(message);
    }

    public RoutingException(String message, Throwable cause) {
        super(message, cause);
    }
}