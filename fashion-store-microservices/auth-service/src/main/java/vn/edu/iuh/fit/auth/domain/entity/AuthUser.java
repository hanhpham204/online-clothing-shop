package vn.edu.iuh.fit.auth.domain.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "auth_users", indexes = {
        @Index(name = "idx_auth_users_email", columnList = "email", unique = true),
        @Index(name = "idx_auth_users_provider_id", columnList = "providerId")
})
public class AuthUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    private String password;
    private String fullName;
    private String role;
    private boolean active = true;
    private String provider = "LOCAL";
    private String providerId;
    private String avatarUrl;
    private boolean emailVerified;
    private String emailVerificationOtp;
    private Instant emailVerificationOtpExpiresAt;
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (role == null || role.isBlank()) {
            role = "USER";
        }
        if (provider == null || provider.isBlank()) {
            provider = "LOCAL";
        }
    }
}
