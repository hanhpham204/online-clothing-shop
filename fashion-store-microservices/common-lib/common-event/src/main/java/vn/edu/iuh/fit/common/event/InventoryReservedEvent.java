package vn.edu.iuh.fit.common.event;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
public class InventoryReservedEvent implements DomainEvent {
    private String eventId = EventSupport.newEventId();
    private Long orderId;
    private Long userId;
    private List<OrderItemPayload> items;
    private Instant reservedAt;

    public InventoryReservedEvent(Long orderId, Long userId, List<OrderItemPayload> items, Instant reservedAt) {
        this.orderId = orderId;
        this.userId = userId;
        this.items = items;
        this.reservedAt = reservedAt;
    }
}
