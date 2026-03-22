package com.ruralops.platform.administration.vao.dto;

/**
 * Read-only dashboard response returned to VAO clients.
 *
 * This DTO aggregates operational statistics from
 * multiple subsystems (citizens, workers, complaints).
 */
public class VaoDashboardResponse {

    private final String vaoId;
    private final String vaoName;
    private final String villageName;

    /* =========================
       Citizen metrics
       ========================= */

    private final long totalCitizens;
    private final long pendingCitizenApprovals;

    /* =========================
       Worker metrics
       ========================= */

    private final long workersInVillage;

    /* =========================
       Complaint metrics
       ========================= */

    private final long complaintsPending;

    public VaoDashboardResponse(
            String vaoId,
            String vaoName,
            String villageName,
            long totalCitizens,
            long pendingCitizenApprovals,
            long workersInVillage,
            long complaintsPending
    ) {
        this.vaoId = vaoId;
        this.vaoName = vaoName;
        this.villageName = villageName;
        this.totalCitizens = totalCitizens;
        this.pendingCitizenApprovals = pendingCitizenApprovals;
        this.workersInVillage = workersInVillage;
        this.complaintsPending = complaintsPending;
    }

    public String getVaoId() {
        return vaoId;
    }

    public String getVaoName() {
        return vaoName;
    }

    public String getVillageName() {
        return villageName;
    }

    public long getTotalCitizens() {
        return totalCitizens;
    }

    public long getPendingCitizenApprovals() {
        return pendingCitizenApprovals;
    }

    public long getWorkersInVillage() {
        return workersInVillage;
    }

    public long getComplaintsPending() {
        return complaintsPending;
    }
}