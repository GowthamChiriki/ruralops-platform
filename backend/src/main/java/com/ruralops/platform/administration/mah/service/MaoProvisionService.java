package com.ruralops.platform.administration.mah.service;

import com.ruralops.platform.administration.mah.domain.MaoAccount;
import com.ruralops.platform.administration.mah.repository.MaoAccountRepository;
import com.ruralops.platform.common.exception.GovernanceViolationException;
import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;
import com.ruralops.platform.governance.domain.Mandal;
import com.ruralops.platform.governance.repository.MandalRepository;
import com.ruralops.platform.secure.activation.service.ActivationRequestService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MaoProvisionService {

    private final MaoAccountRepository maoAccountRepository;
    private final MandalRepository mandalRepository;
    private final ActivationRequestService activationRequestService;

    public MaoProvisionService(
            MaoAccountRepository maoAccountRepository,
            MandalRepository mandalRepository,
            ActivationRequestService activationRequestService
    ) {
        this.maoAccountRepository = maoAccountRepository;
        this.mandalRepository = mandalRepository;
        this.activationRequestService = activationRequestService;
    }

    /**
     * Provisions a MAO account for a given Mandal.
     *
     * Rules:
     * - Exactly one MAO per Mandal
     * - Email and phone must be globally unique
     * - Account is created in PENDING_ACTIVATION state
     * - Activation key is sent via central activation system
     *
     * Used ONLY by system bootstrap / higher authority.
     */
    @Transactional
    public MaoAccount provisionMao(
            String mandalId,
            String email,
            String phoneNumber
    ) {

        String normalizedMandalId = normalize(mandalId);
        String normalizedEmail = normalize(email).toLowerCase();
        String normalizedPhone = normalize(phoneNumber);

        // ---- Fetch Mandal (resource existence)
        Mandal mandal = mandalRepository.findById(normalizedMandalId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Mandal not found: " + normalizedMandalId
                        )
                );

        // ---- Enforce one MAO per Mandal (governance rule)
        if (maoAccountRepository.existsByMandal(mandal)) {
            throw new GovernanceViolationException(
                    "MAO already exists for mandal: " + mandal.getName()
            );
        }

        // ---- Enforce identity uniqueness
        if (maoAccountRepository.existsByEmail(normalizedEmail)) {
            throw new InvalidRequestException("Email already in use");
        }

        if (maoAccountRepository.existsByPhoneNumber(normalizedPhone)) {
            throw new InvalidRequestException("Phone number already in use");
        }

        // ---- Generate MAO governance ID
        String maoId = generateMaoId(mandal.getId());

        // ---- Create MAO account (PENDING_ACTIVATION, no password yet)
        MaoAccount maoAccount = new MaoAccount(
                maoId,
                mandal,
                normalizedEmail,
                normalizedPhone
        );

        MaoAccount saved = maoAccountRepository.save(maoAccount);

        // ---- Trigger activation workflow (email + token)
        activationRequestService.requestActivation(
                "MAO",
                saved.getMaoId()
        );


        return saved;
    }

    /* =======================
       Internal helpers
       ======================= */

    /**
     * Deterministic, readable MAO ID.
     * Example: RLOM-MDG-3128-A7F3
     */
    private String generateMaoId(String mandalId) {
        String random = java.util.UUID.randomUUID()
                .toString()
                .substring(0, 4)
                .toUpperCase();

        return "RLOM-" + mandalId + "-" + random;
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}
