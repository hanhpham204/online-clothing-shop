package vn.edu.iuh.fit.notification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.iuh.fit.notification.domain.entity.NotificationLog;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {
}
