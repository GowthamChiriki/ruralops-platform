package com.ruralops.platform.administration.vao.service;

import com.ruralops.platform.administration.vao.domain.VaoProfile;
import com.ruralops.platform.administration.vao.dto.VaoProfileCompletionRequest;
import com.ruralops.platform.administration.vao.dto.VaoProfileResponse;
import com.ruralops.platform.administration.vao.repository.VaoProfileRepository;
import com.ruralops.platform.administration.vah.domain.VaoAccount;
import com.ruralops.platform.administration.vah.repository.VaoAccountRepository;
import com.ruralops.platform.common.exception.ResourceNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class VaoProfileService {

    private final VaoProfileRepository profileRepository;
    private final VaoAccountRepository vaoAccountRepository;

    public VaoProfileService(
            VaoProfileRepository profileRepository,
            VaoAccountRepository vaoAccountRepository
    ) {
        this.profileRepository = profileRepository;
        this.vaoAccountRepository = vaoAccountRepository;
    }

    /* ============================================================
       READ
       ============================================================ */

    @Transactional(readOnly = true)
    public boolean isProfileCompleted(UUID userId) {

        VaoAccount account = findAccount(userId);

        return profileRepository
                .findByVaoAccount(account)
                .map(VaoProfile::isProfileCompleted)
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public VaoProfileResponse getProfileDetails(UUID userId) {

        VaoAccount account = findAccount(userId);

        String villageId = account.getVillage() != null
                ? account.getVillage().getId()
                : null;

        String villageName = account.getVillage() != null
                ? account.getVillage().getName()
                : null;

        return profileRepository
                .findByVaoAccount(account)
                .map(profile -> new VaoProfileResponse(
                        account.getVaoId(),
                        profile.getFullName(),
                        profile.getDateOfBirth(),
                        profile.getGender(),
                        profile.getQualification(),
                        profile.getAlternatePhone(),
                        profile.getOfficeAddress(),
                        villageId,
                        villageName,
                        profile.getProfilePhotoUrl(),
                        profile.getSignaturePhotoUrl(),
                        profile.getIdProofUrl(),
                        profile.isProfileCompleted()
                ))
                .orElseGet(() -> new VaoProfileResponse(
                        account.getVaoId(),
                        account.getName(),
                        null,
                        null,
                        null,
                        null,
                        null,
                        villageId,
                        villageName,
                        null,
                        null,
                        null,
                        false
                ));
    }

    /* ============================================================
       WRITE — initial completion
       ============================================================ */

    @Transactional
    public void completeProfile(UUID userId, VaoProfileCompletionRequest request) {

        VaoAccount account = findAccount(userId);

        VaoProfile profile = profileRepository
                .findByVaoAccount(account)
                .orElseGet(() -> new VaoProfile(account));

        applyRequest(profile, request);

        profileRepository.save(profile);
    }

    /* ============================================================
       WRITE — update
       ============================================================ */

    @Transactional
    public void updateProfile(UUID userId, VaoProfileCompletionRequest request) {
        completeProfile(userId, request);
    }

    /* ============================================================
       PRIVATE HELPERS
       ============================================================ */

    private VaoAccount findAccount(UUID userId) {

        return vaoAccountRepository
                .findByUserId(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "VAO account not found for user: " + userId
                        ));
    }

    private void applyRequest(VaoProfile profile, VaoProfileCompletionRequest request) {

        profile.completeProfile(
                request.getFullName(),
                request.getDateOfBirth(),
                request.getGender(),
                request.getQualification(),
                request.getAlternatePhone(),
                request.getOfficeAddress(),
                request.getProfilePhotoUrl(),
                request.getSignaturePhotoUrl(),
                request.getIdProofUrl()
        );
    }
}