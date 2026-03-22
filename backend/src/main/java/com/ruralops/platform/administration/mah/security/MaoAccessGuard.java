package com.ruralops.platform.administration.mah.security;

import com.ruralops.platform.administration.mah.domain.MaoAccount;
import com.ruralops.platform.administration.mah.repository.MaoAccountRepository;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Component;

@Component
public class MaoAccessGuard {

    private final MaoAccountRepository maoAccountRepository;

    public MaoAccessGuard(MaoAccountRepository maoAccountRepository) {
        this.maoAccountRepository = maoAccountRepository;
    }

    /**
     * Ensures the MAO exists and is ACTIVE.
     * Call this at the start of any MAO-authorized action.
     */
    public MaoAccount requireActiveMao(String maoId) {

        MaoAccount maoAccount = maoAccountRepository
                .findByMaoId(maoId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "MAO not found: " + maoId
                        )
                );

        if (maoAccount.getStatus() != AccountStatus.ACTIVE) {
            throw new InvalidRequestException(
                    "MAO account is not active"
            );
        }

        return maoAccount;
    }
}
