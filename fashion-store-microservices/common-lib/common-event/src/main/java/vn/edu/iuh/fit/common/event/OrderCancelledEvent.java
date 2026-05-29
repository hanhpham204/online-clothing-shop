package vn.edu.iuh.fit.common.event;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
public class OrderCancelledEvent implements DomainEvent {
    private String eventId = EventSupport.newEventId();
    private Long orderId;
    private Long userId;
    private String reason;
    private Instant cancelledAt;

    public OrderCancelledEvent(Long orderId, Long userId, String reason, Instant cancelledAt) {
        this.orderId = orderId;
        this.userId = userId;
        this.reason = reason;
        this.cancelledAt = cancelledAt;
    }
}
