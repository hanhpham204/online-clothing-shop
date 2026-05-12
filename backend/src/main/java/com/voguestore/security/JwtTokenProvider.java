package com.voguestore.security;

import com.voguestore.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private static final String CLAIM_ROLES = "roles";
    private static final String CLAIM_SESSION_ID = "sessionId";
    private static final String CLAIM_TYPE = "type";
    private static final String ACCESS_TYPE = "access";

    private final JwtProperties jwtProperties;

    public String generateAccessToken(Long userId, List<String> roles, Long sessionId) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(jwtProperties.getAccessExpiration());

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer(jwtProperties.getIssuer())
                .subject(userId.toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .claim(CLAIM_TYPE, ACCESS_TYPE)
                .claim(CLAIM_ROLES, roles)
                .claim(CLAIM_SESSION_ID, sessionId)
                .signWith(getSigningKey())
                .compact();
    }

    public Long getUserIdFromToken(String token) {
        return Long.parseLong(parseClaims(token).getSubject());
    }

    public Long getSessionIdFromToken(String token) {
        Number sessionId = parseClaims(token).get(CLAIM_SESSION_ID, Number.class);
        return sessionId == null ? null : sessionId.longValue();
    }

    public List<String> getRoles(String token) {
        return parseClaims(token).get(CLAIM_ROLES, List.class);
    }

    public String getJtiFromToken(String token) {
        return parseClaims(token).getId();
    }

    public long getExpirationFromToken(String token) {
        return parseClaims(token).getExpiration().getTime();
    }

    public boolean validateAccessToken(String token) {
        try {
            Claims claims = parseClaims(token);
            return ACCESS_TYPE.equals(claims.get(CLAIM_TYPE, String.class));
        } catch (ExpiredJwtException ex) {
            log.debug("Access token expired");
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Access token invalid: {}", ex.getMessage());
        }
        return false;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .requireIssuer(jwtProperties.getIssuer())
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long getAccessExpiration() {
        return jwtProperties.getAccessExpiration();
    }

    public long getRefreshExpiration() {
        return jwtProperties.getRefreshExpiration();
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }
}
