package vn.edu.iuh.fit.common.event;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
public class PaymentCompletedEvent implements DomainEvent {
    private String eventId = EventSupport.newEventId();
    private Long orderId;
    private Long userId;
    private Long paymentId;
    private Double amount;
    private Instant paidAt;

    public PaymentCompletedEvent(Long orderId, Long userId, Long paymentId, Double amount, Instant paidAt) {
        this.orderId = orderId;
        this.userId = userId;
        this.paymentId = paymentId;
        this.amount = amount;
        this.paidAt = paidAt;
    }
}
