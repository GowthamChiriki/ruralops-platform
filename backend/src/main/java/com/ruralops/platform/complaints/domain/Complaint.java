package com.ruralops.platform.complaints.domain;

import com.ruralops.platform.citizen.account.domain.CitizenAccount;
import com.ruralops.platform.worker.domain.WorkerAccount;
import com.ruralops.platform.governance.domain.Area;
import com.ruralops.platform.governance.domain.Village;

import jakarta.persistence.*;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Represents a citizen-reported issue occurring within a village area.
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
 * The complaint stores operational and analytical information
 * required for governance monitoring, worker scoring,
 * and AI verification.
 */
@Entity
@Table(
        name = "complaints",
        indexes = {
                @Index(name = "idx_complaint_area",    columnList = "area_id"),
                @Index(name = "idx_complaint_worker",  columnList = "assigned_worker_id"),
                @Index(name = "idx_complaint_status",  columnList = "status"),
                @Index(name = "idx_complaint_created", columnList = "created_at")
        }
)
public class Complaint {

    /* ======================================================
       Primary Identifier
       ====================================================== */

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "complaint_id", nullable = false, unique = true, length = 50)
    private String complaintId;

    /* ======================================================
       Governance Anchors
       ====================================================== */

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "citizen_id", nullable = false)
    private CitizenAccount citizen;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "village_id", nullable = false)
    private Village village;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "area_id", nullable = false)
    private Area area;

    /* ======================================================
       Operational Assignment
       ====================================================== */

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_worker_id")
    private WorkerAccount assignedWorker;

    /* ======================================================
       Complaint Data
       ====================================================== */

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ComplaintCategory category;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(name = "before_image_url", length = 500)
    private String beforeImageUrl;

    @Column(name = "after_image_url", length = 500)
    private String afterImageUrl;

    /* ======================================================
       Lifecycle Status
       ====================================================== */

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ComplaintStatus status;

    /* ======================================================
       AI Verification Fields
       ====================================================== */

    @Column(name = "ai_clean_score")
    private Integer aiCleanScore;

    @Column(name = "ai_verified")
    private Boolean aiVerified = false;

    @Column(name = "worker_rating")
    private Integer workerRating;

    @Column(name = "vao_review_note", length = 1000)
    private String vaoReviewNote;

    /* ======================================================
       Operational Timeline
       ====================================================== */

    @Column(name = "created_at",  nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    protected Complaint() {}

    /**
     * Constructor used during complaint submission.
     */
    public Complaint(
            String complaintId,
            CitizenAccount citizen,
            Village village,
            Area area,
            ComplaintCategory category,
            String description,
            String beforeImageUrl
    ) {
        if (complaintId == null || complaintId.isBlank()) {
            throw new IllegalArgumentException("Complaint ID required");
        }

        this.complaintId   = complaintId;
        this.citizen       = citizen;
        this.village       = village;
        this.area          = area;
        this.category      = category;
        this.description   = normalize(description);
        this.beforeImageUrl = normalize(beforeImageUrl);

        this.status    = ComplaintStatus.SUBMITTED;
        this.createdAt = Instant.now();
    }

    /* ======================================================
       Domain Behavior
       ====================================================== */

    public void markAwaitingAssignment() {
        if (status != ComplaintStatus.SUBMITTED) {
            throw new IllegalStateException(
                    "Complaint cannot wait for assignment in state: " + status
            );
        }
        this.status = ComplaintStatus.AWAITING_ASSIGNMENT;
    }

    public void assignWorker(WorkerAccount worker) {
        if (status != ComplaintStatus.SUBMITTED &&
                status != ComplaintStatus.AWAITING_ASSIGNMENT) {
            throw new IllegalStateException(
                    "Worker cannot be assigned in state: " + status
            );
        }
        this.assignedWorker = worker;
        this.status         = ComplaintStatus.ASSIGNED;
        this.assignedAt     = Instant.now();
    }

    public void startWork() {
        if (status != ComplaintStatus.ASSIGNED) {
            throw new IllegalStateException(
                    "Work cannot start in state: " + status
            );
        }
        this.status    = ComplaintStatus.IN_PROGRESS;
        this.startedAt = Instant.now();
    }

    public void completeWork(String afterImageUrl) {
        if (status != ComplaintStatus.IN_PROGRESS) {
            throw new IllegalStateException(
                    "Work cannot complete in state: " + status
            );
        }
        this.afterImageUrl = normalize(afterImageUrl);
        this.status        = ComplaintStatus.RESOLVED;
        this.resolvedAt    = Instant.now();
    }

    public void recordAiVerification(int cleanScore) {
        if (cleanScore < 0 || cleanScore > 100) {
            throw new IllegalArgumentException(
                    "AI score must be between 0 and 100"
            );
        }
        this.aiCleanScore = cleanScore;
        this.aiVerified   = true;
        this.status       = ComplaintStatus.VERIFIED;
        this.verifiedAt   = Instant.now();
    }

    /**
     * Records the VAO's review note before or at the point of closure.
     *
     * May be called on a VERIFIED complaint before calling {@link #close()}.
     * Calling it after closure is not permitted — the complaint is archived
     * and should not be mutated.
     */
    public void recordVaoReviewNote(String note) {
        if (status == ComplaintStatus.CLOSED) {
            throw new IllegalStateException(
                    "Cannot update review note on a closed complaint"
            );
        }
        this.vaoReviewNote = normalize(note);
    }

    public void close() {
        if (status != ComplaintStatus.VERIFIED) {
            throw new IllegalStateException(
                    "Complaint cannot close before verification"
            );
        }
        this.status   = ComplaintStatus.CLOSED;
        this.closedAt = Instant.now();
    }

    /* ======================================================
       Analytics Helpers
       ====================================================== */

    public long getResolutionTimeMinutes() {
        if (createdAt == null || resolvedAt == null) return 0;
        return Duration.between(createdAt, resolvedAt).toMinutes();
    }

    public long getWorkerCompletionMinutes() {
        if (startedAt == null || resolvedAt == null) return 0;
        return Duration.between(startedAt, resolvedAt).toMinutes();
    }

    /* ======================================================
       Getters
       ====================================================== */

    public String getComplaintId()        { return complaintId; }
    public WorkerAccount getAssignedWorker() { return assignedWorker; }
    public ComplaintStatus getStatus()    { return status; }
    public Area getArea()                 { return area; }
    public Village getVillage()           { return village; }
    public CitizenAccount getCitizen()    { return citizen; }
    public Integer getAiCleanScore()      { return aiCleanScore; }
    public UUID getId()                   { return id; }
    public String getBeforeImageUrl()     { return beforeImageUrl; }
    public String getAfterImageUrl()      { return afterImageUrl; }
    public ComplaintCategory getCategory() { return category; }
    public String getDescription()        { return description; }
    public Boolean getAiVerified()        { return aiVerified; }
    public Integer getWorkerRating()      { return workerRating; }
    public String getVaoReviewNote()      { return vaoReviewNote; }
    public Instant getCreatedAt()         { return createdAt; }
    public Instant getAssignedAt()        { return assignedAt; }
    public Instant getStartedAt()         { return startedAt; }
    public Instant getResolvedAt()        { return resolvedAt; }
    public Instant getVerifiedAt()        { return verifiedAt; }
    public Instant getClosedAt()          { return closedAt; }

    /* ======================================================
       Helpers
       ====================================================== */

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}