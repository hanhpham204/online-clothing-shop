package vn.edu.iuh.fit.user.dto;

public record UserProfileResponse(
        Long userId,
        String fullName,
        String phone,
        String address,
        String role
) {
}
