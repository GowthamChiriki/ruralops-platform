package com.ruralops.platform.governance.service;

import com.ruralops.platform.citizen.account.domain.CitizenAccount;
import com.ruralops.platform.citizen.security.CitizenAccessGuard;
import com.ruralops.platform.governance.domain.Area;
import com.ruralops.platform.governance.domain.Village;
import com.ruralops.platform.governance.dto.AreaResponse;
import com.ruralops.platform.governance.dto.CreateAreaRequest;
import com.ruralops.platform.governance.repository.AreaRepository;

import com.ruralops.platform.administration.vah.domain.VaoAccount;
import com.ruralops.platform.administration.vah.security.VaoAccessGuard;

import com.ruralops.platform.common.exception.InvalidRequestException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service responsible for managing Areas inside villages.
 *
 * Authority:
 * - Only ACTIVE VAO can create areas
 * - Areas can only be created within the VAO's village
 */
@Service
public class AreaService {

    private final AreaRepository areaRepository;
    private final VaoAccessGuard vaoAccessGuard;
    private final CitizenAccessGuard citizenAccessGuard;

    public AreaService(
            AreaRepository areaRepository,
            VaoAccessGuard vaoAccessGuard,
            CitizenAccessGuard citizenAccessGuard
    ) {
        this.areaRepository = areaRepository;
        this.vaoAccessGuard = vaoAccessGuard;
        this.citizenAccessGuard = citizenAccessGuard;
    }

    /* =========================================
       CREATE AREA (VAO)
       ========================================= */

    @Transactional
    public AreaResponse createAreaForVao(UUID userId, CreateAreaRequest request) {

        // Resolve VAO identity
        VaoAccount vao = vaoAccessGuard.requireActiveVao(userId);

        Village village = vao.getVillage();

        if (areaRepository.existsByVillageAndName(village, request.getName())) {
            throw new InvalidRequestException(
                    "Area already exists in village: " + request.getName()
            );
        }

        Area area = new Area(village, request.getName());

        Area saved = areaRepository.saveAndFlush(area);

        return new AreaResponse(saved.getId(), saved.getName());
    }

    /* =========================================
       GET AREAS FOR VAO
       ========================================= */

    @Transactional(readOnly = true)
    public List<AreaResponse> getAreasForVao(UUID userId) {

        VaoAccount vao = vaoAccessGuard.requireActiveVao(userId);

        Village village = vao.getVillage();

        return areaRepository.findAllByVillage(village)
                .stream()
                .map(area -> new AreaResponse(
                        area.getId(),
                        area.getName()
                ))
                .toList();
    }

    /* =========================================
       GET AREAS FOR CITIZEN
       ========================================= */

    @Transactional(readOnly = true)
    public List<AreaResponse> getAreasForCitizenVillage(UUID userId) {

        CitizenAccount citizen =
                citizenAccessGuard.requireActiveCitizen(userId);

        Village village = citizen.getVillage();

        return areaRepository.findAllByVillage(village)
                .stream()
                .map(area -> new AreaResponse(
                        area.getId(),
                        area.getName()
                ))
                .toList();
    }
}