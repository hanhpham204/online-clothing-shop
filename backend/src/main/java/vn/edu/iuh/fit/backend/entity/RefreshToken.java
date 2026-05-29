package vn.edu.iuh.fit.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Lưu metadata của mỗi refresh token đã cấp.
 *
 * - {@code jti} là UUID nằm trong claim {@code jti} của JWT refresh token, dùng để tra DB.
 * - Refresh token JWT vẫn ký bằng HMAC nên không lưu giá trị token trong DB; chỉ lưu jti +
 *   user + expiresAt + revoked + replacedByJti để xoay vòng và phát hiện reuse.
 */
@Entity
@Table(
        name = "refresh_tokens",
        indexes = {
                @Index(name = "idx_refresh_tokens_user_id", columnList = "user_id"),
                @Index(name = "idx_refresh_tokens_expires_at", columnList = "expires_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    /** UUID tự sinh khi cấp refresh token; trùng với claim {@code jti} của JWT. */
    @Id
    @Column(name = "jti", length = 64, nullable = false, updatable = false)
    private String jti;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked", nullable = false)
    private boolean revoked;

    /** jti của refresh token mới (sinh ra sau khi rotate). Dùng để dò chuỗi reuse. */
    @Column(name = "replaced_by_jti", length = 64)
    private String replacedByJti;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
