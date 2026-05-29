package vn.edu.iuh.fit.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long accessTokenExpiresIn,
        long refreshTokenExpiresIn,
        Long userId,
        String email,
        String name,
        String role
) {
}
