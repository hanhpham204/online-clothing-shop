package vn.edu.iuh.fit.common.event;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
public class OrderPaidEvent implements DomainEvent {
    private String eventId = EventSupport.newEventId();
    private Long orderId;
    private Long userId;
    private Double amount;
    private Instant paidAt;

    public OrderPaidEvent(Long orderId, Long userId, Double amount, Instant paidAt) {
        this.orderId = orderId;
        this.userId = userId;
        this.amount = amount;
        this.paidAt = paidAt;
    }
}
