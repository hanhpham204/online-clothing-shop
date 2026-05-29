package vn.edu.iuh.fit.payment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.common.event.*;
import vn.edu.iuh.fit.payment.domain.entity.PaymentEntity;
import vn.edu.iuh.fit.payment.dto.PaymentResponse;
import vn.edu.iuh.fit.payment.repository.PaymentRepository;

import java.time.Instant;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final RabbitTemplate rabbitTemplate;
    private final Random random = new Random();
    private final Set<String> processedEvents = ConcurrentHashMap.newKeySet();

    @Value("${app.payment.mock-success-rate:100}")
    private int mockSuccessRate;

    @RabbitListener(queues = "payment-service.queue")
    public void onInventoryReserved(InventoryReservedEvent event) {
        if (!processedEvents.add(event.getEventId())) {
            log.info("Skipping duplicate InventoryReservedEvent eventId={} payload={}", event.getEventId(), event);
            return;
        }
        log.info("Received InventoryReservedEvent eventId={} payload={}", event.getEventId(), event);
        PaymentEntity payment = new PaymentEntity();
        payment.setOrderId(event.getOrderId());
        payment.setUserId(event.getUserId());
        payment.setAmount(event.getItems().stream().mapToDouble(i -> i.getUnitPrice() * i.getQuantity()).sum());
        payment.setCreatedAt(Instant.now());
        boolean success = random.nextInt(100) < mockSuccessRate;
        payment.setStatus(success ? "PAID" : "FAILED");
        PaymentEntity saved = paymentRepository.save(payment);
        if (success) {
            PaymentCompletedEvent completedEvent = new PaymentCompletedEvent(saved.getOrderId(), saved.getUserId(), saved.getId(), saved.getAmount(), Instant.now());
            log.info("Publishing PaymentCompletedEvent eventId={} payload={}", completedEvent.getEventId(), completedEvent);
            rabbitTemplate.convertAndSend(EventRoutingKeys.EXCHANGE, EventRoutingKeys.PAYMENT_COMPLETED, completedEvent);
        } else {
            PaymentFailedEvent failedEvent = new PaymentFailedEvent(saved.getOrderId(), saved.getUserId(), saved.getId(), "Mock payment failed", Instant.now());
            log.warn("Publishing PaymentFailedEvent eventId={} payload={}", failedEvent.getEventId(), failedEvent);
            rabbitTemplate.convertAndSend(EventRoutingKeys.EXCHANGE, EventRoutingKeys.PAYMENT_FAILED, failedEvent);
        }
    }

    public PaymentResponse getPayment(Long id) {
        PaymentEntity p = paymentRepository.findById(id).orElseThrow();
        return new PaymentResponse(p.getId(), p.getOrderId(), p.getStatus(), p.getAmount());
    }
}
