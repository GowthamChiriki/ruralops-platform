package com.ruralops.platform.governance.dto;

/**
 * Response payload representing an Area.
 */
public class AreaResponse {

    private Long id;
    private String name;

    public AreaResponse(Long id, String name) {
        this.id = id;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}