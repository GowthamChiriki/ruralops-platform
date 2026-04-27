package com.ruralops.platform.secure.status.service;

import com.ruralops.platform.administration.mah.domain.MaoAccount;
import com.ruralops.platform.administration.mah.repository.MaoAccountRepository;
import com.ruralops.platform.administration.vah.domain.VaoAccount;
import com.ruralops.platform.administration.vah.repository.VaoAccountRepository;
import com.ruralops.platform.citizen.account.domain.CitizenAccount;
import com.ruralops.platform.citizen.account.repository.CitizenAccountRepository;
import com.ruralops.platform.worker.domain.WorkerAccount;
import com.ruralops.platform.worker.repository.WorkerAccountRepository;

import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.common.enums.ActivationTokenStatus;
import com.ruralops.platform.common.exception.ResourceNotFoundException;

import com.ruralops.platform.secure.activation.domain.ActivationToken;
import com.ruralops.platform.secure.activation.repository.ActivationTokenRepository;
import com.ruralops.platform.secure.activation.service.ActivationTokenService;

import com.ruralops.platform.secure.status.dto.StatusCheckResponse;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class StatusCheckService {

    private final MaoAccountRepository maoAccountRepository;
    private final VaoAccountRepository vaoAccountRepository;
    private final CitizenAccountRepository citizenAccountRepository;
    private final WorkerAccountRepository workerAccountRepository;
    private final ActivationTokenRepository tokenRepository;

    // ✅ NEW
    private final ActivationTokenService activationTokenService;

    public StatusCheckService(
            MaoAccountRepository maoAccountRepository,
            VaoAccountRepository vaoAccountRepository,
            CitizenAccountRepository citizenAccountRepository,
            WorkerAccountRepository workerAccountRepository,
            ActivationTokenRepository tokenRepository,
            ActivationTokenService activationTokenService
    ) {
        this.maoAccountRepository = maoAccountRepository;
        this.vaoAccountRepository = vaoAccountRepository;
        this.citizenAccountRepository = citizenAccountRepository;
        this.workerAccountRepository = workerAccountRepository;
        this.tokenRepository = tokenRepository;
        this.activationTokenService = activationTokenService;
    }

    public List<StatusCheckResponse> checkByPhoneNumber(String phoneNumber) {

        List<StatusCheckResponse> responses = new ArrayList<>();

        maoAccountRepository
                .findByPhoneNumber(phoneNumber)
                .ifPresent(mao -> responses.add(mapMaoToResponse(mao)));

        vaoAccountRepository
                .findByPhoneNumber(phoneNumber)
                .ifPresent(vao -> responses.add(mapVaoToResponse(vao)));

        workerAccountRepository
                .findByPhoneNumber(phoneNumber)
                .ifPresent(worker -> responses.add(mapWorkerToResponse(worker)));

        citizenAccountRepository
                .findByPhoneNumber(phoneNumber)
                .ifPresent(citizen -> responses.add(mapCitizenToResponse(citizen)));

        if (responses.isEmpty()) {
            throw new ResourceNotFoundException(
                    "No account found for the given phone number"
            );
        }

        return responses;
    }

    /* =======================
       Mapping logic
       ======================= */

    private StatusCheckResponse mapMaoToResponse(MaoAccount mao) {

        AccountStatus status = mao.getStatus();

        return new StatusCheckResponse(
                "MAO",
                mao.getMaoId(),
                status,
                status == AccountStatus.PENDING_ACTIVATION,
                nextActionFor(status),
                getActivationKey("MAO", mao.getMaoId(), status)
        );
    }

    private StatusCheckResponse mapVaoToResponse(VaoAccount vao) {

        AccountStatus status = vao.getStatus();

        return new StatusCheckResponse(
                "VAO",
                vao.getVaoId(),
                status,
                status == AccountStatus.PENDING_ACTIVATION,
                nextActionFor(status),
                getActivationKey("VAO", vao.getVaoId(), status)
        );
    }

    private StatusCheckResponse mapWorkerToResponse(WorkerAccount worker) {

        AccountStatus status = worker.getStatus();

        return new StatusCheckResponse(
                "WORKER",
                worker.getWorkerId(),
                status,
                status == AccountStatus.PENDING_ACTIVATION,
                nextActionFor(status),
                getActivationKey("WORKER", worker.getWorkerId(), status)
        );
    }

    private StatusCheckResponse mapCitizenToResponse(CitizenAccount citizen) {

        AccountStatus status = citizen.getStatus();

        if (status == AccountStatus.PENDING_ACTIVATION
                && citizen.getCitizenId() == null) {

            throw new IllegalStateException(
                    "Citizen in PENDING_ACTIVATION without citizenId. Internal ID: "
                            + citizen.getId()
            );
        }

        return new StatusCheckResponse(
                "CITIZEN",
                citizen.getCitizenId(),
                status,
                status == AccountStatus.PENDING_ACTIVATION,
                nextActionForCitizen(status),
                getActivationKey("CITIZEN", citizen.getCitizenId(), status)
        );
    }

    /* =======================
        UPDATED LOGIC HERE
       ======================= */

    private String getActivationKey(
            String accountType,
            String accountId,
            AccountStatus status
    ) {

        if (status != AccountStatus.PENDING_ACTIVATION) {
            return null;
        }

        // Try existing token
        var existingToken = tokenRepository
                .findTopByAccountTypeAndAccountIdAndStatusOrderByCreatedAtDesc(
                        accountType,
                        accountId,
                        ActivationTokenStatus.ACTIVE
                );

        if (existingToken.isPresent()) {
            return existingToken.get().getRawToken();
        }

        // AUTO GENERATE if missing
        return activationTokenService.generateToken(accountType, accountId);
    }

    /* =======================
       Next-action resolution
       ======================= */

    private String nextActionFor(AccountStatus status) {
        return switch (status) {
            case PENDING_ACTIVATION -> "REQUEST_ACTIVATION";
            case ACTIVE -> "LOGIN";
            case SUSPENDED, REJECTED -> "CONTACT_SUPPORT";
            default -> "CONTACT_SUPPORT";
        };
    }

    private String nextActionForCitizen(AccountStatus status) {
        return switch (status) {
            case PENDING_APPROVAL -> "WAIT_FOR_APPROVAL";
            case PENDING_ACTIVATION -> "REQUEST_ACTIVATION";
            case ACTIVE -> "LOGIN";
            case REJECTED, SUSPENDED -> "CONTACT_SUPPORT";
            default -> "CONTACT_SUPPORT";
        };
    }
}