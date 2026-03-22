package com.ruralops.platform.citizen.dashboard.service;

import com.ruralops.platform.citizen.account.domain.CitizenAccount;
import com.ruralops.platform.citizen.account.repository.CitizenAccountRepository;
import com.ruralops.platform.citizen.dashboard.dto.CitizenDashboardResponse;
import com.ruralops.platform.citizen.profile.domain.CitizenProfile;
import com.ruralops.platform.citizen.profile.repository.CitizenProfileRepository;
import com.ruralops.platform.common.exception.ResourceNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class CitizenDashboardService {

    private final CitizenAccountRepository citizenAccountRepository;
    private final CitizenProfileRepository citizenProfileRepository;

    public CitizenDashboardService(
            CitizenAccountRepository citizenAccountRepository,
            CitizenProfileRepository citizenProfileRepository
    ) {
        this.citizenAccountRepository = citizenAccountRepository;
        this.citizenProfileRepository = citizenProfileRepository;
    }

    @Transactional(readOnly = true)
    public CitizenDashboardResponse loadDashboard(UUID userId) {

        /* -------------------------------------------------
           1. Resolve citizen from authenticated identity
         ------------------------------------------------- */

        CitizenAccount account = citizenAccountRepository
                .findByUser_Id(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Citizen not found for user: " + userId
                        )
                );

        /* -------------------------------------------------
           2. Fetch citizen profile (OPTIONAL)
         ------------------------------------------------- */

        Optional<CitizenProfile> profileOpt =
                citizenProfileRepository.findByCitizenAccount_Id(account.getId());

        /* -------------------------------------------------
           3. Build dashboard
         ------------------------------------------------- */

        CitizenDashboardResponse response = new CitizenDashboardResponse();

        response.setCitizenId(account.getCitizenId());
        response.setCitizenName(account.getFullName());
        response.setVillageName(account.getVillage().getName());

        /* -------------------------------------------------
           4. Profile handling
         ------------------------------------------------- */

        if (profileOpt.isPresent()) {

            CitizenProfile profile = profileOpt.get();

            response.setProfileCompleted(true);
            response.setProfilePhoto(profile.getProfilePhotoUrl());

        } else {

            response.setProfileCompleted(false);
            response.setProfilePhoto(null);
        }

        /* -------------------------------------------------
           5. Dashboard actions
         ------------------------------------------------- */

        response.setComplaintsEnabled(true);
        response.setGrievancesEnabled(true);
        response.setSchemesEnabled(true);

        /* -------------------------------------------------
           6. Future data modules
         ------------------------------------------------- */

        response.setTotalComplaints(0);
        response.setPendingComplaints(0);

        response.setLatestNews("Village development program announced.");
        response.setWeatherSummary("Weather data service will be integrated.");

        return response;
    }
}