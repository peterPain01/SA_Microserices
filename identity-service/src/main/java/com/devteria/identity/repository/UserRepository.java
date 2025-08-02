package com.devteria.identity.repository;

import java.util.Optional;

import com.devteria.identity.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<AppUser, String> {
    boolean existsByUsername(String username);

    Optional<AppUser> findByUsername(String username);
}
