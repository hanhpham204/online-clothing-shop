package vn.edu.iuh.fit.auth.dto;

public record AdminUserResponse(
        Long id,
        String email,
        String name,
        String role,
        boolean isActive,
        boolean emailVerified,
        String provider,
        String avatarUrl
) {
}
