package vn.edu.iuh.fit.common.event;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
public class PaymentFailedEvent implements DomainEvent {
    private String eventId = EventSupport.newEventId();
    private Long orderId;
    private Long userId;
    private Long paymentId;
    private String reason;
    private Instant failedAt;

    public PaymentFailedEvent(Long orderId, Long userId, Long paymentId, String reason, Instant failedAt) {
        this.orderId = orderId;
        this.userId = userId;
        this.paymentId = paymentId;
        this.reason = reason;
        this.failedAt = failedAt;
    }
}
