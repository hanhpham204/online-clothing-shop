package vn.edu.iuh.fit.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyEmailOtpRequest(
        @Email(message = "Invalid email format") @NotBlank(message = "Email is required") String email,
        @Pattern(regexp = "\\d{6}", message = "OTP must contain exactly 6 digits")
        @NotBlank(message = "OTP is required")
        String otp
) {
}
