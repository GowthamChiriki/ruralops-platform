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
 * Default implementation of AccountContactResolver.
 *
 * Resolves contact details for supported account types
 * by querying internal system records.
 *
 * Also validates that the account is eligible for activation.
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

    /**
     * Resolves contact details based on account type.
     *
     * Only supported account types are allowed.
     * Throws an exception for unsupported types.
     */
    @Override
    public ResolvedContact resolve(String accountType, String accountId) {

        return switch (accountType) {
            case "MAO" -> resolveMao(accountId);
            case "VAO" -> resolveVao(accountId);
            case "WORKER" -> resolveWorker(accountId);
            case "CITIZEN" -> resolveCitizen(accountId);
            default -> throw new InvalidRequestException(
                    "Unsupported account type: " + accountType
            );
        };
    }

    /* =======================
       MAO resolution
       ======================= */

    /**
     * Retrieves and validates a MAO account.
     *
     * Activation is allowed only if the account
     * is in PENDING_ACTIVATION status.
     */
    private ResolvedContact resolveMao(String maoId) {

        MaoAccount mao = maoAccountRepository
                .findByMaoId(maoId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "MAO account not found: " + maoId
                        )
                );

        if (mao.getStatus() != AccountStatus.PENDING_ACTIVATION) {
            throw new InvalidRequestException(
                    "Activation not allowed for MAO in status: " + mao.getStatus()
            );
        }

        return new ResolvedContact(
                mao.getEmail(),
                deriveDisplayName(mao.getEmail())
        );
    }

    /* =======================
       VAO resolution
       ======================= */

    /**
     * Retrieves and validates a VAO account.
     *
     * Activation is allowed only if the account
     * is in PENDING_ACTIVATION status.
     */
    private ResolvedContact resolveVao(String vaoId) {

        VaoAccount vao = vaoAccountRepository
                .findByVaoId(vaoId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "VAO account not found: " + vaoId
                        )
                );

        if (vao.getStatus() != AccountStatus.PENDING_ACTIVATION) {
            throw new InvalidRequestException(
                    "Activation not allowed for VAO in status: " + vao.getStatus()
            );
        }

        return new ResolvedContact(
                vao.getEmail(),
                deriveDisplayName(vao.getEmail())
        );
    }

    /* =======================
       WORKER resolution
       ======================= */

    /**
     * Retrieves and validates a Worker account.
     *
     * Activation is allowed only if the account
     * is in PENDING_ACTIVATION status.
     */
    private ResolvedContact resolveWorker(String workerId) {

        WorkerAccount worker = workerAccountRepository
                .findByWorkerId(workerId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Worker account not found: " + workerId
                        )
                );

        if (worker.getStatus() != AccountStatus.PENDING_ACTIVATION) {
            throw new InvalidRequestException(
                    "Activation not allowed for worker in status: " + worker.getStatus()
            );
        }

        return new ResolvedContact(
                worker.getEmail(),
                deriveDisplayName(worker.getEmail())
        );
    }

    /* =======================
       CITIZEN resolution
       ======================= */

    /**
     * Retrieves and validates a Citizen account.
     *
     * Activation is allowed only if the account
     * is in PENDING_ACTIVATION status.
     */
    private ResolvedContact resolveCitizen(String citizenId) {

        CitizenAccount citizen = citizenAccountRepository
                .findByCitizenId(citizenId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Citizen account not found: " + citizenId
                        )
                );

        if (citizen.getStatus() != AccountStatus.PENDING_ACTIVATION) {
            throw new InvalidRequestException(
                    "Activation not allowed for citizen in status: " + citizen.getStatus()
            );
        }

        return new ResolvedContact(
                citizen.getEmail(),
                deriveDisplayName(citizen.getEmail())
        );
    }

    /* =======================
       Helpers
       ======================= */

    /**
     * Derives a simple display name from an email address.
     *
     * If the email format is invalid, returns a generic value.
     */
    private String deriveDisplayName(String email) {
        if (email == null || !email.contains("@")) {
            return "User";
        }
        return email.substring(0, email.indexOf('@'));
    }
}