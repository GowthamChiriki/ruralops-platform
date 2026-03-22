package com.ruralops.platform.complaints.service;

import com.ruralops.platform.complaints.domain.Complaint;
import com.ruralops.platform.complaints.dto.CreateComplaintRequest;
import com.ruralops.platform.complaints.repository.ComplaintRepository;
import com.ruralops.platform.complaints.util.ComplaintIdGenerator;

import com.ruralops.platform.governance.domain.Area;
import com.ruralops.platform.governance.repository.AreaRepository;

import com.ruralops.platform.citizen.account.domain.CitizenAccount;

import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;
import com.ruralops.platform.common.exception.RoutingException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles submission of complaints by citizens.
 *
 * Workflow:
 *
 * Citizen → Submit complaint
 * System  → Validate area
 * System  → Generate complaint ID
 * System  → Persist complaint
 * System  → Attempt routing
 *
 * Routing failure handling:
 *
 * - RoutingException (no worker for area) → expected; complaint stays
 *   in AWAITING_ASSIGNMENT and appears on the VAO dashboard.
 *
 * - Any other exception from the routing layer → unexpected; re-thrown
 *   so the caller sees a real error instead of silently swallowing it.
 *   The complaint is NOT persisted in this case because the transaction
 *   rolls back.
 *
 * Transaction note:
 *
 * ComplaintRoutingService.routeComplaint runs in the same transaction
 * (REQUIRED propagation). If an unexpected exception escapes, the whole
 * transaction rolls back — including the initial save — so no partially-
 * routed complaint is left behind.
 */
@Service
public class ComplaintSubmissionService {

    private static final Logger log =
            LoggerFactory.getLogger(ComplaintSubmissionService.class);

    private final ComplaintRepository complaintRepository;
    private final AreaRepository areaRepository;
    private final ComplaintRoutingService complaintRoutingService;

    public ComplaintSubmissionService(
            ComplaintRepository complaintRepository,
            AreaRepository areaRepository,
            ComplaintRoutingService complaintRoutingService
    ) {
        this.complaintRepository = complaintRepository;
        this.areaRepository = areaRepository;
        this.complaintRoutingService = complaintRoutingService;
    }

    /**
     * Submits a new complaint.
     */
    @Transactional(noRollbackFor = RoutingException.class)
    public Complaint submitComplaint(
            CitizenAccount citizen,
            CreateComplaintRequest request
    ) {

        /* =====================================================
           1. Validate Area
           ===================================================== */

        Area area = areaRepository
                .findById(request.getAreaId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Area not found: " + request.getAreaId()
                        )
                );

        /* =====================================================
           2. Ensure citizen belongs to the same village
           ===================================================== */

        if (!citizen.getVillage().getId()
                .equals(area.getVillage().getId())) {

            throw new InvalidRequestException(
                    "Citizen cannot submit complaints outside their village"
            );
        }

        /* =====================================================
           3. Generate complaint ID
           ===================================================== */

        String complaintId =
                ComplaintIdGenerator.generate(area.getVillage());

        /* =====================================================
           4. Create complaint
           ===================================================== */

        Complaint complaint = new Complaint(
                complaintId,
                citizen,
                area.getVillage(),
                area,
                request.getCategory(),
                normalize(request.getDescription()),
                normalize(request.getBeforeImageUrl())
        );

        /* =====================================================
           5. Persist complaint
           ===================================================== */

        complaintRepository.saveAndFlush(complaint);

        /* =====================================================
           6. Attempt automatic routing
           ===================================================== */

        try {
            complaintRoutingService.routeComplaint(complaint);

        } catch (RoutingException ex) {
            /*
             * Expected: no worker is assigned to this area yet.
             * The complaint remains in AWAITING_ASSIGNMENT state
             * and will appear on the VAO dashboard for manual action.
             */
            log.warn(
                    "Complaint {} saved but could not be routed: {}",
                    complaint.getComplaintId(),
                    ex.getMessage()
            );

        } catch (Exception ex) {
            /*
             * Unexpected: database error, null reference, etc.
             * Re-throw so the transaction rolls back and the caller
             * receives a real error rather than a phantom complaint.
             */
            log.error(
                    "Unexpected error routing complaint {}: {}",
                    complaint.getComplaintId(),
                    ex.getMessage(),
                    ex
            );
            throw ex;
        }

        return complaint;
    }

    /* =====================================================
       Helpers
       ===================================================== */

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}