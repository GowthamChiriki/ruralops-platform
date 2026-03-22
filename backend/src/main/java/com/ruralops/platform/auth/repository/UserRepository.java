package com.ruralops.platform.auth.repository;

import com.ruralops.platform.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /* =====================================================
       FIND USER BY PHONE (LOGIN)
       ===================================================== */

    Optional<User> findByPhone(String phoneNumber);

    /* =====================================================
       CHECK IF PHONE ALREADY EXISTS
       (used during registration)
       ===================================================== */

    boolean existsByPhone(String phone);

}