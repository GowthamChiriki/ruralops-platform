package com.ruralops.platform.complaints.repository;

import com.ruralops.platform.complaints.domain.Complaint;
import com.ruralops.platform.complaints.domain.ComplaintStatus;
import com.ruralops.platform.citizen.account.domain.CitizenAccount;

import com.ruralops.platform.governance.domain.Area;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository responsible for accessing Complaint data.
 *
 * Used for:
 * - citizen complaint tracking
 * - worker task dashboards
 * - VAO village monitoring
 * - operational analytics
 */
public interface ComplaintRepository
        extends JpaRepository<Complaint, UUID> {

    /* =====================================================
       Public Complaint ID
       ===================================================== */

    Optional<Complaint> findByComplaintId(String complaintId);

    boolean existsByComplaintId(String complaintId);


    /* =====================================================
       Citizen queries
       ===================================================== */

    List<Complaint> findByCitizen_Id(UUID citizenId);

    List<Complaint> findByCitizen_IdAndStatus(
            UUID citizenId,
            ComplaintStatus status
    );

    long countByCitizen_Id(UUID citizenId);

    long countByCitizen_IdAndStatus(
            UUID citizenId,
            ComplaintStatus status
    );

    /* Better service-layer usage */

    List<Complaint> findByCitizen(CitizenAccount citizen);

    List<Complaint> findByCitizenAndStatus(
            CitizenAccount citizen,
            ComplaintStatus status
    );

    /* Citizen timeline */

    List<Complaint> findByCitizen_IdOrderByCreatedAtDesc(UUID citizenId);


    /* =====================================================
       Worker dashboard queries
       ===================================================== */

    List<Complaint> findByAssignedWorker_WorkerId(String workerId);

    List<Complaint> findByAssignedWorker_WorkerIdAndStatus(
            String workerId,
            ComplaintStatus status
    );

    long countByAssignedWorker_WorkerId(String workerId);

    long countByAssignedWorker_WorkerIdAndStatus(
            String workerId,
            ComplaintStatus status
    );


    /* =====================================================
       Area analytics
       ===================================================== */

    List<Complaint> findByArea_Id(Long areaId);

    List<Complaint> findByArea_IdAndStatus(
            Long areaId,
            ComplaintStatus status
    );

    long countByArea_Id(Long areaId);

    long countByArea_IdAndStatus(
            Long areaId,
            ComplaintStatus status
    );


    /* =====================================================
       Village monitoring (VAO dashboard)
       ===================================================== */

    List<Complaint> findByVillage_Id(String villageId);

    List<Complaint> findByVillage_IdAndStatus(
            String villageId,
            ComplaintStatus status
    );

    long countByVillage_Id(String villageId);

    long countByVillage_IdAndStatus(
            String villageId,
            ComplaintStatus status
    );


    /* =====================================================
       Complaints awaiting worker assignment
       ===================================================== */

    List<Complaint> findByAssignedWorkerIsNull();

    List<Complaint> findByVillage_IdAndAssignedWorkerIsNull(String villageId);


    /* =====================================================
       Global status queries
       ===================================================== */

    List<Complaint> findByStatus(ComplaintStatus status);

    long countByStatus(ComplaintStatus status);


    /* =====================================================
       AI Verification Queue
       ===================================================== */

    List<Complaint> findByStatusAndAiCleanScoreIsNull(ComplaintStatus status);

    long countByStatusAndAiCleanScoreIsNull(ComplaintStatus status);

    List<Complaint> findByAreaAndAssignedWorkerIsNull(Area area);

}