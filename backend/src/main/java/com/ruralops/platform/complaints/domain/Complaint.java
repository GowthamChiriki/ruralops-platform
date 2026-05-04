package com.ruralops.platform.complaints.domain;

import com.ruralops.platform.citizen.account.domain.CitizenAccount;
import com.ruralops.platform.worker.domain.WorkerAccount;
import com.ruralops.platform.governance.domain.Area;
import com.ruralops.platform.governance.domain.Village;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "complaints",
        indexes = {
                @Index(name = "idx_complaint_area", columnList = "area_id"),
                @Index(name = "idx_complaint_worker", columnList = "assigned_worker_id"),
                @Index(name = "idx_complaint_status", columnList = "status"),
                @Index(name = "idx_complaint_created", columnList = "created_at")
        }
)
public class Complaint {

    /* =========================
       PRIMARY KEY
       ========================= */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "complaint_id", nullable = false, unique = true, length = 50)
    private String complaintId;

    /* =========================
       RELATIONS
       ========================= */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "citizen_id", nullable = false)
    private CitizenAccount citizen;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "village_id", nullable = false)
    private Village village;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "area_id", nullable = false)
    private Area area;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_worker_id")
    private WorkerAccount assignedWorker;

    /* =========================
       CORE DATA
       ========================= */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ComplaintCategory category;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(name = "before_image_url", length = 500)
    private String beforeImageUrl;

    @Column(name = "after_image_url", length = 500)
    private String afterImageUrl;

    /* =========================
       STATUS
       ========================= */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ComplaintStatus status;

    /* =========================
       AI FIELDS
       ========================= */
    @Column(name = "ai_clean_score")
    private Integer aiCleanScore;

    @Column(name = "ai_processed_at")
    private Instant aiProcessedAt;

    /* =========================
       GOVERNANCE
       ========================= */
    @Column(name = "worker_rating")
    private Integer workerRating;

    @Column(name = "vao_review_note", length = 1000)
    private String vaoReviewNote;

    /* =========================
       TIMELINE
       ========================= */
    @Column(name = "created_at", nullable = false, updatable = false)
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

    /* =========================
       CONSTRUCTOR
       ========================= */
    protected Complaint() {}

    public Complaint(
            String complaintId,
            CitizenAccount citizen,
            Village village,
            Area area,
            ComplaintCategory category,
            String description,
            String beforeImageUrl
    ) {
        this.complaintId = complaintId;
        this.citizen = citizen;
        this.village = village;
        this.area = area;
        this.category = category;
        this.description = normalize(description);
        this.beforeImageUrl = normalize(beforeImageUrl);
        this.status = ComplaintStatus.SUBMITTED;
        this.createdAt = Instant.now();
    }

    /* =========================
       BUSINESS LOGIC
       ========================= */

    public void markAwaitingAssignment() {
        ensureNotClosed();

        if (status != ComplaintStatus.SUBMITTED) {
            throw new IllegalStateException("Invalid state: " + status);
        }

        this.status = ComplaintStatus.AWAITING_ASSIGNMENT;
    }

    public void recordVaoReviewNote(String note) {
        ensureNotClosed();

        this.vaoReviewNote = normalize(note);
    }

    public void assignWorker(WorkerAccount worker) {
        ensureNotClosed();

        if (worker == null) {
            throw new IllegalArgumentException("Worker cannot be null");
        }

        if (status != ComplaintStatus.SUBMITTED &&
                status != ComplaintStatus.AWAITING_ASSIGNMENT) {
            throw new IllegalStateException("Invalid state: " + status);
        }

        this.assignedWorker = worker;
        this.status = ComplaintStatus.ASSIGNED;
        this.assignedAt = Instant.now();
    }

    public void startWork() {
        ensureNotClosed();

        if (status != ComplaintStatus.ASSIGNED) {
            throw new IllegalStateException("Invalid state: " + status);
        }

        this.status = ComplaintStatus.IN_PROGRESS;
        this.startedAt = Instant.now();
    }

    public void completeWork(String afterImageUrl) {
        ensureNotClosed();

        if (status != ComplaintStatus.IN_PROGRESS) {
            throw new IllegalStateException("Invalid state: " + status);
        }

        if (afterImageUrl == null || afterImageUrl.isBlank()) {
            throw new IllegalArgumentException("After image required");
        }

        this.afterImageUrl = normalize(afterImageUrl);
        this.status = ComplaintStatus.RESOLVED;
        this.resolvedAt = Instant.now();
    }

    public void recordAiVerification(int cleanScore) {
        ensureNotClosed();

        if (status != ComplaintStatus.RESOLVED) {
            throw new IllegalStateException("AI verification only after RESOLVED");
        }

        if (cleanScore < 0 || cleanScore > 100) {
            throw new IllegalArgumentException("Score must be 0–100");
        }

        this.aiCleanScore = cleanScore;
        this.aiProcessedAt = Instant.now();
    }

    public void markVerified() {
        ensureNotClosed();

        if (status != ComplaintStatus.RESOLVED) {
            throw new IllegalStateException("Must be RESOLVED first");
        }

        this.status = ComplaintStatus.VERIFIED;
        this.verifiedAt = Instant.now();
    }

    public void close() {
        ensureNotClosed();

        if (status != ComplaintStatus.VERIFIED) {
            throw new IllegalStateException("Must be VERIFIED first");
        }

        this.status = ComplaintStatus.CLOSED;
        this.closedAt = Instant.now();
    }

    /* =========================
       HELPERS
       ========================= */

    private void ensureNotClosed() {
        if (status == ComplaintStatus.CLOSED) {
            throw new IllegalStateException("Closed complaint cannot change");
        }
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    /* =========================
       GETTERS
       ========================= */

    public String getComplaintId() { return complaintId; }

    public CitizenAccount getCitizen() { return citizen; }

    public Village getVillage() { return village; }

    public Area getArea() { return area; }

    public WorkerAccount getAssignedWorker() { return assignedWorker; }

    public ComplaintCategory getCategory() { return category; }

    public String getDescription() { return description; }

    public String getBeforeImageUrl() { return beforeImageUrl; }

    public String getAfterImageUrl() { return afterImageUrl; }

    public ComplaintStatus getStatus() { return status; }

    public Integer getAiCleanScore() { return aiCleanScore; }

    public Integer getWorkerRating() { return workerRating; }

    public String getVaoReviewNote() { return vaoReviewNote; }

    public Instant getCreatedAt() { return createdAt; }

    public Instant getAssignedAt() { return assignedAt; }

    public Instant getStartedAt() { return startedAt; }

    public Instant getResolvedAt() { return resolvedAt; }

    public Instant getVerifiedAt() { return verifiedAt; }

    public Instant getClosedAt() { return closedAt; }
}