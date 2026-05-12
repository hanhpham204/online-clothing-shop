package com.voguestore.security;

import com.voguestore.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Long currentUserId(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long userId)) {
            throw new UnauthorizedException("Authentication required");
        }
        return userId;
    }

    public static Long currentSessionId(Authentication authentication) {
        if (authentication == null || !(authentication.getCredentials() instanceof Long sessionId)) {
            throw new UnauthorizedException("Session is not available");
        }
        return sessionId;
    }
}
