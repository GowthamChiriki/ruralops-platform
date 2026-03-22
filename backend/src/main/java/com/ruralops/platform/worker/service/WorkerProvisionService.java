package com.ruralops.platform.worker.service;

import com.ruralops.platform.administration.vah.domain.VaoAccount;
import com.ruralops.platform.administration.vah.repository.VaoAccountRepository;

import com.ruralops.platform.auth.entity.User;
import com.ruralops.platform.auth.repository.UserRepository;

import com.ruralops.platform.auth.service.RoleService;
import com.ruralops.platform.worker.domain.WorkerAccount;
import com.ruralops.platform.worker.repository.WorkerAccountRepository;

import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.common.exception.GovernanceViolationException;
import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;

import com.ruralops.platform.governance.domain.Village;
import com.ruralops.platform.governance.domain.Area;
import com.ruralops.platform.governance.repository.AreaRepository;

import com.ruralops.platform.secure.activation.service.ActivationRequestService;
import com.ruralops.platform.complaints.service.ComplaintRoutingService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class WorkerProvisionService {

    private final WorkerAccountRepository workerAccountRepository;
    private final VaoAccountRepository vaoAccountRepository;
    private final AreaRepository areaRepository;
    private final UserRepository userRepository;
    private final ActivationRequestService activationRequestService;
    private final ComplaintRoutingService complaintRoutingService;
    private final RoleService roleService;

    public WorkerProvisionService(
            WorkerAccountRepository workerAccountRepository,
            VaoAccountRepository vaoAccountRepository,
            AreaRepository areaRepository,
            UserRepository userRepository,
            ActivationRequestService activationRequestService,
            ComplaintRoutingService complaintRoutingService,
            RoleService roleService
    ) {
        this.workerAccountRepository = workerAccountRepository;
        this.vaoAccountRepository = vaoAccountRepository;
        this.areaRepository = areaRepository;
        this.userRepository = userRepository;
        this.activationRequestService = activationRequestService;
        this.complaintRoutingService = complaintRoutingService;
        this.roleService = roleService;
    }

    @Transactional
    public WorkerAccount provisionWorker(
            UUID userId,
            String name,
            String email,
            String phoneNumber,
            Long areaId
    ) {

        /* -------------------------
           Normalize inputs
        ------------------------- */

        String normalizedName  = normalize(name);
        String normalizedEmail = normalize(email).toLowerCase();
        String normalizedPhone = normalize(phoneNumber);

        /* -------------------------
           Resolve VAO identity
        ------------------------- */

        VaoAccount vao = vaoAccountRepository
                .findByUserId(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "VAO not found for user: " + userId
                        )
                );

        if (vao.getStatus() != AccountStatus.ACTIVE) {
            throw new GovernanceViolationException(
                    "Only ACTIVE VAOs can provision workers"
            );
        }

        Village village = vao.getVillage();

        /* -------------------------
           Validate Area
        ------------------------- */

        Area area = areaRepository
                .findById(areaId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Area not found: " + areaId
                        )
                );

        if (!area.getVillage().getId().equals(village.getId())) {
            throw new GovernanceViolationException(
                    "Area does not belong to VAO's village"
            );
        }

        /* -------------------------
           Worker uniqueness checks
        ------------------------- */

        if (workerAccountRepository.existsByEmail(normalizedEmail)) {
            throw new InvalidRequestException("Email already in use");
        }

        if (workerAccountRepository.existsByPhoneNumber(normalizedPhone)) {
            throw new InvalidRequestException("Phone number already used by another worker");
        }

        /* -------------------------
           Resolve authentication user
        ------------------------- */

        User user = userRepository
                .findByPhone(normalizedPhone)
                .orElseGet(() -> {

                    User newUser = new User(
                            normalizedPhone,
                            "PENDING_SETUP",
                            AccountStatus.PENDING_ACTIVATION
                    );

                    return userRepository.save(newUser);
                });

        /* -------------------------
           Prevent duplicate worker role
        ------------------------- */

        if (workerAccountRepository.existsByUserId(user.getId())) {
            throw new InvalidRequestException(
                    "This user already has a worker account"
            );
        }

        /* -------------------------
           Generate Worker ID
        ------------------------- */

        String workerId = generateWorkerId(village.getId());

        /* -------------------------
           Create WorkerAccount
        ------------------------- */

        WorkerAccount worker = new WorkerAccount(
                user,
                workerId,
                village,
                area,
                normalizedName,
                normalizedEmail,
                normalizedPhone
        );

        WorkerAccount saved = workerAccountRepository.save(worker);

        roleService.assignRole(
                saved.getUser().getId(),
                "WORKER",
                village.getId()
        );

        /* -------------------------
           Re-route complaints
        ------------------------- */

        complaintRoutingService.rerouteAreaComplaints(area, saved);

        /* -------------------------
           Activation request
        ------------------------- */

        activationRequestService.requestActivation(
                "WORKER",
                saved.getWorkerId()
        );

        return saved;
    }

    private String generateWorkerId(String villageId) {

        String random = UUID.randomUUID()
                .toString()
                .substring(0, 4)
                .toUpperCase();

        return "RLOW-" + villageId + "-" + random;
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}