package com.ruralops.platform.citizen.account.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request payload used by VAO to approve or reject
 * a citizen registration.
 *
 * DESIGN:
 * - Uses internal UUID (never public citizenId)
 * - Decision is enum-backed (no string switching)
 * - Authority (VAO) is resolved from path / security context
 */
public class CitizenApprovalRequest {

    /**
     * Internal database identifier of the citizen.
     *
     * This is REQUIRED because:
     * - citizenId does not exist before approval
     * - approval is an administrative operation
     */
    @NotNull(message = "Citizen internal ID is required")
    private UUID citizenInternalId;

    /**
     * Approval decision.
     */
    @NotNull(message = "Decision is required")
    private Decision decision;

    protected CitizenApprovalRequest() {
        // For JSON deserialization only
    }

    public CitizenApprovalRequest(
            UUID citizenInternalId,
            Decision decision
    ) {
        this.citizenInternalId = citizenInternalId;
        this.decision = decision;
    }

    public UUID getCitizenInternalId() {
        return citizenInternalId;
    }

    public Decision getDecision() {
        return decision;
    }

    /**
     * Explicit approval decisions.
     * Prevents invalid values at compile-time.
     */
    public enum Decision {
        APPROVE,
        REJECT
    }
}
