package com.ruralops.platform.governance.repository;

import com.ruralops.platform.governance.domain.State;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository for managing State entities.
 *
 * Provides basic CRUD operations through JpaRepository
 * along with additional query methods for name-based lookup.
 */
public interface StateRepository extends JpaRepository<State, String> {

    /**
     * Checks whether a State exists with the given name.
     *
     * @param name Official state or UT name
     * @return true if a matching State exists
     */
    boolean existsByName(String name);

    /**
     * Finds a State by its official name.
     *
     * @param name Official state or UT name
     * @return Optional containing the State if found
     */
    Optional<State> findByName(String name);
}
