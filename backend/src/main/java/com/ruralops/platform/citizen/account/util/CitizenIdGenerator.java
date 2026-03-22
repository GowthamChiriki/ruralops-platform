package com.ruralops.platform.citizen.account.util;

import com.ruralops.platform.governance.domain.Village;

import java.util.UUID;

/**
 * Generates public Citizen IDs.
 *
 * RULES:
 * - Generated ONLY after VAO approval
 * - Format is deterministic; value includes randomness
 * - Village-scoped for governance clarity
 * - Guaranteed unique via database constraint
 *
 * Example:
 * RLOC-VLG-1098-A3F9K2
 */
public final class CitizenIdGenerator {

    private CitizenIdGenerator() {
        // Utility class
    }

    /**
     * Generates a public citizen ID for the given village.
     *
     * Village ID is assumed to be a stable, public governance identifier.
     */
    public static String generate(Village village) {

        String villageCode = village.getId();

        String randomSuffix = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 6)
                .toUpperCase();

        return "RLOC-" + villageCode + "-" + randomSuffix;
    }
}
