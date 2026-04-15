package com.ruralops.platform.governance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Represents a State or Union Territory in the system.
 *
 * This is master data. It does not change often.
 * Each record should remain stable once created.
 */
@Entity
@Table(name = "states")
public class State {

    /**
     * Public governance ID.
     *
     * Example: IN-AP-2578
     * This ID is created outside the database.
     * It must remain consistent across systems.
     */
    @Id
    @Column(length = 15, nullable = false)
    private String id;

    /**
     * Official name of the State or Union Territory.
     *
     * Must be unique to avoid duplicate records.
     */
    @Column(nullable = false, unique = true, length = 100)
    private String name;

    /**
     * Type of region.
     *
     * Expected values:
     * - STATE
     * - UNION_TERRITORY
     */
    @Column(nullable = false, length = 20)
    private String type;

    /**
     * Indicates whether this state is currently active.
     *
     * If set to false, the record is disabled but not deleted.
     */
    @Column(nullable = false)
    private boolean active = true;

    /**
     * Time when the record was created.
     *
     * This value is set once and should not be updated.
     */
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Default constructor required by JPA.
     * Not meant to be used directly.
     */
    public State() { }

    /**
     * Creates a new State.
     *
     * @param id   Public governance ID
     * @param name Official name
     * @param type Region type (STATE / UNION_TERRITORY)
     */
    public State(String id, String name, String type) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.createdAt = Instant.now();
    }

    // ---- Read-only getters ----

    /**
     * @return Governance ID
     */
    public String getId() {
        return id;
    }

    /**
     * @return Official name
     */
    public String getName() {
        return name;
    }

    /**
     * @return Region type
     */
    public String getType() {
        return type;
    }

    /**
     * @return True if the state is active
     */
    public boolean isActive() {
        return active;
    }

    /**
     * @return Creation timestamp
     */
    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setType(String type) {
        this.type = type;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
