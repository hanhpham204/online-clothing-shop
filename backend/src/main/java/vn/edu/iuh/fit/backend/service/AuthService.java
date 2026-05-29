package vn.edu.iuh.fit.backend.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.iuh.fit.backend.dto.auth.AuthResponse;
import vn.edu.iuh.fit.backend.dto.auth.LoginRequest;
import vn.edu.iuh.fit.backend.dto.auth.MessageResponse;
import vn.edu.iuh.fit.backend.dto.auth.RefreshTokenRequest;
import vn.edu.iuh.fit.backend.dto.auth.RegisterResponse;
import vn.edu.iuh.fit.backend.dto.auth.ResendEmailOtpRequest;
import vn.edu.iuh.fit.backend.dto.auth.RegisterRequest;
import vn.edu.iuh.fit.backend.dto.auth.VerifyEmailOtpRequest;
import vn.edu.iuh.fit.backend.entity.RefreshToken;
import vn.edu.iuh.fit.backend.entity.Role;
import vn.edu.iuh.fit.backend.entity.User;
import vn.edu.iuh.fit.backend.repository.RefreshTokenRepository;
import vn.edu.iuh.fit.backend.repository.RoleRepository;
import vn.edu.iuh.fit.backend.repository.UserRepository;
import vn.edu.iuh.fit.backend.security.CustomUserDetailsService;
import vn.edu.iuh.fit.backend.security.GoogleTokenVerifierService;
import vn.edu.iuh.fit.backend.security.JwtService;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
@RequiredArgsConstructor
public class AuthService {

    public static final String DEFAULT_ROLE = "USER";
    private final GoogleTokenVerifierService googleTokenVerifier;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.email-verification.otp-expiration-minutes:10}")
    private long otpExpirationMinutes;

    @Transactional
    public AuthResponse loginWithGoogle(String idToken) {
    GoogleIdToken.Payload payload = googleTokenVerifier.verify(idToken);

    String email = ((String) payload.getEmail()).toLowerCase();
    String sub = payload.getSubject();
    String name = (String) payload.get("name");
    String picture = (String) payload.get("picture");
    Boolean emailVerified = payload.getEmailVerified();

    if (!Boolean.TRUE.equals(emailVerified)) {
        throw new ResponseStatusException(BAD_REQUEST, "Google email is not verified");
    }

    User user = userRepository.findByEmail(email).orElseGet(() -> {
        Role role = roleRepository.findByRoleName(DEFAULT_ROLE)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Default role USER does not exist"));
        User u = new User();
        u.setEmail(email);
        u.setName(name != null ? name : email);
        u.setRole(role);
        u.setActive(true);
        u.setProvider("GOOGLE");
        u.setProviderId(sub);
        u.setAvatarUrl(picture);
        u.setEmailVerified(true);
        u.setEmailVerificationOtp(null);
        u.setEmailVerificationOtpExpiresAt(null);
        // password giữ null
        return userRepository.save(u);
    });

    // Nếu user đã tồn tại dạng LOCAL, có 2 lựa chọn: từ chối hoặc link.
    // Ở đây chọn "link": đánh dấu user này cũng dùng được Google
    if (user.getProviderId() == null) {
        user.setProviderId(sub);
        if (user.getAvatarUrl() == null) user.setAvatarUrl(picture);
    }
    if (!user.isEmailVerified()) {
        user.setEmailVerified(true);
        user.setEmailVerificationOtp(null);
        user.setEmailVerificationOtpExpiresAt(null);
    }

    return buildAuthResponse(user);
}

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(BAD_REQUEST, "Email already exists");
        }

        Role role = roleRepository.findByRoleName(DEFAULT_ROLE)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Default role USER does not exist"));

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setName(request.name().trim());
        user.setRole(role);
        user.setActive(true);
        user.setProvider("LOCAL");
        user.setEmailVerified(false);

        String otp = generateOtp();
        user.setEmailVerificationOtp(otp);
        user.setEmailVerificationOtpExpiresAt(Instant.now().plus(otpExpirationMinutes, ChronoUnit.MINUTES));

        User savedUser = userRepository.save(user);
        emailService.sendEmailVerificationOtp(savedUser.getEmail(), savedUser.getName(), otp, otpExpirationMinutes);

        return new RegisterResponse(
                "Register successful. Please verify your email with the OTP code sent to your inbox.",
                savedUser.getEmail(),
                true
        );
    }

    @Transactional
    public MessageResponse verifyEmailOtp(VerifyEmailOtpRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        String normalizedOtp = request.otp().trim();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Invalid email or OTP"));

        if (user.isEmailVerified()) {
            return new MessageResponse("Email is already verified.");
        }

        if (user.getEmailVerificationOtp() == null || user.getEmailVerificationOtpExpiresAt() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "OTP not requested. Please request a new OTP.");
        }

        if (!user.getEmailVerificationOtp().equals(normalizedOtp)) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid email or OTP");
        }

        if (Instant.now().isAfter(user.getEmailVerificationOtpExpiresAt())) {
            throw new ResponseStatusException(BAD_REQUEST, "OTP has expired. Please request a new OTP.");
        }

        user.setEmailVerified(true);
        user.setEmailVerificationOtp(null);
        user.setEmailVerificationOtpExpiresAt(null);
        userRepository.save(user);

        return new MessageResponse("Email verified successfully.");
    }

    @Transactional
    public MessageResponse resendEmailOtp(ResendEmailOtpRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Account not found"));

        if (user.isEmailVerified()) {
            return new MessageResponse("Email is already verified.");
        }

        String otp = generateOtp();
        user.setEmailVerificationOtp(otp);
        user.setEmailVerificationOtpExpiresAt(Instant.now().plus(otpExpirationMinutes, ChronoUnit.MINUTES));
        userRepository.save(user);

        emailService.sendEmailVerificationOtp(user.getEmail(), user.getName(), otp, otpExpirationMinutes);
        return new MessageResponse("A new OTP has been sent to your email.");
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password())
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if ("LOCAL".equalsIgnoreCase(user.getProvider()) && !user.isEmailVerified()) {
            throw new ResponseStatusException(FORBIDDEN, "Email is not verified. Please verify OTP before login.");
        }

        return buildAuthResponse(user);
    }

    /**
     * Đổi refresh token lấy cặp access/refresh token mới (rotate refresh token).
     *
     * Bảo mật:
     * - JWT phải parse được + đúng {@code type=refresh} + chưa hết hạn.
     * - Row trong {@code refresh_tokens} phải tồn tại và CHƯA bị revoke.
     * - Nếu jti đã bị revoke nhưng client vẫn đưa lên ⇒ token đã rotate trước đó bị
     *   replay ⇒ revoke toàn bộ refresh token của user (force logout-all) + 401.
     */
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String refreshToken = request.refreshToken();
        String email;
        String jti;
        try {
            email = jwtService.extractUsername(refreshToken);
            jti = jwtService.extractJti(refreshToken);
        } catch (Exception ex) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid refresh token");
        }
        if (jti == null || jti.isBlank()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid refresh token");
        }

        UserDetails userDetails;
        try {
            userDetails = userDetailsService.loadUserByUsername(email);
        } catch (UsernameNotFoundException ex) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid refresh token");
        }

        if (!jwtService.isTokenValid(refreshToken, userDetails, JwtService.TYPE_REFRESH)) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid or expired refresh token");
        }

        Optional<RefreshToken> stored = refreshTokenRepository.findById(jti);
        if (stored.isEmpty()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Refresh token not recognised");
        }
        RefreshToken existing = stored.get();

        // Token reuse detected: jti đã bị rotate trước đó nhưng giờ lại được dùng nữa.
        if (existing.isRevoked()) {
            refreshTokenRepository.revokeAllByUserId(existing.getUser().getId());
            throw new ResponseStatusException(UNAUTHORIZED, "Refresh token reuse detected. All sessions revoked.");
        }
        if (Instant.now().isAfter(existing.getExpiresAt())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Refresh token expired");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid refresh token"));

        // Rotate: issue cặp mới, đánh dấu jti cũ revoked + link tới jti mới.
        String newJti = UUID.randomUUID().toString();
        AuthResponse response = buildAuthResponse(user, newJti);

        existing.setRevoked(true);
        existing.setReplacedByJti(newJti);
        refreshTokenRepository.save(existing);

        return response;
    }

    /**
     * Revoke refresh token (logout server-side). Idempotent: token không tồn tại/expired
     * thì cũng coi như logout thành công.
     */
    @Transactional
    public MessageResponse logout(RefreshTokenRequest request) {
        String refreshToken = request.refreshToken();
        if (refreshToken == null || refreshToken.isBlank()) {
            return new MessageResponse("Logged out.");
        }
        try {
            String jti = jwtService.extractJti(refreshToken);
            if (jti != null && !jti.isBlank()) {
                refreshTokenRepository.findById(jti).ifPresent(rt -> {
                    if (!rt.isRevoked()) {
                        rt.setRevoked(true);
                        refreshTokenRepository.save(rt);
                    }
                });
            }
        } catch (Exception ignored) {
            // Token không parse được vẫn coi như logout (client đã quên token).
        }
        return new MessageResponse("Logged out.");
    }

    private AuthResponse buildAuthResponse(User user) {
        return buildAuthResponse(user, UUID.randomUUID().toString());
    }

    private AuthResponse buildAuthResponse(User user, String refreshJti) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        Map<String, Object> claims = Map.of(
                "role", user.getRole().getRoleName(),
                "userId", user.getId()
        );
        String accessToken = jwtService.generateAccessToken(userDetails, claims);
        String refreshToken = jwtService.generateRefreshToken(userDetails, refreshJti);

        // Persist refresh token row (chỉ jti + metadata, KHÔNG lưu raw JWT).
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
                user.getName(),
                user.getRole().getRoleName()
        );
    }

    private String generateOtp() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }
}
