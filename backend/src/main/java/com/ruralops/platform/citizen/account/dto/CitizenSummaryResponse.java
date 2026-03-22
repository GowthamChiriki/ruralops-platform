package com.ruralops.platform.citizen.account.dto;

import com.ruralops.platform.common.enums.AccountStatus;

import java.util.UUID;

/**
 * Read-only summary representation of a Citizen account.
 *
 * Used by:
 * - VAO dashboards
 * - Public status check
 * - Administrative systems
 */
public class CitizenSummaryResponse {

    /**
     * Internal database identifier.
     * Used only by internal dashboards.
     */
    private final UUID citizenInternalId;

    /**
     * Public citizen identifier.
     * Generated only after VAO approval.
     */
    private final String citizenId;

    /* =======================
       Personal details
       ======================= */

    private final String fullName;
    private final String fatherName;

    /* =======================
       Contact details
       ======================= */

    private final String phoneNumber;
    private final String email;

    /* =======================
       Location context
       ======================= */

    private final String villageId;
    private final String villageName;
    private final String mandalId;
    private final String mandalName;

    /* =======================
       Approval & lifecycle
       ======================= */

    private final String approvedByVaoId;

    private final AccountStatus status;

    /* =======================
       Client guidance
       ======================= */

    private final boolean canActivate;

    private final NextAction nextAction;

    public CitizenSummaryResponse(
            UUID citizenInternalId,
            String citizenId,
            String fullName,
            String fatherName,
            String phoneNumber,
            String email,
            String villageId,
            String villageName,
            String mandalId,
            String mandalName,
            String approvedByVaoId,
            AccountStatus status,
            boolean canActivate,
            NextAction nextAction
    ) {
        this.citizenInternalId = citizenInternalId;
        this.citizenId = citizenId;
        this.fullName = fullName;
        this.fatherName = fatherName;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.villageId = villageId;
        this.villageName = villageName;
        this.mandalId = mandalId;
        this.mandalName = mandalName;
        this.approvedByVaoId = approvedByVaoId;
        this.status = status;
        this.canActivate = canActivate;
        this.nextAction = nextAction;
    }

    /* =======================
       Getters
       ======================= */

    public UUID getCitizenInternalId() {
        return citizenInternalId;
    }

    public String getCitizenId() {
        return citizenId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getFatherName() {
        return fatherName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getEmail() {
        return email;
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

    public String getApprovedByVaoId() {
        return approvedByVaoId;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public boolean getCanActivate() {
        return canActivate;
    }

    public NextAction getNextAction() {
        return nextAction;
    }

    /* =======================
       Client action enum
       ======================= */

    public enum NextAction {
        WAIT_FOR_APPROVAL,
        REQUEST_ACTIVATION,
        ACCOUNT_ACTIVE,
        CONTACT_SUPPORT
    }
}