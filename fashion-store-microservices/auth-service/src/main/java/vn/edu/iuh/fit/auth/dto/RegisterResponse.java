package vn.edu.iuh.fit.auth.dto;

public record RegisterResponse(
        String message,
        String email,
        boolean requiresEmailVerification
) {
}
