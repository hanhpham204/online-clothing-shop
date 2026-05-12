package com.voguestore.controller;

import com.voguestore.dto.request.ChangePasswordRequest;
import com.voguestore.dto.request.LoginRequest;
import com.voguestore.dto.request.RegisterRequest;
import com.voguestore.dto.response.ApiResponse;
import com.voguestore.dto.response.AuthResponse;
import com.voguestore.exception.UnauthorizedException;
import com.voguestore.security.CsrfCookieService;
import com.voguestore.security.RefreshTokenCookieService;
import com.voguestore.security.SecurityUtils;
import com.voguestore.service.AuthService;
import com.voguestore.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final RefreshTokenCookieService refreshTokenCookieService;
    private final CsrfCookieService csrfCookieService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request,
                                                              HttpServletRequest httpRequest,
                                                              HttpServletResponse httpResponse) {
        AuthResponse response = authService.register(request, httpRequest);
        refreshTokenCookieService.writeRefreshToken(httpResponse, response.getRefreshToken());
        csrfCookieService.issueToken(httpResponse);
        response.setRefreshToken(null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request,
                                                           HttpServletRequest httpRequest,
                                                           HttpServletResponse httpResponse) {
        AuthResponse response = authService.login(request, httpRequest);
        refreshTokenCookieService.writeRefreshToken(httpResponse, response.getRefreshToken());
        csrfCookieService.issueToken(httpResponse);
        response.setRefreshToken(null);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(HttpServletRequest httpRequest,
                                                             HttpServletResponse httpResponse) {
        String refreshToken = refreshTokenCookieService.extractRefreshToken(httpRequest)
                .orElseThrow(() -> new UnauthorizedException("Refresh token missing"));
        AuthResponse response = authService.refreshToken(refreshToken, httpRequest);
        refreshTokenCookieService.writeRefreshToken(httpResponse, response.getRefreshToken());
        response.setRefreshToken(null);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                                    HttpServletRequest httpRequest,
                                                    HttpServletResponse httpResponse) {
        refreshTokenCookieService.extractRefreshToken(httpRequest).ifPresent(authService::logoutByRefreshToken);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            authService.revokeAccessToken(authHeader.substring(7));
        }
        refreshTokenCookieService.clearRefreshToken(httpResponse);
        csrfCookieService.clearToken(httpResponse);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        Long userId = SecurityUtils.currentUserId(authentication);
        authService.changePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> me(Authentication authentication) {
        Long userId = SecurityUtils.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success(userService.getProfile(userId)));
    }
}
