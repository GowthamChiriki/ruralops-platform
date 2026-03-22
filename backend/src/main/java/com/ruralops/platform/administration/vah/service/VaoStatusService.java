package com.ruralops.platform.administration.vah.service;

import com.ruralops.platform.administration.vah.domain.VaoAccount;
import com.ruralops.platform.administration.vah.dto.VaoSummaryResponse;
import com.ruralops.platform.administration.vah.repository.VaoAccountRepository;
import com.ruralops.platform.common.exception.ResourceNotFoundException;
import com.ruralops.platform.governance.domain.Village;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class VaoStatusService {

    private final VaoAccountRepository vaoAccountRepository;

    public VaoStatusService(VaoAccountRepository vaoAccountRepository) {
        this.vaoAccountRepository = vaoAccountRepository;
    }

    /**
     * Fetch VAO status by VAO ID.
     *
     * Used by:
     * - Admin dashboards
     * - Internal workflows
     */
    public VaoSummaryResponse getByVaoId(String vaoId) {

        VaoAccount vao = vaoAccountRepository.findByVaoId(vaoId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "VAO not found: " + vaoId
                        )
                );

        return toSummary(vao);
    }

    /**
     * Fetch VAO status by phone number.
     *
     * Used by:
     * - Public status-check flow
     */
    public VaoSummaryResponse getByPhoneNumber(String phoneNumber) {

        VaoAccount vao = vaoAccountRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "VAO not found with phone number: " + phoneNumber
                        )
                );

        return toSummary(vao);
    }

    /* =======================
       Mapping helpers
       ======================= */

    private VaoSummaryResponse toSummary(VaoAccount vao) {

        Village village = vao.getVillage();

        return new VaoSummaryResponse(
                vao.getVaoId(),
                village.getId(),
                village.getName(),
                village.getMandal().getId(),
                village.getMandal().getName(),
                vao.getStatus()
        );
    }
}
