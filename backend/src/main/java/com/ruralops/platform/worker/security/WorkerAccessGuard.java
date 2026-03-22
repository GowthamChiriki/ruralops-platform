package com.ruralops.platform.worker.security;

import com.ruralops.platform.worker.domain.WorkerAccount;
import com.ruralops.platform.worker.repository.WorkerAccountRepository;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;

import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Guard component used to validate worker access conditions.
 *
 * Ensures:
 * - Worker exists
 * - Worker account is ACTIVE
 *
 * Used at the start of worker-authorized service operations.
 */
@Component
public class WorkerAccessGuard {

    private final WorkerAccountRepository workerAccountRepository;

    public WorkerAccessGuard(
            WorkerAccountRepository workerAccountRepository
    ) {
        this.workerAccountRepository = workerAccountRepository;
    }

    /**
     * Ensures the worker exists and is ACTIVE.
     *
     * Resolves worker via authenticated userId.
     */
    public WorkerAccount requireActiveWorker(UUID userId) {

        WorkerAccount worker = workerAccountRepository
                .findByUser_Id(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Worker account not found for user: " + userId
                        )
                );

        if (worker.getStatus() != AccountStatus.ACTIVE) {
            throw new InvalidRequestException(
                    "Worker account is not active (status = " + worker.getStatus() + ")"
            );
        }

        return worker;
    }
}