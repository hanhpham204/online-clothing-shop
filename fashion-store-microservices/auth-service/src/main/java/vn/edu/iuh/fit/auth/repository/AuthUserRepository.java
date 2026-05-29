package vn.edu.iuh.fit.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.iuh.fit.auth.domain.entity.AuthUser;

import java.util.Optional;

public interface AuthUserRepository extends JpaRepository<AuthUser, Long> {
    Optional<AuthUser> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<AuthUser> findByProviderAndProviderId(String provider, String providerId);
}
