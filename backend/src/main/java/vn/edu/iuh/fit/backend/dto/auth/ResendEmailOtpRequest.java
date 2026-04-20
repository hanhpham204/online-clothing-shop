package vn.edu.iuh.fit.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ResendEmailOtpRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email
) {
}
