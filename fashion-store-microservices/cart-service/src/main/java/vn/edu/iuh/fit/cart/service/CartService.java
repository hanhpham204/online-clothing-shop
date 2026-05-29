package vn.edu.iuh.fit.cart.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.cart.domain.entity.CartItem;
import vn.edu.iuh.fit.cart.dto.CartItemRequest;
import vn.edu.iuh.fit.cart.dto.CartItemResponse;
import vn.edu.iuh.fit.cart.dto.CartResponse;
import vn.edu.iuh.fit.common.event.CartClearedEvent;
import vn.edu.iuh.fit.common.event.DomainEvent;
import vn.edu.iuh.fit.common.event.EventRoutingKeys;
import vn.edu.iuh.fit.common.event.OrderPaidEvent;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartService {
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final RabbitTemplate rabbitTemplate;
    private final Set<String> processedEvents = ConcurrentHashMap.newKeySet();

    public CartResponse getCart(Long userId) {
        List<CartItemResponse> items = readCart(userId).stream().map(this::toResponse).toList();
        return toCartResponse(items);
    }

    public CartResponse addItem(Long userId, CartItemRequest request) {
        List<CartItem> items = readCart(userId);
        Long variantId = request.variantId() != null ? request.variantId() : request.productId();
        items.removeIf(item -> variantId.equals(item.getVariantId()));
        CartItem item = new CartItem();
        item.setVariantId(variantId);
        item.setProductId(request.productId() != null ? request.productId() : variantId);
        item.setProductName(request.productName());
        item.setProductSlug(request.productSlug());
        item.setImageUrl(request.imageUrl());
        item.setSize(request.size());
        item.setColor(request.color());
        item.setColorCode(request.colorCode());
        item.setQuantity(request.quantity() == null || request.quantity() < 1 ? 1 : request.quantity());
        item.setUnitPrice(request.unitPrice() == null ? 0D : request.unitPrice());
        item.setStockQuantity(request.stockQuantity());
        items.add(item);
        writeCart(userId, items);
        return getCart(userId);
    }

    public CartResponse updateQuantity(Long userId, Long variantId, Integer quantity) {
        List<CartItem> items = readCart(userId);
        if (quantity == null || quantity < 1) {
            items.removeIf(item -> variantId.equals(item.getVariantId()));
        } else {
            items.stream()
                    .filter(item -> variantId.equals(item.getVariantId()))
                    .findFirst()
                    .ifPresent(item -> item.setQuantity(quantity));
        }
        writeCart(userId, items);
        return getCart(userId);
    }

    public CartResponse removeItem(Long userId, Long variantId) {
        List<CartItem> items = readCart(userId);
        items.removeIf(item -> variantId.equals(item.getVariantId()) || variantId.equals(item.getProductId()));
        writeCart(userId, items);
        return getCart(userId);
    }

    public void clearCart(Long userId) {
        redisTemplate.delete(key(userId));
    }

    @RabbitListener(queues = "cart-service.queue")
    public void onOrderPaid(OrderPaidEvent event) {
        if (!markProcessed(event)) {
            return;
        }
        log.info("Cart-service received OrderPaidEvent eventId={} payload={}", event.getEventId(), event);
        clearCart(event.getUserId());
        CartClearedEvent clearedEvent = new CartClearedEvent(event.getUserId(), event.getOrderId(), Instant.now());
        log.info("Publishing CartClearedEvent eventId={} payload={}", clearedEvent.getEventId(), clearedEvent);
        rabbitTemplate.convertAndSend(EventRoutingKeys.EXCHANGE, EventRoutingKeys.CART_CLEARED, clearedEvent);
    }

    private boolean markProcessed(DomainEvent event) {
        boolean first = processedEvents.add(event.getEventId());
        if (!first) {
            log.info("Skipping duplicate cart event eventId={}", event.getEventId());
        }
        return first;
    }

    private List<CartItem> readCart(Long userId) {
        if (userId == null) {
            return new ArrayList<>();
        }
        try {
            String json = redisTemplate.opsForValue().get(key(userId));
            if (json == null || json.isBlank()) {
                return new ArrayList<>();
            }
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (Exception ex) {
            log.warn("Could not read cart for user {}", userId, ex);
            return new ArrayList<>();
        }
    }

    private void writeCart(Long userId, List<CartItem> items) {
        try {
            redisTemplate.opsForValue().set(key(userId), objectMapper.writeValueAsString(items), Duration.ofHours(24));
        } catch (Exception ex) {
            log.warn("Could not write cart for user {}", userId, ex);
        }
    }

    private CartItemResponse toResponse(CartItem item) {
        Long id = item.getVariantId() != null ? item.getVariantId() : item.getProductId();
        return new CartItemResponse(
                id,
                item.getVariantId(),
                item.getProductId(),
                item.getProductName(),
                item.getProductSlug(),
                item.getImageUrl(),
                item.getSize(),
                item.getColor(),
                item.getColorCode(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getTotalPrice(),
                item.getStockQuantity()
        );
    }

    private CartResponse toCartResponse(List<CartItemResponse> items) {
        double totalAmount = items.stream().mapToDouble(CartItemResponse::totalPrice).sum();
        int totalItems = items.stream().mapToInt(CartItemResponse::quantity).sum();
        return new CartResponse(items, totalAmount, totalItems);
    }

    private String key(Long userId) {
        return "cart:user:" + userId;
    }
}
