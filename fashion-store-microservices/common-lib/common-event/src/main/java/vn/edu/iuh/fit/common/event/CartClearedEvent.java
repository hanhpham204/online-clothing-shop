package vn.edu.iuh.fit.common.event;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
public class CartClearedEvent implements DomainEvent {
    private String eventId = EventSupport.newEventId();
    private Long userId;
    private Long orderId;
    private Instant clearedAt;

    public CartClearedEvent(Long userId, Long orderId, Instant clearedAt) {
        this.userId = userId;
        this.orderId = orderId;
        this.clearedAt = clearedAt;
    }
}
