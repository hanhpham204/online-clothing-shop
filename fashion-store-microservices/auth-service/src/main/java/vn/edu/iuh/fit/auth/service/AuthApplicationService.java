package vn.edu.iuh.fit.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.iuh.fit.auth.config.JwtService;
import vn.edu.iuh.fit.auth.domain.entity.AuthUser;
import vn.edu.iuh.fit.auth.domain.entity.RefreshToken;
import vn.edu.iuh.fit.auth.dto.AdminUserResponse;
import vn.edu.iuh.fit.auth.dto.AuthResponse;
import vn.edu.iuh.fit.auth.dto.GoogleLoginRequest;
import vn.edu.iuh.fit.auth.dto.LoginRequest;
import vn.edu.iuh.fit.auth.dto.MessageResponse;
import vn.edu.iuh.fit.auth.dto.RefreshTokenRequest;
import vn.edu.iuh.fit.auth.dto.RegisterRequest;
import vn.edu.iuh.fit.auth.dto.RegisterResponse;
import vn.edu.iuh.fit.auth.dto.ResendEmailOtpRequest;
import vn.edu.iuh.fit.auth.dto.UpdateUserStatusRequest;
import vn.edu.iuh.fit.auth.dto.VerifyEmailOtpRequest;
import vn.edu.iuh.fit.auth.repository.AuthUserRepository;
import vn.edu.iuh.fit.auth.repository.RefreshTokenRepository;
import vn.edu.iuh.fit.common.event.EventRoutingKeys;
import vn.edu.iuh.fit.common.event.UserRegisteredEvent;
import vn.edu.iuh.fit.common.exception.BusinessException;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthApplicationService {
    private static final String DEFAULT_ROLE = "USER";
    private static final String GOOGLE_PROVIDER = "GOOGLE";
    private static final String LOCAL_PROVIDER = "LOCAL";

    private final AuthUserRepository authUserRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RabbitTemplate rabbitTemplate;
    private final RedisCacheService redisCacheService;
    private final EmailService emailService;
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.email-verification.otp-expiration-minutes:10}")
    private long otpExpirationMinutes;

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (authUserRepository.existsByEmail(email)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "EMAIL_EXISTS", "Email already registered");
        }

        AuthUser user = new AuthUser();
        user.setEmail(email);
        user.setFullName(request.fullName().trim());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(DEFAULT_ROLE);
        user.setProvider(LOCAL_PROVIDER);
        user.setActive(true);
        user.setEmailVerified(false);
        applyNewEmailOtp(user);

        AuthUser saved = authUserRepository.save(user);
        emailService.sendEmailVerificationOtp(saved.getEmail(), saved.getFullName(), saved.getEmailVerificationOtp(), otpExpirationMinutes);

        rabbitTemplate.convertAndSend(
                EventRoutingKeys.EXCHANGE,
                EventRoutingKeys.USER_REGISTERED,
                new UserRegisteredEvent(saved.getId(), saved.getEmail(), saved.getFullName(), saved.getCreatedAt())
        );

        return new RegisterResponse(
                "Register successful. Please verify your email with the OTP code sent to your inbox.",
                saved.getEmail(),
                true
        );
    }

    @Transactional
    public MessageResponse verifyEmailOtp(VerifyEmailOtpRequest request) {
        String email = normalizeEmail(request.email());
        AuthUser user = authUserRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Invalid email or OTP"));

        if (user.isEmailVerified()) {
            return new MessageResponse("Email is already verified.");
        }
        String otp = request.otp().trim();
        String cacheKey = otpKey(email);
        Optional<String> cachedOtp = redisCacheService.get(cacheKey);
        String expectedOtp = cachedOtp.orElse(user.getEmailVerificationOtp());

        if (expectedOtp == null || user.getEmailVerificationOtpExpiresAt() == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "OTP_NOT_REQUESTED", "OTP not requested. Please request a new OTP.");
        }
        if (Instant.now().isAfter(user.getEmailVerificationOtpExpiresAt())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "OTP_EXPIRED", "OTP has expired. Please request a new OTP.");
        }
        if (!expectedOtp.equals(otp)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Invalid email or OTP");
        }

        user.setEmailVerified(true);
        user.setEmailVerificationOtp(null);
        user.setEmailVerificationOtpExpiresAt(null);
        authUserRepository.save(user);
        redisCacheService.delete(cacheKey);
        return new MessageResponse("Email verified successfully.");
    }

    @Transactional
    public MessageResponse resendEmailOtp(ResendEmailOtpRequest request) {
        String email = normalizeEmail(request.email());
        AuthUser user = authUserRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "ACCOUNT_NOT_FOUND", "Account not found"));
        if (user.isEmailVerified()) {
            return new MessageResponse("Email is already verified.");
        }
        applyNewEmailOtp(user);
        authUserRepository.save(user);
        emailService.sendEmailVerificationOtp(user.getEmail(), user.getFullName(), user.getEmailVerificationOtp(), otpExpirationMinutes);
        return new MessageResponse("A new OTP has been sent to your email.");
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        AuthUser user = authUserRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid login"));
        if (!user.isActive()) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "Account is disabled");
        }
        if (user.getPassword() == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid login");
        }
        if (LOCAL_PROVIDER.equalsIgnoreCase(user.getProvider()) && !user.isEmailVerified()) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED", "Email is not verified. Please verify OTP before login.");
        }
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleIdToken.Payload payload = googleTokenVerifierService.verify(request.idToken());
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "GOOGLE_EMAIL_NOT_VERIFIED", "Google email is not verified");
        }

        String email = normalizeEmail(payload.getEmail());
        String providerId = payload.getSubject();
        String name = payload.get("name") instanceof String googleName ? googleName : email;
        String picture = payload.get("picture") instanceof String avatar ? avatar : null;

        AuthUser user = authUserRepository.findByEmail(email)
                .orElseGet(() -> {
                    AuthUser created = new AuthUser();
                    created.setEmail(email);
                    created.setFullName(name);
                    created.setRole(DEFAULT_ROLE);
                    created.setActive(true);
                    created.setProvider(GOOGLE_PROVIDER);
                    created.setProviderId(providerId);
                    created.setAvatarUrl(picture);
                    created.setEmailVerified(true);
                    return authUserRepository.save(created);
                });

        if (!user.isActive()) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "Account is disabled");
        }
        if (user.getProviderId() == null || user.getProviderId().isBlank()) {
            user.setProviderId(providerId);
        }
        if (user.getProvider() == null || LOCAL_PROVIDER.equalsIgnoreCase(user.getProvider())) {
            user.setProvider(GOOGLE_PROVIDER);
        }
        if (picture != null && (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank())) {
            user.setAvatarUrl(picture);
        }
        user.setEmailVerified(true);
        user.setEmailVerificationOtp(null);
        user.setEmailVerificationOtpExpiresAt(null);
        return issueTokens(authUserRepository.save(user));
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String refreshToken = request.refreshToken();
        String email;
        String jti;
        try {
            email = jwtService.extractEmail(refreshToken);
            jti = jwtService.extractJti(refreshToken);
        } catch (Exception ex) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH", "Invalid refresh token");
        }
        if (jti == null || jti.isBlank() || !jwtService.isRefreshToken(refreshToken)) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH", "Invalid refresh token");
        }

        RefreshToken existing = refreshTokenRepository.findById(jti)
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "UNKNOWN_REFRESH", "Refresh token not recognised"));

        if (existing.isRevoked()) {
            refreshTokenRepository.revokeAllByUserId(existing.getUser().getId());
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "REFRESH_REUSE_DETECTED", "Refresh token reuse detected. All sessions revoked.");
        }
        if (Instant.now().isAfter(existing.getExpiresAt())) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "REFRESH_EXPIRED", "Refresh token expired");
        }

        AuthUser user = authUserRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH", "Invalid refresh token"));
        String newJti = UUID.randomUUID().toString();
        AuthResponse response = issueTokens(user, newJti);

        existing.setRevoked(true);
        existing.setReplacedByJti(newJti);
        refreshTokenRepository.save(existing);
        return response;
    }

    @Transactional
    public MessageResponse logout(RefreshTokenRequest request) {
        if (request == null || request.refreshToken() == null || request.refreshToken().isBlank()) {
            return new MessageResponse("Logged out.");
        }
        try {
            String jti = jwtService.extractJti(request.refreshToken());
            if (jti != null && !jti.isBlank()) {
                refreshTokenRepository.findById(jti).ifPresent(token -> {
                    if (!token.isRevoked()) {
                        token.setRevoked(true);
                        refreshTokenRepository.save(token);
                    }
                });
            }
        } catch (Exception ignored) {
            // Logout remains idempotent even for malformed tokens.
        }
        return new MessageResponse("Logged out.");
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> listUsers() {
        return authUserRepository.findAll().stream().map(this::toAdminUser).toList();
    }

    @Transactional
    public AdminUserResponse updateUserStatus(Long userId, UpdateUserStatusRequest request) {
        AuthUser user = authUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));
        user.setActive(request.isActive());
        return toAdminUser(authUserRepository.save(user));
    }

    private AuthResponse issueTokens(AuthUser user) {
        return issueTokens(user, UUID.randomUUID().toString());
    }

    private AuthResponse issueTokens(AuthUser user, String refreshJti) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail(), refreshJti);

        RefreshToken row = new RefreshToken();
        row.setJti(refreshJti);
        row.setUser(user);
        row.setExpiresAt(Instant.now().plusSeconds(jwtService.getRefreshTokenExpirationSeconds()));
        row.setRevoked(false);
        refreshTokenRepository.save(row);

        return new AuthResponse(
                accessToken,
                refreshToken,
                "Bearer",
                jwtService.getAccessTokenExpirationSeconds(),
                jwtService.getRefreshTokenExpirationSeconds(),
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole()
        );
    }

    private void applyNewEmailOtp(AuthUser user) {
        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));
        user.setEmailVerificationOtp(otp);
        user.setEmailVerificationOtpExpiresAt(Instant.now().plus(otpExpirationMinutes, ChronoUnit.MINUTES));
        redisCacheService.set(otpKey(user.getEmail()), otp, Duration.ofMinutes(otpExpirationMinutes));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String otpKey(String email) {
        return "auth:email-otp:" + email;
    }

    private AdminUserResponse toAdminUser(AuthUser user) {
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.isActive(),
                user.isEmailVerified(),
                user.getProvider(),
                user.getAvatarUrl()
        );
    }
}
