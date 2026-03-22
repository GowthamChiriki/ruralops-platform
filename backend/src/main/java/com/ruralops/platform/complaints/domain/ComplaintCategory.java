package com.ruralops.platform.complaints.domain;

/**
 * Represents the category of issue reported in a complaint.
 *
 * Categories enable the platform to:
 *
 * • Route complaints to appropriate workers
 * • Generate governance analytics
 * • Assist AI classification models
 * • Determine operational priority
 *
 * Priority scale:
 * 1 = lowest urgency
 * 5 = highest urgency
 */
public enum ComplaintCategory {

    /**
     * Garbage accumulation or sanitation issues.
     */
    GARBAGE("Sanitation", 3),

    /**
     * Drainage blockage, sewage overflow, or stagnant water.
     */
    DRAINAGE("Infrastructure", 4),

    /**
     * Broken roads, potholes, or damaged pathways.
     */
    ROAD_DAMAGE("Infrastructure", 2),

    /**
     * Street lights not functioning.
     */
    STREET_LIGHT("Utilities", 2),

    /**
     * Water supply interruptions, leakages, or pipe damage.
     */
    WATER_SUPPLY("Utilities", 4),

    /**
     * Public health hazards such as contamination,
     * open waste, or disease risk.
     */
    PUBLIC_HEALTH("Health", 5),

    /**
     * Any issue not covered by predefined categories.
     */
    OTHER("General", 1);

    /* =====================================================
       Operational Metadata
       ===================================================== */

    /**
     * Broad operational group for governance analytics.
     */
    private final String group;

    /**
     * Priority level used for routing urgency.
     * Scale: 1 (lowest) → 5 (highest)
     */
    private final int priority;

    ComplaintCategory(String group, int priority) {

        if (priority < 1 || priority > 5) {
            throw new IllegalArgumentException(
                    "Priority must be between 1 and 5"
            );
        }

        this.group = group;
        this.priority = priority;
    }

    /* =====================================================
       Getters
       ===================================================== */

    /**
     * Returns the operational group.
     */
    public String getGroup() {
        return group;
    }

    /**
     * Returns routing priority.
     */
    public int getPriority() {
        return priority;
    }
}