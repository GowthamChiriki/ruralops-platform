package com.ruralops.platform.administration.mah.service;

import com.ruralops.platform.administration.mah.domain.MaoAccount;
import com.ruralops.platform.administration.mah.dto.MaoVillageVaoView;
import com.ruralops.platform.administration.mah.repository.MaoAccountRepository;
import com.ruralops.platform.administration.vah.domain.VaoAccount;
import com.ruralops.platform.administration.vah.repository.VaoAccountRepository;
import com.ruralops.platform.common.exception.ResourceNotFoundException;
import com.ruralops.platform.governance.domain.Village;
import com.ruralops.platform.governance.repository.VillageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class MaoVillageViewService {

    private final MaoAccountRepository maoAccountRepository;
    private final VillageRepository villageRepository;
    private final VaoAccountRepository vaoAccountRepository;

    public MaoVillageViewService(
            MaoAccountRepository maoAccountRepository,
            VillageRepository villageRepository,
            VaoAccountRepository vaoAccountRepository
    ) {
        this.maoAccountRepository = maoAccountRepository;
        this.villageRepository = villageRepository;
        this.vaoAccountRepository = vaoAccountRepository;
    }

    public List<MaoVillageVaoView> getVillagesWithVao(String maoId) {

        MaoAccount mao = maoAccountRepository.findByMaoId(maoId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("MAO not found: " + maoId)
                );

        List<Village> villages =
                villageRepository.findAllByMandal(mao.getMandal());

        return villages.stream()
                .map(village -> {

                    VaoAccount vao =
                            vaoAccountRepository.findByVillage(village).orElse(null);

                    return new MaoVillageVaoView(
                            village.getId(),
                            village.getName(),
                            vao != null ? vao.getVaoId() : null,
                            vao != null ? vao.getStatus() : null
                    );
                })
                .toList();
    }
}
