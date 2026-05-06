package com.voguestore.controller;

import com.voguestore.dto.request.UpdateProfileRequest;
import com.voguestore.dto.response.ApiResponse;
import com.voguestore.dto.response.AuthResponse;
import com.voguestore.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> getProfile(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        AuthResponse.UserInfo profile = userService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        AuthResponse.UserInfo updated = userService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", updated));
    }
}
