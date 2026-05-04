package com.ruralops.platform.complaints.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request payload used by workers to mark an assigned complaint
 * as resolved, supplying the after-image URL as evidence.
 *
 * Workflow:
 *
 * 1. Worker uploads AFTER image using the storage API:
 *       POST /worker/files/attachment
 *
 * 2. Storage API returns the Cloudinary-stored image URL.
 *
 * 3. Worker calls:
 *       PATCH /workers/complaints/{complaintId}/complete
 *    with this body.
 *
 * 4. The controller binds the complaintId from the URL path via
 *    {@link #withComplaintId(String)}, so the body's complaintId
 *    field is optional and always overridden by the path value.
 *    This prevents a worker from redirecting their completion to a
 *    complaint they do not own.
 *
 * 5. Complaint lifecycle transitions: IN_PROGRESS → RESOLVED.
 *
 * 6. AI verification pipeline runs afterwards.
 *
 * Normalization:
 *
 * All string fields are trimmed on construction. The {@link JsonCreator}
 * constructor is used by Jackson for deserialization, so trimming is
 * guaranteed regardless of how the object is created.
 */
public class WorkerUpdateRequest {

    /**
     * Public complaint identifier.
     *
     * Set by the controller from the URL path, not the request body.
     * See {@link #withComplaintId(String)}.
     */
    @NotBlank(message = "Complaint ID is required")
    @Size(max = 50, message = "Complaint ID too long")
    private final String complaintId;

    /**
     * URL of the uploaded AFTER image.
     *
     * Must reference a file stored through the Cloudinary storage service.
     * The URL must begin with the Cloudinary base URL to prevent workers
     * from pointing to arbitrary external URLs.
     *
     * FIX: Previous regex anchored to /uploads/(complaints|workers)/ path
     * segment which does not exist in Cloudinary URLs. Updated to match
     * the actual Cloudinary URL format returned by CloudinaryService.
     */
    @NotBlank(message = "After image is required")
    @Size(max = 1000, message = "Image URL too long")
    @Pattern(
            regexp = "https://res\\.cloudinary\\.com/.+",
            message = "After image must be a valid system-stored upload URL"
    )
    private final String afterImageUrl;

    /**
     * Optional notes describing the work done.
     *
     * Example: "Garbage removed and street washed"
     */
    @Size(max = 1000, message = "Worker notes too long")
    private final String workerNotes;

    /**
     * Primary constructor used by Jackson for deserialization and by
     * application code.
     *
     * FIX: Previously a protected no-arg constructor was used for
     * deserialization, which meant Jackson set fields directly and
     * bypassed normalize(). Using @JsonCreator ensures trimming runs
     * on every deserialized instance.
     */
    @JsonCreator
    public WorkerUpdateRequest(
            @JsonProperty("complaintId")   String complaintId,
            @JsonProperty("afterImageUrl") String afterImageUrl,
            @JsonProperty("workerNotes")   String workerNotes
    ) {
        this.complaintId   = normalize(complaintId);
        this.afterImageUrl = normalize(afterImageUrl);
        this.workerNotes   = normalize(workerNotes);
    }

    /**
     * Returns a new instance with the complaintId replaced by the value
     * taken from the URL path.
     *
     * Called by the controller to bind the authoritative identifier from
     * the request path, ensuring the body cannot override which complaint
     * is being completed.
     */
    public WorkerUpdateRequest withComplaintId(String complaintId) {
        return new WorkerUpdateRequest(complaintId, this.afterImageUrl, this.workerNotes);
    }

    /* =====================================================
       Getters
       ===================================================== */

    public String getComplaintId() {
        return complaintId;
    }

    public String getAfterImageUrl() {
        return afterImageUrl;
    }

    public String getWorkerNotes() {
        return workerNotes;
    }

    /* =====================================================
       Helpers
       ===================================================== */

    private static String normalize(String value) {
        return value == null ? null : value.trim();
    }
}