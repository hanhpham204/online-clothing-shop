package com.voguestore.security;

import com.voguestore.config.JwtProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Arrays;
import java.util.Base64;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CsrfCookieService {

    public static final String CSRF_COOKIE_NAME = "XSRF-TOKEN";
    public static final String CSRF_HEADER_NAME = "X-CSRF-TOKEN";
    private static final int CSRF_TOKEN_BYTES = 32;
    private final SecureRandom secureRandom = new SecureRandom();
    private final JwtProperties jwtProperties;

    public void issueToken(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(CSRF_COOKIE_NAME, randomToken())
                .httpOnly(false)
                .secure(jwtProperties.isCookieSecure())
                .sameSite("Strict")
                .path("/")
                .maxAge(Duration.ofDays(14))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void clearToken(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(CSRF_COOKIE_NAME, "")
                .httpOnly(false)
                .secure(jwtProperties.isCookieSecure())
                .sameSite("Strict")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public boolean isValid(HttpServletRequest request) {
        String header = request.getHeader(CSRF_HEADER_NAME);
        if (header == null || header.isBlank()) {
            return false;
        }
        Optional<String> cookieValue = readCookie(request, CSRF_COOKIE_NAME);
        return cookieValue.filter(header::equals).isPresent();
    }

    private Optional<String> readCookie(HttpServletRequest request, String cookieName) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> cookieName.equals(cookie.getName()))
                .map(jakarta.servlet.http.Cookie::getValue)
                .findFirst();
    }

    private String randomToken() {
        byte[] randomBytes = new byte[CSRF_TOKEN_BYTES];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }
}
