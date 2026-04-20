package vn.edu.iuh.fit.backend.dto.auth;

public record RegisterResponse(
        String message,
        String email,
        boolean requiresEmailVerification
) {
}
