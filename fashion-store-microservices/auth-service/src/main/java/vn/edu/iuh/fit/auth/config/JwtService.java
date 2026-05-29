package vn.edu.iuh.fit.auth.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtService {
    public static final String CLAIM_TOKEN_TYPE = "type";
    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    @Value("${app.jwt.secret}")
    private String secret;
    @Value("${app.jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;
    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    public String generateAccessToken(Long userId, String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("role", role);
        claims.put(CLAIM_TOKEN_TYPE, TYPE_ACCESS);
        return buildToken(email, accessTokenExpirationMs, claims, null);
    }

    public String generateRefreshToken(String email, String jti) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(CLAIM_TOKEN_TYPE, TYPE_REFRESH);
        return buildToken(email, refreshTokenExpirationMs, claims, jti);
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractJti(String token) {
        return extractClaim(token, claims -> {
            String id = claims.getId();
            return id != null ? id : claims.get("jti", String.class);
        });
    }

    public String extractTokenType(String token) {
        return extractClaim(token, claims -> claims.get(CLAIM_TOKEN_TYPE, String.class));
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extractAllClaims(token));
    }

    public boolean isRefreshToken(String token) {
        try {
            return isTokenValid(token, TYPE_REFRESH);
        } catch (Exception ex) {
            return false;
        }
    }

    public boolean isAccessToken(String token) {
        try {
            return isTokenValid(token, TYPE_ACCESS);
        } catch (Exception ex) {
            return false;
        }
    }

    public boolean isTokenValid(String token, String expectedType) {
        Claims claims = extractAllClaims(token);
        Date expiration = claims.getExpiration();
        if (expiration == null || expiration.before(new Date())) {
            return false;
        }
        return expectedType == null || expectedType.equals(claims.get(CLAIM_TOKEN_TYPE, String.class));
    }

    private String buildToken(String subject, long ttlMs, Map<String, Object> claims, String jti) {
        Date now = new Date();
        var builder = Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + ttlMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256);
        if (jti != null && !jti.isBlank()) {
            builder.setId(jti);
        }
        return builder.compact();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = decodeSecret(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private byte[] decodeSecret(String rawSecret) {
        try {
            byte[] decoded = Decoders.BASE64.decode(rawSecret);
            if (decoded.length >= 32 && Base64.getEncoder().encodeToString(decoded).replace("=", "")
                    .equals(rawSecret.replace("=", ""))) {
                return decoded;
            }
        } catch (Exception ignored) {
            // Fall back to plain UTF-8 secret for local development compatibility.
        }
        return rawSecret.getBytes(StandardCharsets.UTF_8);
    }

    public long getAccessTokenExpirationSeconds() {
        return accessTokenExpirationMs / 1000;
    }

    public long getRefreshTokenExpirationSeconds() {
        return refreshTokenExpirationMs / 1000;
    }
}
