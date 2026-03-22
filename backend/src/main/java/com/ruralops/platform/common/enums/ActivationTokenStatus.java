package com.ruralops.platform.common.enums;

/**
 * Lifecycle states for activation tokens.
 *
 * Shared across all account types:
 * MAO, VAO, Citizen, Worker, DAO, etc.
 */
public enum ActivationTokenStatus {

    /**
     * Token is valid and can be used.
     */
    ACTIVE,

    /**
     * Token has been successfully consumed.
     */
    USED,

    /**
     * Token expired due to time or regeneration.
     */
    EXPIRED
}
