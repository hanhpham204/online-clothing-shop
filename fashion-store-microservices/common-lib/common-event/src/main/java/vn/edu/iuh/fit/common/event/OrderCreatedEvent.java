package vn.edu.iuh.fit.common.event;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
public class OrderCreatedEvent implements DomainEvent {
    private String eventId = EventSupport.newEventId();
    private Long orderId;
    private Long userId;
    private List<OrderItemPayload> items;
    private Double totalAmount;
    private String shippingAddress;
    private Instant createdAt;

    public OrderCreatedEvent(Long orderId, Long userId, List<OrderItemPayload> items, Double totalAmount,
                             String shippingAddress, Instant createdAt) {
        this.orderId = orderId;
        this.userId = userId;
        this.items = items;
        this.totalAmount = totalAmount;
        this.shippingAddress = shippingAddress;
        this.createdAt = createdAt;
    }
}
