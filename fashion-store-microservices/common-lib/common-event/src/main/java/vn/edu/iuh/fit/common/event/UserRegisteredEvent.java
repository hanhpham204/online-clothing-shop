package vn.edu.iuh.fit.common.event;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
public class UserRegisteredEvent implements DomainEvent {
    private String eventId = EventSupport.newEventId();
    private Long userId;
    private String email;
    private String fullName;
    private Instant createdAt;

    public UserRegisteredEvent(Long userId, String email, String fullName, Instant createdAt) {
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.createdAt = createdAt;
    }
}
