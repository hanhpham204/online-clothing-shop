package vn.edu.iuh.fit.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.common.event.DomainEvent;
import vn.edu.iuh.fit.common.event.OrderCancelledEvent;
import vn.edu.iuh.fit.common.event.OrderCreatedEvent;
import vn.edu.iuh.fit.common.event.OrderPaidEvent;
import vn.edu.iuh.fit.common.event.PaymentCompletedEvent;
import vn.edu.iuh.fit.common.event.PaymentFailedEvent;
import vn.edu.iuh.fit.common.event.UserRegisteredEvent;
import vn.edu.iuh.fit.notification.domain.entity.NotificationLog;
import vn.edu.iuh.fit.notification.dto.NotificationResponse;
import vn.edu.iuh.fit.notification.repository.NotificationLogRepository;

import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationLogRepository repository;
    private final EmailSender emailSender;
    private final Set<String> processedEvents = ConcurrentHashMap.newKeySet();

    @RabbitListener(queues = "notification-service.queue")
    public void consume(Object event) {
        if (event instanceof DomainEvent domainEvent && !processedEvents.add(domainEvent.getEventId())) {
            log.info("Skipping duplicate notification event eventId={} payload={}", domainEvent.getEventId(), event);
            return;
        }
        log.info("Notification-service received event payload={}", event);
        try {
            if (event instanceof UserRegisteredEvent registered) {
                emit("USER_REGISTERED", "Welcome " + registered.getFullName() + "!");
                emailSender.send(registered.getEmail(), "Welcome to Fashion Store", "Your account has been created.");
            } else if (event instanceof OrderCreatedEvent orderCreated) {
                emit("ORDER_CREATED", "Order #" + orderCreated.getOrderId() + " was created.");
            } else if (event instanceof PaymentCompletedEvent completed) {
                emit("PAYMENT_COMPLETED", "Payment completed for order #" + completed.getOrderId());
            } else if (event instanceof PaymentFailedEvent failed) {
                emit("PAYMENT_FAILED", "Payment failed for order #" + failed.getOrderId() + ": " + failed.getReason());
            } else if (event instanceof OrderPaidEvent paid) {
                emit("ORDER_PAID", "Order #" + paid.getOrderId() + " is now paid.");
            } else if (event instanceof OrderCancelledEvent cancelled) {
                emit("ORDER_CANCELLED", "Order #" + cancelled.getOrderId() + " cancelled.");
            } else {
                log.warn("Notification-service ignored unsupported event payload={}", event);
            }
        } catch (RuntimeException ex) {
            log.error("Notification-service failed to handle event payload={}", event, ex);
            throw ex;
        }
    }

    public NotificationResponse getLatest() {
        NotificationLog log = repository.findAll().stream().reduce((first, second) -> second).orElse(null);
        if (log == null) {
            return new NotificationResponse(null, "NONE", "No notifications");
        }
        return new NotificationResponse(log.getId(), log.getType(), log.getContent());
    }

    private void emit(String type, String content) {
        NotificationLog log = new NotificationLog();
        log.setType(type);
        log.setContent(content);
        log.setCreatedAt(Instant.now());
        repository.save(log);
    }
}
