package com.ruralops.platform.governance.domain;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Represents an Area (street / locality / ward) within a Village.
 *
 * A Village can contain multiple Areas.
 * The combination of (village_id, name) must be unique.
 */
@Entity
@Table(
        name = "areas",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"village_id", "name"})
        }
)
public class Area {

    /**
     * Internal database identifier.
     *
     * Unlike Village IDs, Area IDs are generated
     * automatically by the database.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Parent Village.
     *
     * Defines the geographical hierarchy.
     * An Area cannot exist without a Village.
     */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "village_id", nullable = false)
    private Village village;

    /**
     * Area name.
     *
     * Example:
     * Temple Street
     * Market Road
     * East Colony
     *
     * Must be unique within the same Village.
     */
    @Column(nullable = false, length = 120)
    private String name;

    /**
     * Indicates whether the Area is active.
     *
     * Used for soft disabling instead of deleting the record.
     */
    @Column(nullable = false)
    private boolean active = true;

    /**
     * Timestamp when the Area record was created.
     *
     * Set during construction and never updated.
     */
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Default constructor required by JPA.
     */
    protected Area() {
        // For JPA
    }

    /**
     * Creates a new Area inside a Village.
     *
     * @param village Parent village
     * @param name    Area name
     */
    public Area(Village village, String name) {
        this.village = village;
        this.name = name;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Village getVillage() {
        return village;
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

    public void setId(Long id) {
        this.id = id;
    }

    public void setVillage(Village village) {
        this.village = village;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}