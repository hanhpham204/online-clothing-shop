package vn.edu.iuh.fit.gateway.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Component
public class JwtGatewayFilter implements GlobalFilter, Ordered {
    private static final String CLAIM_TOKEN_TYPE = "type";
    private static final String TYPE_ACCESS = "access";
    /** Prefixes mở cho mọi method (auth flow). */
    private static final List<String> PUBLIC_PATHS = List.of("/api/auth/");
    /**
     * Prefixes chỉ public cho GET (browsing catalog cho khách chưa đăng nhập).
     * Lưu ý: KHÔNG bao gồm /api/admin/* — admin CRUD vẫn phải có ADMIN token.
     */
    private static final List<String> PUBLIC_GET_PREFIXES = List.of(
            "/api/products",
            "/api/categories",
            "/api/brands",
            "/api/sizes",
            "/api/colors"
    );
    private static final List<String> ADMIN_PATHS = List.of("/api/admin/");

    private final ObjectMapper objectMapper;

    @Value("${app.jwt.secret:change-this-secret-key-for-graduation-project}")
    private String secret;

    public JwtGatewayFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        HttpMethod method = exchange.getRequest().getMethod();
        if (method == HttpMethod.OPTIONS || isPublic(path) || isPublicGet(method, path)) {
            return chain.filter(exchange);
        }

        String auth = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (auth == null || !auth.startsWith("Bearer ")) {
            return writeError(exchange, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Missing bearer token");
        }

        Claims claims;
        try {
            claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(auth.substring(7))
                    .getBody();
        } catch (Exception ex) {
            return writeError(exchange, HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", "Invalid or expired token");
        }

        if (!TYPE_ACCESS.equals(claims.get(CLAIM_TOKEN_TYPE, String.class))) {
            return writeError(exchange, HttpStatus.UNAUTHORIZED, "INVALID_TOKEN_TYPE", "Access token required");
        }

        String role = claims.get("role", String.class);
        if (isAdminPath(path) && !"ADMIN".equals(role)) {
            return writeError(exchange, HttpStatus.FORBIDDEN, "FORBIDDEN", "ADMIN role required");
        }

        ServerHttpRequest request = exchange.getRequest().mutate()
                .headers(headers -> {
                    headers.remove("X-User-Id");
                    headers.remove("X-User-Email");
                    headers.remove("X-User-Role");
                })
                .header("X-User-Id", String.valueOf(claims.get("userId")))
                .header("X-User-Email", claims.getSubject())
                .header("X-User-Role", role == null ? "" : role)
                .build();

        return chain.filter(exchange.mutate().request(request).build());
    }

    private boolean isPublic(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }

    private boolean isPublicGet(HttpMethod method, String path) {
        if (method != HttpMethod.GET) {
            return false;
        }
        // Không cho admin paths "lọt" qua chỉ vì là GET.
        if (isAdminPath(path)) {
            return false;
        }
        return PUBLIC_GET_PREFIXES.stream().anyMatch(path::startsWith);
    }

    private boolean isAdminPath(String path) {
        return ADMIN_PATHS.stream().anyMatch(path::startsWith);
    }

    private Mono<Void> writeError(ServerWebExchange exchange, HttpStatus status, String code, String message) {
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        try {
            byte[] body = objectMapper.writeValueAsBytes(Map.of(
                    "code", code,
                    "message", message,
                    "timestamp", Instant.now().toString()
            ));
            DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(body);
            return exchange.getResponse().writeWith(Mono.just(buffer));
        } catch (Exception ex) {
            return exchange.getResponse().setComplete();
        }
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(decodeSecret(secret));
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

    @Override
    public int getOrder() {
        return -100;
    }
}
