package com.voguestore.controller;

import com.voguestore.dto.request.SessionPasswordConfirmRequest;
import com.voguestore.dto.response.ApiResponse;
import com.voguestore.dto.response.SessionResponse;
import com.voguestore.security.SecurityUtils;
import com.voguestore.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/sessions", "/sessions"})
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getSessions(Authentication authentication) {
        Long userId = SecurityUtils.currentUserId(authentication);
        Long currentSessionId = SecurityUtils.currentSessionId(authentication);
        return ResponseEntity.ok(ApiResponse.success(sessionService.getActiveSessions(userId, currentSessionId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> revokeSession(Authentication authentication,
                                                           @PathVariable Long id,
                                                           @Valid @RequestBody SessionPasswordConfirmRequest request) {
        Long userId = SecurityUtils.currentUserId(authentication);
        sessionService.revokeSession(userId, id, request.getPassword());
        return ResponseEntity.ok(ApiResponse.success("Session revoked", null));
    }

    @DeleteMapping("/logout-all")
    public ResponseEntity<ApiResponse<Void>> logoutAll(Authentication authentication,
                                                       @Valid @RequestBody SessionPasswordConfirmRequest request) {
        Long userId = SecurityUtils.currentUserId(authentication);
        Long currentSessionId = SecurityUtils.currentSessionId(authentication);
        int revoked = sessionService.revokeAllOtherSessions(userId, currentSessionId, request.getPassword());
        return ResponseEntity.ok(ApiResponse.success("Revoked " + revoked + " sessions", null));
    }
}
