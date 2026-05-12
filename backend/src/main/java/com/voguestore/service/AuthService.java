package com.voguestore.service;

import com.voguestore.dto.request.ChangePasswordRequest;
import com.voguestore.dto.request.LoginRequest;
import com.voguestore.dto.request.RegisterRequest;
import com.voguestore.dto.response.AuthResponse;
import com.voguestore.entity.AuthSession;
import com.voguestore.entity.User;
import com.voguestore.enums.Role;
import com.voguestore.exception.BadRequestException;
import com.voguestore.exception.ResourceNotFoundException;
import com.voguestore.exception.UnauthorizedException;
import com.voguestore.repository.AuthSessionRepository;
import com.voguestore.repository.UserRepository;
import com.voguestore.security.DeviceMetadataResolver;
import com.voguestore.security.JwtTokenProvider;
import com.voguestore.security.RefreshTokenGenerator;
import com.voguestore.security.TokenHashService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AuthSessionRepository authSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final RedisService redisService;
    private final RefreshTokenGenerator refreshTokenGenerator;
    private final TokenHashService tokenHashService;
    private final DeviceMetadataResolver deviceMetadataResolver;
    private final LoginAttemptService loginAttemptService;
    private final SessionService sessionService;

    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }
        validatePasswordStrength(request.getPassword());

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(Role.USER)
                .isActive(true)
                .build();

        user = userRepository.save(user);
        log.info("auth.audit event=register_success userId={} email={}", user.getId(), user.getEmail());

        return generateAuthResponse(user, httpRequest);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String throttleKey = request.getEmail().toLowerCase() + ":" + httpRequest.getRemoteAddr();
        loginAttemptService.assertLoginAllowed(throttleKey);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            loginAttemptService.recordFailedAttempt(throttleKey);
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!user.getIsActive()) {
            loginAttemptService.recordFailedAttempt(throttleKey);
            throw new UnauthorizedException("Account is deactivated");
        }

        loginAttemptService.recordSuccessfulAttempt(throttleKey);
        log.info("auth.audit event=login_success userId={} email={}", user.getId(), user.getEmail());
        return generateAuthResponse(user, httpRequest);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken, HttpServletRequest httpRequest) {
        String hashedToken = tokenHashService.hash(refreshToken);
        AuthSession currentSession = authSessionRepository.findByRefreshTokenHash(hashedToken)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (currentSession.isRevoked() || currentSession.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException("Refresh token has expired or been revoked");
        }

        currentSession.setRevoked(true);
        currentSession.setRevokedAt(LocalDateTime.now());
        authSessionRepository.save(currentSession);

        User user = currentSession.getUser();
        if (user == null || !Boolean.TRUE.equals(user.getIsActive())) {
            throw new UnauthorizedException("User is inactive");
        }

        log.info("auth.audit event=refresh_token_rotated userId={} oldSessionId={}", user.getId(), currentSession.getId());
        return generateAuthResponse(user, httpRequest);
    }

    @Transactional
    public void logoutByRefreshToken(String refreshToken) {
        String hashedToken = tokenHashService.hash(refreshToken);
        sessionService.revokeByRefreshTokenHash(hashedToken);
        log.info("auth.audit event=logout_current_session");
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        if (request.getOldPassword().equals(request.getNewPassword())) {
            throw new BadRequestException("New password must be different from current password");
        }

        validatePasswordStrength(request.getNewPassword());
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        sessionService.revokeAllSessions(userId);
        log.info("auth.audit event=password_changed userId={}", userId);
    }

    public void revokeAccessToken(String token) {
        if (tokenProvider.validateAccessToken(token)) {
            redisService.blacklistToken(tokenProvider.getJtiFromToken(token), tokenProvider.getExpirationFromToken(token));
        }
    }

    private AuthResponse generateAuthResponse(User user, HttpServletRequest httpRequest) {
        String refreshToken = refreshTokenGenerator.generate();
        AuthSession session = buildSession(user, refreshToken, httpRequest);
        authSessionRepository.save(session);
        String accessToken = tokenProvider.generateAccessToken(user.getId(), List.of(user.getRole().name()), session.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getAccessExpiration())
                .user(buildUserInfo(user))
                .build();
    }

    private AuthSession buildSession(User user, String refreshToken, HttpServletRequest request) {
        DeviceMetadataResolver.DeviceMetadata metadata = deviceMetadataResolver.resolve(request);
        return AuthSession.builder()
                .user(user)
                .refreshTokenHash(tokenHashService.hash(refreshToken))
                .deviceName(metadata.getDeviceName())
                .browser(metadata.getBrowser())
                .os(metadata.getOs())
                .ipAddress(metadata.getIpAddress())
                .approximateLocation(metadata.getApproximateLocation())
                .userAgent(metadata.getUserAgent())
                .expiresAt(LocalDateTime.now().plus(Duration.ofMillis(tokenProvider.getRefreshExpiration())))
                .revoked(false)
                .build();
    }

    private void validatePasswordStrength(String password) {
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = password.chars().anyMatch(ch -> !Character.isLetterOrDigit(ch));
        if (password.length() < 8 || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
            throw new BadRequestException("Password must be at least 8 chars and include upper, lower, number, symbol");
        }
    }

    private AuthResponse.UserInfo buildUserInfo(User user) {
        return AuthResponse.UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .build();
    }
}
