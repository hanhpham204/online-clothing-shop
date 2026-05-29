package vn.edu.iuh.fit.common.event;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
public class InventoryFailedEvent implements DomainEvent {
    private String eventId = EventSupport.newEventId();
    private Long orderId;
    private Long userId;
    private String reason;
    private Instant failedAt;

    public InventoryFailedEvent(Long orderId, Long userId, String reason, Instant failedAt) {
        this.orderId = orderId;
        this.userId = userId;
        this.reason = reason;
        this.failedAt = failedAt;
    }
}
