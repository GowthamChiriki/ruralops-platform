package com.ruralops.platform.secure.activation.resolver;

import com.ruralops.platform.administration.mah.domain.MaoAccount;
import com.ruralops.platform.administration.mah.repository.MaoAccountRepository;
import com.ruralops.platform.administration.vah.domain.VaoAccount;
import com.ruralops.platform.administration.vah.repository.VaoAccountRepository;
import com.ruralops.platform.citizen.account.domain.CitizenAccount;
import com.ruralops.platform.citizen.account.repository.CitizenAccountRepository;
import com.ruralops.platform.worker.domain.WorkerAccount;
import com.ruralops.platform.worker.repository.WorkerAccountRepository;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Component;

/**
 * Validates account eligibility for activation.
 */
@Component
public class DefaultAccountContactResolver implements AccountContactResolver {

    private final MaoAccountRepository maoAccountRepository;
    private final VaoAccountRepository vaoAccountRepository;
    private final CitizenAccountRepository citizenAccountRepository;
    private final WorkerAccountRepository workerAccountRepository;

    public DefaultAccountContactResolver(
            MaoAccountRepository maoAccountRepository,
            VaoAccountRepository vaoAccountRepository,
            CitizenAccountRepository citizenAccountRepository,
            WorkerAccountRepository workerAccountRepository
    ) {
        this.maoAccountRepository = maoAccountRepository;
        this.vaoAccountRepository = vaoAccountRepository;
        this.citizenAccountRepository = citizenAccountRepository;
        this.workerAccountRepository = workerAccountRepository;
    }

    @Override
    public void validate(String accountType, String accountId) {

        switch (accountType) {
            case "MAO" -> validateMao(accountId);
            case "VAO" -> validateVao(accountId);
            case "WORKER" -> validateWorker(accountId);
            case "CITIZEN" -> validateCitizen(accountId);
            default -> throw new InvalidRequestException(
                    "Unsupported account type: " + accountType
            );
        }
    }

    private void validateMao(String maoId) {
        MaoAccount mao = maoAccountRepository
                .findByMaoId(maoId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("MAO account not found: " + maoId)
                );

        ensurePendingActivation(mao.getStatus(), "MAO");
    }

    private void validateVao(String vaoId) {
        VaoAccount vao = vaoAccountRepository
                .findByVaoId(vaoId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("VAO account not found: " + vaoId)
                );

        ensurePendingActivation(vao.getStatus(), "VAO");
    }

    private void validateWorker(String workerId) {
        WorkerAccount worker = workerAccountRepository
                .findByWorkerId(workerId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Worker account not found: " + workerId)
                );

        ensurePendingActivation(worker.getStatus(), "WORKER");
    }

    private void validateCitizen(String citizenId) {
        CitizenAccount citizen = citizenAccountRepository
                .findByCitizenId(citizenId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Citizen account not found: " + citizenId)
                );

        ensurePendingActivation(citizen.getStatus(), "CITIZEN");
    }

    private void ensurePendingActivation(AccountStatus status, String type) {
        if (status != AccountStatus.PENDING_ACTIVATION) {
            throw new InvalidRequestException(
                    "Activation not allowed for " + type + " in status: " + status
            );
        }
    }
}