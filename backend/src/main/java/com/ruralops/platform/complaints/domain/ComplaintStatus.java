package com.ruralops.platform.complaints.domain;

/**
 * Represents the lifecycle state of a Complaint.
 *
 * Complaints move through a controlled operational pipeline
 * ensuring traceability and governance accountability.
 *
 * Lifecycle:
 *
 * SUBMITTED
 *   ↓
 * AWAITING_ASSIGNMENT
 *   ↓
 * ASSIGNED
 *   ↓
 * IN_PROGRESS
 *   ↓
 * RESOLVED
 *   ↓
 * VERIFIED
 *   ↓
 * CLOSED
 *
 * Audience visibility:
 *
 * Citizens:
 *   SUBMITTED / AWAITING_ASSIGNMENT → "Awaiting Assignment"
 *
 * VAO Dashboard:
 *   AWAITING_ASSIGNMENT → "Worker not assigned to this area"
 *
 * Workers:
 *   ASSIGNED → task visible in worker dashboard
 */
public enum ComplaintStatus {

    /**
     * Complaint created by citizen.
     * Initial system state.
     */
    SUBMITTED,

    /**
     * Complaint exists but no worker is currently assigned
     * to the area responsible for resolving it.
     *
     * The complaint waits in the queue until a worker
     * becomes available or is assigned by governance.
     */
    AWAITING_ASSIGNMENT,

    /**
     * Worker assigned based on area routing.
     */
    ASSIGNED,

    /**
     * Worker has started resolving the issue.
     */
    IN_PROGRESS,

    /**
     * Worker marked the task as completed.
     * Awaiting verification.
     */
    RESOLVED,

    /**
     * AI model or VAO verified the resolution.
     */
    VERIFIED,

    /**
     * Complaint lifecycle completed and archived.
     */
    CLOSED
}