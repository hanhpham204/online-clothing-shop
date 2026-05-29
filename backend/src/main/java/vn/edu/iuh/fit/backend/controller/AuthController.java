package vn.edu.iuh.fit.backend.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.iuh.fit.backend.dto.auth.AuthResponse;
import vn.edu.iuh.fit.backend.dto.auth.GoogleLoginRequest;
import vn.edu.iuh.fit.backend.dto.auth.LoginRequest;
import vn.edu.iuh.fit.backend.dto.auth.MessageResponse;
import vn.edu.iuh.fit.backend.dto.auth.RefreshTokenRequest;
import vn.edu.iuh.fit.backend.dto.auth.RegisterResponse;
import vn.edu.iuh.fit.backend.dto.auth.ResendEmailOtpRequest;
import vn.edu.iuh.fit.backend.dto.auth.RegisterRequest;
import vn.edu.iuh.fit.backend.dto.auth.VerifyEmailOtpRequest;
import vn.edu.iuh.fit.backend.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request.idToken()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.logout(request));
    }

    @PostMapping("/verify-email-otp")
    public ResponseEntity<MessageResponse> verifyEmailOtp(@Valid @RequestBody VerifyEmailOtpRequest request) {
        return ResponseEntity.ok(authService.verifyEmailOtp(request));
    }

    @PostMapping("/resend-email-otp")
    public ResponseEntity<MessageResponse> resendEmailOtp(@Valid @RequestBody ResendEmailOtpRequest request) {
        return ResponseEntity.ok(authService.resendEmailOtp(request));
    }
}
