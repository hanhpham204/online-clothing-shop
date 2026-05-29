package vn.edu.iuh.fit.order.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.iuh.fit.common.event.DomainEvent;
import vn.edu.iuh.fit.common.event.EventRoutingKeys;
import vn.edu.iuh.fit.common.event.InventoryFailedEvent;
import vn.edu.iuh.fit.common.event.InventoryReservedEvent;
import vn.edu.iuh.fit.common.event.OrderCancelledEvent;
import vn.edu.iuh.fit.common.event.OrderCreatedEvent;
import vn.edu.iuh.fit.common.event.OrderItemPayload;
import vn.edu.iuh.fit.common.event.OrderPaidEvent;
import vn.edu.iuh.fit.common.event.PaymentCompletedEvent;
import vn.edu.iuh.fit.common.event.PaymentFailedEvent;
import vn.edu.iuh.fit.common.exception.BusinessException;
import vn.edu.iuh.fit.order.domain.entity.OrderEntity;
import vn.edu.iuh.fit.order.dto.CreateOrderRequest;
import vn.edu.iuh.fit.order.dto.OrderItemResponse;
import vn.edu.iuh.fit.order.dto.OrderResponse;
import vn.edu.iuh.fit.order.repository.OrderRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {
    private static final double DEFAULT_SHIPPING_FEE = 30000D;

    private final OrderRepository repository;
    private final ObjectMapper objectMapper;
    private final RabbitTemplate rabbitTemplate;
    private final Set<String> processedEvents = ConcurrentHashMap.newKeySet();

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, Long authenticatedUserId) {
        try {
            Long userId = request.userId() != null ? request.userId() : authenticatedUserId;
            if (userId == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "USER_REQUIRED", "User is required");
            }
            List<OrderItemPayload> items = request.items() == null ? List.of() : request.items();
            if (items.isEmpty()) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "ORDER_EMPTY", "Order must contain at least one item");
            }

            double subtotal = request.totalAmount() != null
                    ? request.totalAmount()
                    : items.stream().mapToDouble(item -> item.getUnitPrice() * item.getQuantity()).sum();
            double shippingFee = DEFAULT_SHIPPING_FEE;

            OrderEntity order = new OrderEntity();
            order.setUserId(userId);
            order.setOrderCode("ORD-" + System.currentTimeMillis());
            order.setItemsJson(objectMapper.writeValueAsString(items));
            order.setSubtotal(subtotal);
            order.setShippingFee(shippingFee);
            order.setDiscountAmount(0D);
            order.setTotalAmount(subtotal + shippingFee);
            order.setShippingName(request.shippingName());
            order.setShippingPhone(request.shippingPhone());
            order.setShippingAddress(request.shippingAddress());
            order.setNote(request.note());
            order.setPaymentMethod(request.paymentMethod() == null ? "BANK_TRANSFER" : request.paymentMethod());
            order.setPaymentStatus("UNPAID");
            order.setPaymentCode("PAY" + System.currentTimeMillis());
            order.setStatus("PENDING");
            order.setCreatedAt(Instant.now());

            OrderEntity saved = repository.save(order);
            OrderCreatedEvent event = new OrderCreatedEvent(
                    saved.getId(),
                    saved.getUserId(),
                    items,
                    saved.getTotalAmount(),
                    saved.getShippingAddress(),
                    saved.getCreatedAt()
            );
            log.info("Publishing OrderCreatedEvent eventId={} payload={}", event.getEventId(), event);
            rabbitTemplate.convertAndSend(EventRoutingKeys.EXCHANGE, EventRoutingKeys.ORDER_CREATED, event);
            return toResponse(saved);
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "ORDER_CREATE_FAILED", ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> myOrders(Long userId) {
        return repository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> myOrders(Long userId, int page, int size) {
        return repository.findByUserId(userId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse detail(Long orderId) {
        return toResponse(fetch(orderId));
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, String status) {
        OrderEntity order = fetch(orderId);
        order.setStatus(status);
        return toResponse(repository.save(order));
    }

    @Transactional
    public void cancel(Long orderId, String reason) {
        OrderEntity order = fetch(orderId);
        order.setStatus("CANCELLED");
        repository.save(order);
        OrderCancelledEvent event = new OrderCancelledEvent(order.getId(), order.getUserId(), reason, Instant.now());
        log.info("Publishing OrderCancelledEvent eventId={} payload={}", event.getEventId(), event);
        rabbitTemplate.convertAndSend(EventRoutingKeys.EXCHANGE, EventRoutingKeys.ORDER_CANCELLED, event);
    }

    @RabbitListener(queues = "order-service.queue")
    @Transactional
    public void consume(Object event) {
        if (event instanceof DomainEvent domainEvent && !processedEvents.add(domainEvent.getEventId())) {
            log.info("Skipping duplicate order event eventId={} payload={}", domainEvent.getEventId(), event);
            return;
        }
        log.info("Order-service received event payload={}", event);
        try {
            if (event instanceof InventoryReservedEvent reserved) {
                updateStatus(reserved.getOrderId(), "INVENTORY_RESERVED");
            } else if (event instanceof InventoryFailedEvent failed) {
                updateStatus(failed.getOrderId(), "FAILED");
            } else if (event instanceof PaymentCompletedEvent paid) {
                markPaid(paid);
            } else if (event instanceof PaymentFailedEvent failedPayment) {
                updateStatus(failedPayment.getOrderId(), "PAYMENT_FAILED");
            } else {
                log.warn("Order-service ignored unsupported event payload={}", event);
            }
        } catch (RuntimeException ex) {
            log.error("Order-service failed to handle event payload={}", event, ex);
            throw ex;
        }
    }

    private void markPaid(PaymentCompletedEvent event) {
        OrderEntity order = fetch(event.getOrderId());
        order.setStatus("PAID");
        order.setPaymentStatus("PAID");
        order.setPaidAt(event.getPaidAt());
        OrderEntity saved = repository.save(order);

        OrderPaidEvent paidEvent = new OrderPaidEvent(saved.getId(), saved.getUserId(), saved.getTotalAmount(), saved.getPaidAt());
        log.info("Publishing OrderPaidEvent eventId={} payload={}", paidEvent.getEventId(), paidEvent);
        rabbitTemplate.convertAndSend(EventRoutingKeys.EXCHANGE, EventRoutingKeys.ORDER_PAID, paidEvent);
    }

    private OrderEntity fetch(Long orderId) {
        return repository.findById(orderId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found"));
    }

    private OrderResponse toResponse(OrderEntity order) {
        return new OrderResponse(
                order.getId(),
                order.getOrderCode(),
                order.getStatus(),
                order.getPaymentStatus(),
                order.getPaymentMethod(),
                order.getPaymentCode(),
                order.getSubtotal(),
                order.getShippingFee(),
                order.getDiscountAmount(),
                order.getTotalAmount(),
                order.getShippingName(),
                order.getShippingPhone(),
                order.getShippingAddress(),
                order.getNote(),
                order.getPaidAt(),
                order.getCreatedAt(),
                parseItems(order.getItemsJson()),
                "/api/payments/qr/" + order.getPaymentCode()
        );
    }

    private List<OrderItemResponse> parseItems(String itemsJson) {
        if (itemsJson == null || itemsJson.isBlank()) {
            return List.of();
        }
        try {
            List<OrderItemPayload> payloads = objectMapper.readValue(itemsJson, new TypeReference<>() {
            });
            List<OrderItemResponse> responses = new ArrayList<>();
            for (int i = 0; i < payloads.size(); i++) {
                OrderItemPayload item = payloads.get(i);
                responses.add(new OrderItemResponse(
                        (long) i + 1,
                        item.getProductName() == null ? "Product #" + item.getProductId() : item.getProductName(),
                        item.getSize(),
                        item.getColor(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getUnitPrice() * item.getQuantity()
                ));
            }
            return responses;
        } catch (Exception ex) {
            log.warn("Could not parse order items JSON", ex);
            return List.of();
        }
    }
}
