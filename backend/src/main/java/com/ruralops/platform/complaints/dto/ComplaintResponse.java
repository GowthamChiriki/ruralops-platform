package com.ruralops.platform.complaints.dto;

import com.ruralops.platform.complaints.domain.Complaint;
import com.ruralops.platform.complaints.domain.ComplaintCategory;
import com.ruralops.platform.complaints.domain.ComplaintStatus;

import java.time.Instant;

public class ComplaintResponse {

    private final String complaintId;
    private final String citizenId;
    private final String villageId;
    private final String villageName;
    private final Long areaId;
    private final String areaName;
    private final String workerId;
    private final String workerName;
    private final ComplaintCategory category;
    private final String description;
    private final String beforeImageUrl;
    private final String afterImageUrl;
    private final ComplaintStatus status;

    private final Integer aiCleanScore;
    private final Boolean aiVerified;

    private final Integer workerRating;
    private final String vaoReviewNote;

    private final Instant createdAt;
    private final Instant assignedAt;
    private final Instant startedAt;
    private final Instant resolvedAt;
    private final Instant verifiedAt;
    private final Instant closedAt;

    public ComplaintResponse(
            String complaintId,
            String citizenId,
            String villageId,
            String villageName,
            Long areaId,
            String areaName,
            String workerId,
            String workerName,
            ComplaintCategory category,
            String description,
            String beforeImageUrl,
            String afterImageUrl,
            ComplaintStatus status,
            Integer aiCleanScore,
            Boolean aiVerified,
            Integer workerRating,
            String vaoReviewNote,
            Instant createdAt,
            Instant assignedAt,
            Instant startedAt,
            Instant resolvedAt,
            Instant verifiedAt,
            Instant closedAt
    ) {
        this.complaintId = complaintId;
        this.citizenId = citizenId;
        this.villageId = villageId;
        this.villageName = villageName;
        this.areaId = areaId;
        this.areaName = areaName;
        this.workerId = workerId;
        this.workerName = workerName;
        this.category = category;
        this.description = description;
        this.beforeImageUrl = beforeImageUrl;
        this.afterImageUrl = afterImageUrl;
        this.status = status;
        this.aiCleanScore = aiCleanScore;
        this.aiVerified = aiVerified;
        this.workerRating = workerRating;
        this.vaoReviewNote = vaoReviewNote;
        this.createdAt = createdAt;
        this.assignedAt = assignedAt;
        this.startedAt = startedAt;
        this.resolvedAt = resolvedAt;
        this.verifiedAt = verifiedAt;
        this.closedAt = closedAt;
    }

    public static ComplaintResponse from(Complaint complaint) {

        String workerId = null;
        String workerName = null;

        if (complaint.getAssignedWorker() != null) {
            workerId = complaint.getAssignedWorker().getWorkerId();
            workerName = complaint.getAssignedWorker().getName();
        }

        return new ComplaintResponse(
                complaint.getComplaintId(),

                complaint.getCitizen() != null
                        ? complaint.getCitizen().getCitizenId()
                        : null,

                complaint.getVillage() != null
                        ? complaint.getVillage().getId()
                        : null,

                complaint.getVillage() != null
                        ? complaint.getVillage().getName()
                        : null,

                complaint.getArea() != null
                        ? complaint.getArea().getId()
                        : null,

                complaint.getArea() != null
                        ? complaint.getArea().getName()
                        : null,

                workerId,
                workerName,

                complaint.getCategory(),

                complaint.getDescription(),

                complaint.getBeforeImageUrl(),

                complaint.getAfterImageUrl(),

                complaint.getStatus(),

                complaint.getAiCleanScore(),

                complaint.getAiCleanScore() != null,

                complaint.getWorkerRating(),

                complaint.getVaoReviewNote(),

                complaint.getCreatedAt(),

                complaint.getAssignedAt(),

                complaint.getStartedAt(),

                complaint.getResolvedAt(),

                complaint.getVerifiedAt(),

                complaint.getClosedAt()
        );
    }

    public String getComplaintId() { return complaintId; }
    public String getCitizenId() { return citizenId; }
    public String getVillageId() { return villageId; }
    public String getVillageName() { return villageName; }
    public Long getAreaId() { return areaId; }
    public String getAreaName() { return areaName; }
    public String getWorkerId() { return workerId; }
    public String getWorkerName() { return workerName; }
    public ComplaintCategory getCategory() { return category; }
    public String getDescription() { return description; }
    public String getBeforeImageUrl() { return beforeImageUrl; }
    public String getAfterImageUrl() { return afterImageUrl; }
    public ComplaintStatus getStatus() { return status; }
    public Integer getAiCleanScore() { return aiCleanScore; }
    public Boolean getAiVerified() { return aiVerified; }
    public Integer getWorkerRating() { return workerRating; }
    public String getVaoReviewNote() { return vaoReviewNote; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getAssignedAt() { return assignedAt; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getResolvedAt() { return resolvedAt; }
    public Instant getVerifiedAt() { return verifiedAt; }
    public Instant getClosedAt() { return closedAt; }
}