package com.voguestore.service;

import com.voguestore.dto.response.SessionResponse;
import com.voguestore.entity.AuthSession;
import com.voguestore.entity.User;
import com.voguestore.exception.BadRequestException;
import com.voguestore.exception.ResourceNotFoundException;
import com.voguestore.exception.UnauthorizedException;
import com.voguestore.repository.AuthSessionRepository;
import com.voguestore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionService {

    private final AuthSessionRepository authSessionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<SessionResponse> getActiveSessions(Long userId, Long currentSessionId) {
        return authSessionRepository.findActiveSessionsByUserId(userId, LocalDateTime.now()).stream()
                .map(session -> toResponse(session, session.getId().equals(currentSessionId)))
                .toList();
    }

    @Transactional
    public void revokeSession(Long userId, Long sessionId, String password) {
        User user = requireUser(userId);
        assertPassword(password, user);

        AuthSession session = authSessionRepository.findByIdAndUser_Id(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        revoke(session);
        log.info("auth.audit event=session_revoked userId={} sessionId={}", userId, sessionId);
    }

    @Transactional
    public int revokeAllOtherSessions(Long userId, Long currentSessionId, String password) {
        User user = requireUser(userId);
        assertPassword(password, user);
        int revokedCount = authSessionRepository.revokeOtherSessions(userId, currentSessionId, LocalDateTime.now());
        log.info("auth.audit event=other_sessions_revoked userId={} currentSessionId={} revokedCount={}",
                userId, currentSessionId, revokedCount);
        return revokedCount;
    }

    @Transactional
    public void revokeByRefreshTokenHash(String refreshTokenHash) {
        authSessionRepository.findByRefreshTokenHash(refreshTokenHash).ifPresent(session -> {
            if (!session.isRevoked()) {
                revoke(session);
            }
        });
    }

    @Transactional
    public void revokeAllSessions(Long userId) {
        authSessionRepository.revokeAllSessions(userId, LocalDateTime.now());
    }

    @Transactional
    public void touchSession(Long sessionId) {
        AuthSession session = authSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        session.setLastActiveAt(LocalDateTime.now());
        authSessionRepository.save(session);
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void assertPassword(String password, User user) {
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new UnauthorizedException("Password confirmation failed");
        }
    }

    private void revoke(AuthSession session) {
        if (session.isRevoked()) {
            throw new BadRequestException("Session already revoked");
        }
        session.setRevoked(true);
        session.setRevokedAt(LocalDateTime.now());
        authSessionRepository.save(session);
    }

    private SessionResponse toResponse(AuthSession session, boolean currentSession) {
        return SessionResponse.builder()
                .id(session.getId())
                .deviceName(session.getDeviceName())
                .browser(session.getBrowser())
                .os(session.getOs())
                .ipAddress(session.getIpAddress())
                .approximateLocation(session.getApproximateLocation())
                .userAgent(session.getUserAgent())
                .createdAt(session.getCreatedAt())
                .lastActiveAt(session.getLastActiveAt())
                .expiresAt(session.getExpiresAt())
                .currentSession(currentSession)
                .build();
    }
}
