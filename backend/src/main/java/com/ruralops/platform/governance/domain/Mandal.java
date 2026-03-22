package com.ruralops.platform.governance.domain;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Represents a Mandal in the governance hierarchy.
 *
 * A Mandal belongs to one Assembly Constituency.
 * The combination of (constituency_id, name) must be unique.
 */
@Entity
@Table(
        name = "mandals",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"constituency_id", "name"})
        }
)
public class Mandal {

    /**
     * Public governance identifier.
     *
     * Example: MDG-4832, CDV-7291
     * This ID is assigned externally and is not database-generated.
     */
    @Id
    @Column(length = 15, nullable = false)
    private String id;

    /**
     * Parent Assembly Constituency.
     *
     * Defines the administrative relationship.
     * A Mandal cannot exist without a Constituency.
     */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "constituency_id", nullable = false)
    private Constituency constituency;

    /**
     * Official Mandal name.
     *
     * Must be unique within the same Constituency.
     */
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * Indicates whether the Mandal is active.
     *
     * Used for soft disabling instead of deleting records.
     */
    @Column(nullable = false)
    private boolean active = true;

    /**
     * Timestamp when the record was created.
     *
     * Set at construction time and not updated afterwards.
     */
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Default constructor required by JPA.
     */
    protected Mandal() {
        // For JPA
    }

    /**
     * Creates a new Mandal instance.
     *
     * @param id           Public governance ID
     * @param constituency Parent Assembly Constituency
     * @param name         Official Mandal name
     */
    public Mandal(String id, Constituency constituency, String name) {
        this.id = id;
        this.constituency = constituency;
        this.name = name;
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public Constituency getConstituency() {
        return constituency;
    }

    public String getName() {
        return name;
    }

    public boolean isActive() {
        return active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
