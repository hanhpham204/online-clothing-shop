package com.voguestore.repository;

import com.voguestore.entity.AuthSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {

    Optional<AuthSession> findByRefreshTokenHash(String refreshTokenHash);

    @Query("""
        select s from AuthSession s
        where s.user.id = :userId and s.revoked = false and s.expiresAt > :now
        order by s.lastActiveAt desc
        """)
    List<AuthSession> findActiveSessionsByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    Optional<AuthSession> findByIdAndUser_Id(Long id, Long userId);

    @Modifying
    @Query("""
        update AuthSession s
        set s.revoked = true, s.revokedAt = :revokedAt
        where s.user.id = :userId and s.id <> :currentSessionId and s.revoked = false
        """)
    int revokeOtherSessions(@Param("userId") Long userId,
                            @Param("currentSessionId") Long currentSessionId,
                            @Param("revokedAt") LocalDateTime revokedAt);

    @Modifying
    @Query("""
        update AuthSession s
        set s.revoked = true, s.revokedAt = :revokedAt
        where s.user.id = :userId and s.revoked = false
        """)
    int revokeAllSessions(@Param("userId") Long userId, @Param("revokedAt") LocalDateTime revokedAt);
}
