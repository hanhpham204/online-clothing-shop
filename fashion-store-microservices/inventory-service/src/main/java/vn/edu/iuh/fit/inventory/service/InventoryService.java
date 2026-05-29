package vn.edu.iuh.fit.inventory.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.common.event.*;
import vn.edu.iuh.fit.inventory.domain.entity.InventoryStock;
import vn.edu.iuh.fit.inventory.dto.StockResponse;
import vn.edu.iuh.fit.inventory.repository.InventoryRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {
    private final InventoryRepository repository;
    private final RabbitTemplate rabbitTemplate;
    private final Set<String> processedEvents = ConcurrentHashMap.newKeySet();

    public StockResponse getStock(Long productId) {
        InventoryStock stock = repository.findById(productId).orElseGet(() -> {
            InventoryStock s = new InventoryStock();
            s.setProductId(productId);
            s.setQuantity(0);
            return s;
        });
        return new StockResponse(productId, stock.getQuantity(), stock.getQuantity() > 0);
    }

    public StockResponse updateStock(Long productId, Integer quantity) {
        InventoryStock stock = repository.findById(productId).orElseGet(InventoryStock::new);
        stock.setProductId(productId);
        stock.setQuantity(quantity);
        InventoryStock saved = repository.save(stock);
        return new StockResponse(saved.getProductId(), saved.getQuantity(), saved.getQuantity() > 0);
    }

    @RabbitListener(queues = "inventory-service.queue")
    public void onOrderCreated(OrderCreatedEvent event) {
        if (!processedEvents.add(event.getEventId())) {
            log.info("Skipping duplicate OrderCreatedEvent eventId={} payload={}", event.getEventId(), event);
            return;
        }
        log.info("Received OrderCreatedEvent eventId={} payload={}", event.getEventId(), event);
        boolean enough = event.getItems().stream().allMatch(item ->
                Optional.ofNullable(repository.findById(item.getProductId()).orElse(null))
                        .map(stock -> stock.getQuantity() >= item.getQuantity())
                        .orElse(false)
        );
        if (!enough) {
            InventoryFailedEvent failedEvent = new InventoryFailedEvent(event.getOrderId(), event.getUserId(), "Out of stock", Instant.now());
            log.warn("Publishing InventoryFailedEvent eventId={} payload={}", failedEvent.getEventId(), failedEvent);
            rabbitTemplate.convertAndSend(EventRoutingKeys.EXCHANGE, EventRoutingKeys.INVENTORY_FAILED, failedEvent);
            return;
        }
        event.getItems().forEach(item -> {
            InventoryStock stock = repository.findById(item.getProductId()).orElseThrow();
            stock.setQuantity(stock.getQuantity() - item.getQuantity());
            repository.save(stock);
        });
        InventoryReservedEvent reservedEvent = new InventoryReservedEvent(event.getOrderId(), event.getUserId(), event.getItems(), Instant.now());
        log.info("Publishing InventoryReservedEvent eventId={} payload={}", reservedEvent.getEventId(), reservedEvent);
        rabbitTemplate.convertAndSend(EventRoutingKeys.EXCHANGE, EventRoutingKeys.INVENTORY_RESERVED, reservedEvent);
    }
}
