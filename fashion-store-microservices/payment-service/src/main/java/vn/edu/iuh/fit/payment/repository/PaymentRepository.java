package vn.edu.iuh.fit.payment.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.iuh.fit.payment.domain.entity.PaymentEntity;

public interface PaymentRepository extends JpaRepository<PaymentEntity, Long> {
}
