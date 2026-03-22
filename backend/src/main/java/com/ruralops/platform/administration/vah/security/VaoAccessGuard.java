package com.ruralops.platform.administration.vah.security;

import com.ruralops.platform.administration.vah.domain.VaoAccount;
import com.ruralops.platform.administration.vah.repository.VaoAccountRepository;
import com.ruralops.platform.common.enums.AccountStatus;
import com.ruralops.platform.common.exception.ResourceNotFoundException;
import com.ruralops.platform.common.exception.InvalidRequestException;

import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class VaoAccessGuard {

    private final VaoAccountRepository vaoAccountRepository;

    public VaoAccessGuard(VaoAccountRepository vaoAccountRepository) {
        this.vaoAccountRepository = vaoAccountRepository;
    }

    /**
     * Ensures the VAO exists and is ACTIVE.
     *
     * Identity resolution flow:
     *
     * JWT userId
     * ↓
     * users.id
     * ↓
     * vao_accounts.user_id
     */
    public VaoAccount requireActiveVao(UUID userId) {

        VaoAccount vao = vaoAccountRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "VAO not found for user: " + userId
                        )
                );

        if (vao.getStatus() != AccountStatus.ACTIVE) {
            throw new InvalidRequestException(
                    "VAO account is not active (status = " + vao.getStatus() + ")"
            );
        }

        return vao;
    }
}