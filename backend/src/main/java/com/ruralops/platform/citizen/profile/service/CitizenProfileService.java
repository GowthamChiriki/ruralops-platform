package com.ruralops.platform.citizen.profile.service;

import com.ruralops.platform.citizen.account.domain.CitizenAccount;
import com.ruralops.platform.citizen.account.repository.CitizenAccountRepository;
import com.ruralops.platform.citizen.profile.domain.CitizenProfile;
import com.ruralops.platform.citizen.profile.dto.CitizenProfileRequest;
import com.ruralops.platform.citizen.profile.dto.CitizenProfileResponse;
import com.ruralops.platform.citizen.profile.repository.CitizenProfileRepository;
import com.ruralops.platform.common.exception.ResourceNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class CitizenProfileService {

    private final CitizenAccountRepository citizenAccountRepository;
    private final CitizenProfileRepository citizenProfileRepository;

    public CitizenProfileService(
            CitizenAccountRepository citizenAccountRepository,
            CitizenProfileRepository citizenProfileRepository
    ) {
        this.citizenAccountRepository = citizenAccountRepository;
        this.citizenProfileRepository = citizenProfileRepository;
    }

    /* =====================================================
       CREATE PROFILE
       ===================================================== */

    @Transactional
    public void createProfile(UUID userId, CitizenProfileRequest request) {

        CitizenAccount citizen = citizenAccountRepository
                .findByUser_Id(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Citizen account not found for user: " + userId
                        )
                );

        CitizenProfile profile = new CitizenProfile(citizen);

        applyRequest(profile, request);

        citizenProfileRepository.save(profile);
    }

    /* =====================================================
       UPDATE PROFILE
       ===================================================== */

    @Transactional
    public void updateProfile(UUID userId, CitizenProfileRequest request) {

        CitizenAccount citizen = citizenAccountRepository
                .findByUser_Id(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Citizen account not found for user: " + userId
                        )
                );

        CitizenProfile profile = citizenProfileRepository
                .findByCitizenAccount_Id(citizen.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Citizen profile not found"
                        )
                );

        applyRequest(profile, request);

        citizenProfileRepository.save(profile);
    }

    /* =====================================================
       GET PROFILE
       ===================================================== */

    @Transactional(readOnly = true)
    public CitizenProfileResponse getProfile(UUID userId) {

        CitizenAccount citizen = citizenAccountRepository
                .findByUser_Id(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Citizen account not found for user: " + userId
                        )
                );

        CitizenProfile profile = citizenProfileRepository
                .findByCitizenAccount_Id(citizen.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Profile not found"));

        return CitizenProfileResponse.from(profile);
    }

    /* =====================================================
       PROFILE STATUS
       ===================================================== */

    @Transactional(readOnly = true)
    public boolean isProfileCompleted(UUID userId) {

        CitizenAccount citizen = citizenAccountRepository
                .findByUser_Id(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Citizen account not found for user: " + userId
                        )
                );

        return citizenProfileRepository
                .findByCitizenAccount_Id(citizen.getId())
                .map(CitizenProfile::isProfileCompleted)
                .orElse(false);
    }

    /* =====================================================
       APPLY REQUEST
       ===================================================== */

    private void applyRequest(CitizenProfile profile, CitizenProfileRequest request) {

        profile.setFirstName(request.getFirstName());
        profile.setLastName(request.getLastName());
        profile.setGender(request.getGender());
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setFatherName(request.getFatherName());
        profile.setMotherName(request.getMotherName());
        profile.setHouseNumber(request.getHouseNumber());
        profile.setStreet(request.getStreet());
        profile.setPincode(request.getPincode());
        profile.setProfilePhotoUrl(request.getProfilePhotoUrl());
    }
}