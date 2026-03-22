package com.ruralops.platform.worker.dto;

import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.worker.domain.WorkerAccount;

/**
 * Read-only summary view of a Worker account.
 *
 * Designed for:
 * - Status-check flows
 * - Administrative dashboards
 * - VAO worker management panels
 */
public class WorkerSummaryResponse {

    private final String workerId;
    private final String name;

    private final String villageId;
    private final String villageName;

    private final Long areaId;
    private final String areaName;

    private final AccountStatus status;

    public WorkerSummaryResponse(
            String workerId,
            String name,
            String villageId,
            String villageName,
            Long areaId,
            String areaName,
            AccountStatus status
    ) {
        this.workerId = workerId;
        this.name = name;
        this.villageId = villageId;
        this.villageName = villageName;
        this.areaId = areaId;
        this.areaName = areaName;
        this.status = status;
    }

    /* ======================================================
       Factory
       ====================================================== */

    public static WorkerSummaryResponse from(WorkerAccount worker) {

        return new WorkerSummaryResponse(
                worker.getWorkerId(),
                worker.getName(),
                worker.getVillage().getId(),
                worker.getVillage().getName(),
                worker.getArea().getId(),
                worker.getArea().getName(),
                worker.getStatus()
        );
    }

    /* ======================================================
       Getters
       ====================================================== */

    public String getWorkerId() {
        return workerId;
    }

    public String getName() {
        return name;
    }

    public String getVillageId() {
        return villageId;
    }

    public String getVillageName() {
        return villageName;
    }

    public Long getAreaId() {
        return areaId;
    }

    public String getAreaName() {
        return areaName;
    }

    public AccountStatus getStatus() {
        return status;
    }
}