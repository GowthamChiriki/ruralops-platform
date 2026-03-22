package com.ruralops.platform.governance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload used when creating a new Area
 * inside a Village.
 */
public class CreateAreaRequest {

    /**
     * Name of the Area.
     *
     * Example:
     * Temple Street
     * Market Road
     * East Colony
     */
    @NotBlank(message = "Area name is required")
    @Size(max = 120, message = "Area name must not exceed 120 characters")
    private String name;

    /**
     * Default constructor required for JSON deserialization.
     */
    public CreateAreaRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}