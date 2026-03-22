package com.ruralops.platform.secure.activation.resolver;

/**
 * Resolves official contact details for an account.
 *
 * This interface defines how the system retrieves
 * registered contact information.
 *
 * Security note:
 * - Client-provided contact data must never be trusted.
 * - All contact details must be resolved from internal records.
 */
public interface AccountContactResolver {

    /**
     * Retrieves the registered contact details for the given account.
     *
     * @param accountType Account category (MAO, VAO, CITIZEN, etc.)
     * @param accountId   Public account identifier
     * @return Contact details resolved from system data
     */
    ResolvedContact resolve(String accountType, String accountId);

    /**
     * Immutable snapshot of resolved contact information.
     *
     * Represents trusted data retrieved from the system.
     */
    record ResolvedContact(
            String email,
            String displayName
    ) {}
}
