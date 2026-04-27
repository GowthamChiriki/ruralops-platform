package com.ruralops.platform.secure.activation.resolver;

/**
 * Resolves and validates account eligibility for activation.
 *
 * PURPOSE:
 * - Ensure account exists
 * - Ensure account is in correct state for activation
 *
 * NOTE:
 * - No email or contact responsibility anymore
 */
public interface AccountContactResolver {

    /**
     * Validates that the account is eligible for activation.
     *
     * @param accountType Account category (MAO, VAO, CITIZEN, etc.)
     * @param accountId   Public account identifier
     */
    void validate(String accountType, String accountId);
}