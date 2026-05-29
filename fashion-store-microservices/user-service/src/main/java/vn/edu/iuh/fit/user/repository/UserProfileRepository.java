package vn.edu.iuh.fit.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.iuh.fit.user.domain.entity.UserProfile;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
}
