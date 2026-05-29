package vn.edu.iuh.fit.backend.dto.auth;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long accessTokenExpiresIn,
        long refreshTokenExpiresIn,
        Integer userId,
        String email,
        String name,
        String role
) {
}
