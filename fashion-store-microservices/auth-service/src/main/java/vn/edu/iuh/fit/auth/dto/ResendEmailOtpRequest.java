package vn.edu.iuh.fit.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ResendEmailOtpRequest(
        @Email(message = "Invalid email format") @NotBlank(message = "Email is required") String email
) {
}
