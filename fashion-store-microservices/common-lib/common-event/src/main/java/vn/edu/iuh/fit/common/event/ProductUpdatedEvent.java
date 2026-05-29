package vn.edu.iuh.fit.common.event;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
public class ProductUpdatedEvent implements DomainEvent {
    private String eventId = EventSupport.newEventId();
    private Long productId;
    private String productName;
    private String action;
    private Instant updatedAt;

    public ProductUpdatedEvent(Long productId, String productName, String action, Instant updatedAt) {
        this.productId = productId;
        this.productName = productName;
        this.action = action;
        this.updatedAt = updatedAt;
    }
}
