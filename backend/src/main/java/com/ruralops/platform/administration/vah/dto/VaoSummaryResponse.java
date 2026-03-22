package com.ruralops.platform.administration.vah.dto;

import com.ruralops.platform.common.enums.AccountStatus;

/**
 * Read-only summary view of a VAO account.
 *
 * Designed for:
 * - Status-check flows
 * - Administrative dashboards
 *
 * This DTO intentionally excludes sensitive information
 * such as email and phone number.
 */
public class VaoSummaryResponse {

    /**
     * Public VAO identifier.
     */
    private final String vaoId;

    /**
     * Identifier of the assigned village.
     */
    private final String villageId;

    /**
     * Name of the assigned village.
     */
    private final String villageName;

    /**
     * Identifier of the parent Mandal.
     */
    private final String mandalId;

    /**
     * Name of the parent Mandal.
     */
    private final String mandalName;

    /**
     * Current lifecycle status of the VAO account.
     */
    private final AccountStatus status;

    /**
     * Creates a new summary representation.
     */
    public VaoSummaryResponse(
            String vaoId,
            String villageId,
            String villageName,
            String mandalId,
            String mandalName,
            AccountStatus status
    ) {
        this.vaoId = vaoId;
        this.villageId = villageId;
        this.villageName = villageName;
        this.mandalId = mandalId;
        this.mandalName = mandalName;
        this.status = status;
    }

    public String getVaoId() {
        return vaoId;
    }

    public String getVillageId() {
        return villageId;
    }

    public String getVillageName() {
        return villageName;
    }

    public String getMandalId() {
        return mandalId;
    }

    public String getMandalName() {
        return mandalName;
    }

    public AccountStatus getStatus() {
        return status;
    }
}
