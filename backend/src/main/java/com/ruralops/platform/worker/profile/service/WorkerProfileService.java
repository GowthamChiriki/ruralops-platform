package com.ruralops.platform.worker.profile.service;

import com.ruralops.platform.worker.domain.WorkerAccount;
import com.ruralops.platform.worker.repository.WorkerAccountRepository;
import com.ruralops.platform.worker.profile.domain.WorkerProfile;
import com.ruralops.platform.worker.profile.dto.WorkerProfileCompletionRequest;
import com.ruralops.platform.worker.profile.dto.WorkerProfileUpdateRequest;
import com.ruralops.platform.worker.profile.dto.WorkerProfileResponse;
import com.ruralops.platform.worker.profile.repository.WorkerProfileRepository;
import com.ruralops.platform.common.exception.InvalidRequestException;
import com.ruralops.platform.common.exception.ResourceNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class WorkerProfileService {

    private final WorkerProfileRepository workerProfileRepository;
    private final WorkerAccountRepository workerAccountRepository;

    public WorkerProfileService(
            WorkerProfileRepository workerProfileRepository,
            WorkerAccountRepository workerAccountRepository
    ) {
        this.workerProfileRepository = workerProfileRepository;
        this.workerAccountRepository = workerAccountRepository;
    }

    /* ======================================================
       Create Worker Profile
       ====================================================== */

    @Transactional
    public void createProfile(UUID userId, WorkerProfileCompletionRequest request) {

        WorkerAccount account = getWorkerAccount(userId);

        if (workerProfileRepository.existsByWorkerAccount_Id(account.getId())) {
            throw new InvalidRequestException("Worker profile already exists");
        }

        WorkerProfile profile = new WorkerProfile();
        profile.setWorkerAccount(account);

        applyCompletionData(profile, request);
        profile.setProfileCompleted(true);

        workerProfileRepository.save(profile);
    }

    /* ======================================================
       Update Worker Profile
       ====================================================== */

    @Transactional
    public void updateProfile(UUID userId, WorkerProfileUpdateRequest request) {

        WorkerAccount account = getWorkerAccount(userId);

        WorkerProfile profile = workerProfileRepository
                .findByWorkerAccount_Id(account.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Worker profile does not exist. Please complete profile first."
                        )
                );

        applyUpdateData(profile, request);

        workerProfileRepository.save(profile);
    }

    /* ======================================================
       Get Worker Profile
       ====================================================== */

    @Transactional(readOnly = true)
    public WorkerProfileResponse getProfile(UUID userId) {

        WorkerAccount account = getWorkerAccount(userId);

        WorkerProfile profile = workerProfileRepository
                .findByWorkerAccount_Id(account.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Worker profile not found. Profile not completed yet."
                        )
                );

        return mapToResponse(profile);
    }

    @Transactional
    public void updateProfilePhoto(UUID userId, String photoUrl) {

        WorkerAccount account = getWorkerAccount(userId);

        WorkerProfile profile = workerProfileRepository
                .findByWorkerAccount_Id(account.getId())
                .orElse(null);

        if (profile == null) {
            // just ignore until profile is created
            return;
        }

        profile.setProfilePhotoUrl(photoUrl);
        workerProfileRepository.save(profile);
    }

    /* ======================================================
       Profile Completion Status
       ====================================================== */

    @Transactional(readOnly = true)
    public boolean isProfileCompleted(UUID userId) {

        WorkerAccount account = getWorkerAccount(userId);

        return workerProfileRepository
                .findByWorkerAccount_Id(account.getId())
                .map(WorkerProfile::isProfileCompleted)
                .orElse(false);
    }

    /* ======================================================
       WorkerAccount Resolver
       ====================================================== */

    private WorkerAccount getWorkerAccount(UUID userId) {

        return workerAccountRepository
                .findByUser_Id(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Worker account not found for user: " + userId
                        )
                );
    }

    /* ======================================================
       Apply Completion Data
       ====================================================== */

    private void applyCompletionData(
            WorkerProfile profile,
            WorkerProfileCompletionRequest request
    ) {

        profile.setFirstName(request.getFirstName());
        profile.setLastName(request.getLastName());
        profile.setGender(request.getGender());
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setAge(request.getAge());

        profile.setFatherName(request.getFatherName());
        profile.setMotherName(request.getMotherName());

        profile.setAadhaarNumber(request.getAadhaarNumber());

        profile.setHouseNumber(request.getHouseNumber());
        profile.setStreet(request.getStreet());
        profile.setPincode(request.getPincode());

        profile.setWorkerType(request.getWorkerType());
        profile.setSkillCategory(request.getSkillCategory());
        profile.setExperience(request.getExperience());

        profile.setProfilePhotoUrl(request.getProfilePhotoUrl());
    }

    /* ======================================================
       Apply Update Data
       ====================================================== */

    private void applyUpdateData(
            WorkerProfile profile,
            WorkerProfileUpdateRequest request
    ) {

        if (request.getFirstName() != null)
            profile.setFirstName(request.getFirstName());

        if (request.getLastName() != null)
            profile.setLastName(request.getLastName());

        if (request.getGender() != null)
            profile.setGender(request.getGender());

        if (request.getDateOfBirth() != null)
            profile.setDateOfBirth(request.getDateOfBirth());

        if (request.getAge() != null)
            profile.setAge(request.getAge());

        if (request.getFatherName() != null)
            profile.setFatherName(request.getFatherName());

        if (request.getMotherName() != null)
            profile.setMotherName(request.getMotherName());

        if (request.getAadhaarNumber() != null)
            profile.setAadhaarNumber(request.getAadhaarNumber());

        if (request.getHouseNumber() != null)
            profile.setHouseNumber(request.getHouseNumber());

        if (request.getStreet() != null)
            profile.setStreet(request.getStreet());

        if (request.getPincode() != null)
            profile.setPincode(request.getPincode());

        if (request.getWorkerType() != null)
            profile.setWorkerType(request.getWorkerType());

        if (request.getSkillCategory() != null)
            profile.setSkillCategory(request.getSkillCategory());

        if (request.getExperience() != null)
            profile.setExperience(request.getExperience());

        if (request.getProfilePhotoUrl() != null)
            profile.setProfilePhotoUrl(request.getProfilePhotoUrl());
    }

    /* ======================================================
       Entity → Response Mapping
       ====================================================== */

    private WorkerProfileResponse mapToResponse(WorkerProfile profile) {

        WorkerAccount account = profile.getWorkerAccount();

        WorkerProfileResponse response = new WorkerProfileResponse();

        response.setWorkerId(account.getWorkerId());

        response.setFirstName(profile.getFirstName());
        response.setLastName(profile.getLastName());
        response.setGender(profile.getGender());
        response.setDateOfBirth(profile.getDateOfBirth());
        response.setAge(profile.getAge());

        response.setFatherName(profile.getFatherName());
        response.setMotherName(profile.getMotherName());

        response.setPhoneNumber(account.getPhoneNumber());
        response.setEmail(account.getEmail());

        response.setVillageName(account.getVillage().getName());
        response.setAreaName(account.getArea().getName());

        response.setAadhaarNumber(profile.getAadhaarNumber());

        response.setHouseNumber(profile.getHouseNumber());
        response.setStreet(profile.getStreet());
        response.setPincode(profile.getPincode());

        response.setWorkerType(profile.getWorkerType());
        response.setSkillCategory(profile.getSkillCategory());
        response.setExperience(profile.getExperience());

        response.setProfilePhotoUrl(profile.getProfilePhotoUrl());
        response.setProfileCompleted(profile.isProfileCompleted());

        return response;
    }
}