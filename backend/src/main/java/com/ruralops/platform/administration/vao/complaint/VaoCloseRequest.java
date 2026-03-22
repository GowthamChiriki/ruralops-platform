package com.ruralops.platform.administration.vao.complaint;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Size;

/**
 * Optional request body for the VAO complaint close endpoint.
 *
 * POST /vao/complaints/{complaintId}/close
 *
 * The entire body is optional. If supplied, {@code reviewNote} is
 * recorded on the complaint and surfaced in the complaint response
 * and any downstream audit trail.
 *
 * Example:
 * {
 *   "reviewNote": "Verified on site — area confirmed clean."
 * }
 */
public class VaoCloseRequest {

    @Size(max = 1000, message = "Review note must not exceed 1000 characters")
    private final String reviewNote;

    @JsonCreator
    public VaoCloseRequest(
            @JsonProperty("reviewNote") String reviewNote
    ) {
        this.reviewNote = reviewNote == null ? null : reviewNote.trim();
    }

    public String getReviewNote() {
        return reviewNote;
    }
}