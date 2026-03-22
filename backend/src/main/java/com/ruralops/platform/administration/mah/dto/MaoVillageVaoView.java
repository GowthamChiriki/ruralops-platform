package com.ruralops.platform.administration.mah.dto;

import com.ruralops.platform.common.enums.AccountStatus;

public class MaoVillageVaoView {

    private final String villageId;
    private final String villageName;

    // Optional VAO
    private final String vaoId;
    private final AccountStatus vaoStatus;

    public MaoVillageVaoView(
            String villageId,
            String villageName,
            String vaoId,
            AccountStatus vaoStatus
    ) {
        this.villageId = villageId;
        this.villageName = villageName;
        this.vaoId = vaoId;
        this.vaoStatus = vaoStatus;
    }

    public String getVillageId() {
        return villageId;
    }

    public String getVillageName() {
        return villageName;
    }

    public String getVaoId() {
        return vaoId;
    }

    public AccountStatus getVaoStatus() {
        return vaoStatus;
    }
}
