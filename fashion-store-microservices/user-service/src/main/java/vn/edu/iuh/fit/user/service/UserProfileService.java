package vn.edu.iuh.fit.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.common.exception.BusinessException;
import vn.edu.iuh.fit.user.domain.entity.UserProfile;
import vn.edu.iuh.fit.user.dto.UserProfileResponse;
import vn.edu.iuh.fit.user.repository.UserProfileRepository;

@Service
@RequiredArgsConstructor
public class UserProfileService {
    private final UserProfileRepository repository;

    public UserProfileResponse getByUserId(Long userId) {
        UserProfile profile = repository.findById(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Profile not found"));
        return new UserProfileResponse(profile.getUserId(), profile.getFullName(), profile.getPhone(), profile.getAddress(), profile.getRole());
    }
}
