package vn.edu.iuh.fit.backend.dto.auth;

public record AuthResponse(
        String accessToken,
        String tokenType,
        Integer userId,
        String email,
        String name,
        String role
) {
}
