package vn.edu.iuh.fit.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    /** Claim name dùng để phân biệt access vs refresh token. */
    public static final String CLAIM_TOKEN_TYPE = "type";
    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.access-token-expiration-ms:300000}")
    private long accessTokenExpirationMs;

    @Value("${app.jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractTokenType(String token) {
        return extractClaim(token, claims -> claims.get(CLAIM_TOKEN_TYPE, String.class));
    }

    public String extractJti(String token) {
        return extractClaim(token, Claims::getId);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateAccessToken(UserDetails userDetails, Map<String, Object> extraClaims) {
        return buildToken(userDetails, extraClaims, TYPE_ACCESS, accessTokenExpirationMs, null);
    }

    public String generateAccessToken(UserDetails userDetails) {
        return generateAccessToken(userDetails, Map.of());
    }

    /**
     * Sinh refresh token mang theo {@code jti} để backend đối chiếu với bảng refresh_tokens.
     */
    public String generateRefreshToken(UserDetails userDetails, String jti) {
        return buildToken(userDetails, Map.of(), TYPE_REFRESH, refreshTokenExpirationMs, jti);
    }

    public long getAccessTokenExpirationSeconds() {
        return accessTokenExpirationMs / 1000L;
    }

    public long getRefreshTokenExpirationSeconds() {
        return refreshTokenExpirationMs / 1000L;
    }

    /**
     * Validate token + đảm bảo đúng loại (access vs refresh).
     * Truyền `expectedType = null` để bỏ qua check loại (chỉ dùng cho tool/debug).
     */
    public boolean isTokenValid(String token, UserDetails userDetails, String expectedType) {
        try {
            String username = extractUsername(token);
            if (!username.equals(userDetails.getUsername())) return false;
            if (isTokenExpired(token)) return false;
            if (expectedType != null) {
                String type = extractTokenType(token);
                return expectedType.equals(type);
            }
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    /** Backward-compat: mặc định check token là access. */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        return isTokenValid(token, userDetails, TYPE_ACCESS);
    }

    private String buildToken(UserDetails userDetails, Map<String, Object> extraClaims, String type, long ttlMs, String jti) {
        Map<String, Object> claims = new HashMap<>(extraClaims);
        claims.put(CLAIM_TOKEN_TYPE, type);
        Date now = new Date();
        Date expiredAt = new Date(now.getTime() + ttlMs);

        var builder = Jwts.builder()
                .setClaims(claims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(now)
                .setExpiration(expiredAt);
        if (jti != null) {
            builder.setId(jti);
        }
        return builder.signWith(getSignInKey(), SignatureAlgorithm.HS256).compact();
    }

    private boolean isTokenExpired(String token) {
        Date expiration = extractClaim(token, Claims::getExpiration);
        return expiration.before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
