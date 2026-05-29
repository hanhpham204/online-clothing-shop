package vn.edu.iuh.fit.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.iuh.fit.auth.dto.AuthResponse;
import vn.edu.iuh.fit.auth.dto.GoogleLoginRequest;
import vn.edu.iuh.fit.auth.dto.LoginRequest;
import vn.edu.iuh.fit.auth.dto.MessageResponse;
import vn.edu.iuh.fit.auth.dto.RefreshTokenRequest;
import vn.edu.iuh.fit.auth.dto.RegisterRequest;
import vn.edu.iuh.fit.auth.dto.RegisterResponse;
import vn.edu.iuh.fit.auth.dto.ResendEmailOtpRequest;
import vn.edu.iuh.fit.auth.dto.VerifyEmailOtpRequest;
import vn.edu.iuh.fit.auth.service.AuthApplicationService;
import vn.edu.iuh.fit.common.dto.ApiResponse;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthApplicationService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<RegisterResponse>builder()
                .success(true)
                .message("Register successful")
                .data(authService.register(request))
                .build());
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Login successful")
                .data(authService.login(request))
                .build());
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> google(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Google login successful")
                .data(authService.loginWithGoogle(request))
                .build());
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Refresh successful")
                .data(authService.refresh(request))
                .build());
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<MessageResponse>> logout(@RequestBody(required = false) RefreshTokenRequest request) {
        return ResponseEntity.ok(ApiResponse.<MessageResponse>builder()
                .success(true)
                .message("Logout successful")
                .data(authService.logout(request))
                .build());
    }

    @PostMapping("/verify-email-otp")
    public ResponseEntity<ApiResponse<MessageResponse>> verifyEmailOtp(@Valid @RequestBody VerifyEmailOtpRequest request) {
        return ResponseEntity.ok(ApiResponse.<MessageResponse>builder()
                .success(true)
                .message("Email verified")
                .data(authService.verifyEmailOtp(request))
                .build());
    }

    @PostMapping("/resend-email-otp")
    public ResponseEntity<ApiResponse<MessageResponse>> resendEmailOtp(@Valid @RequestBody ResendEmailOtpRequest request) {
        return ResponseEntity.ok(ApiResponse.<MessageResponse>builder()
                .success(true)
                .message("OTP resent")
                .data(authService.resendEmailOtp(request))
                .build());
    }
}
