package com.ruralops.platform.administration.vao.complaint;

import com.ruralops.platform.complaints.domain.Complaint;
import com.ruralops.platform.complaints.domain.ComplaintStatus;
import com.ruralops.platform.complaints.repository.ComplaintRepository;

import com.ruralops.platform.common.exception.ResourceNotFoundException;
import com.ruralops.platform.common.exception.InvalidRequestException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VaoComplaintAdministrationService {

    private final ComplaintRepository complaintRepository;

    public VaoComplaintAdministrationService(
            ComplaintRepository complaintRepository
    ) {
        this.complaintRepository = complaintRepository;
    }

    /**
     * Closes a VERIFIED complaint.
     *
     * If the caller supplies a {@link VaoCloseRequest}, the review note
     * is recorded on the complaint before closing so it appears in the
     * complaint response and audit trail.
     *
     * The domain's {@code close()} method enforces that the complaint
     * must be in VERIFIED state — the explicit status check here is an
     * early guard that produces a clearer error message before reaching
     * the domain invariant.
     *
     * @param complaintId public complaint identifier
     * @param request     optional body carrying a VAO review note
     */
    @Transactional
    public void closeComplaint(String complaintId, VaoCloseRequest request) {

        Complaint complaint = complaintRepository
                .findByComplaintId(complaintId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Complaint not found: " + complaintId
                        )
                );

        if (complaint.getStatus() != ComplaintStatus.VERIFIED) {
            throw new InvalidRequestException(
                    "Complaint must be VERIFIED before closing. Current state: "
                            + complaint.getStatus()
            );
        }

        if (request != null && request.getReviewNote() != null) {
            complaint.recordVaoReviewNote(request.getReviewNote());
        }

        complaint.close();
    }
}