package com.ruralops.platform.complaints.dto;

import com.ruralops.platform.complaints.domain.ComplaintCategory;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload used by citizens to submit a new complaint.
 *
 * The platform automatically determines:
 * - village (from citizen account)
 * - worker assignment (via routing system)
 * - complaint ID generation
 * - timestamps and lifecycle state
 *
 * Citizens only provide the minimal information needed
 * to report the issue.
 */
public class CreateComplaintRequest {

    /**
     * Area where the issue occurred.
     */
    @NotNull(message = "Area is required")
    private Long areaId;

    /**
     * Category of the reported issue.
     */
    @NotNull(message = "Complaint category is required")
    private ComplaintCategory category;

    /**
     * Citizen description of the issue.
     */
    @NotBlank(message = "Description is required")
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    /**
     * URL of the uploaded image showing the issue.
     *
     * This image becomes the baseline reference
     * for AI verification later.
     */
    @NotBlank(message = "Before image is required")
    @Size(max = 1000, message = "Image URL too long")
    private String beforeImageUrl;

    /**
     * Optional GPS latitude captured during submission.
     * Helps improve routing accuracy.
     */
    private Double latitude;

    /**
     * Optional GPS longitude captured during submission.
     */
    private Double longitude;

    /**
     * Default constructor required for JSON deserialization.
     */
    protected CreateComplaintRequest() {}

    /**
     * Constructor used for tests or internal calls.
     */
    public CreateComplaintRequest(
            Long areaId,
            ComplaintCategory category,
            String description,
            String beforeImageUrl,
            Double latitude,
            Double longitude
    ) {
        this.areaId = areaId;
        this.category = category;
        this.description = normalize(description);
        this.beforeImageUrl = normalize(beforeImageUrl);
        this.latitude = latitude;
        this.longitude = longitude;
    }

    /* =====================================================
       Getters
       ===================================================== */

    public Long getAreaId() {
        return areaId;
    }

    public ComplaintCategory getCategory() {
        return category;
    }

    public String getDescription() {
        return description;
    }

    public String getBeforeImageUrl() {
        return beforeImageUrl;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    /* =====================================================
       Helpers
       ===================================================== */

    /**
     * Normalize user input by trimming whitespace.
     */
    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}