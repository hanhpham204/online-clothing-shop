package vn.edu.iuh.fit.order;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import vn.edu.iuh.fit.common.event.EventRoutingKeys;
import vn.edu.iuh.fit.common.event.InventoryReservedEvent;
import vn.edu.iuh.fit.common.event.OrderItemPayload;
import vn.edu.iuh.fit.common.event.OrderPaidEvent;
import vn.edu.iuh.fit.common.event.PaymentCompletedEvent;
import vn.edu.iuh.fit.order.domain.entity.OrderEntity;
import vn.edu.iuh.fit.order.dto.CreateOrderRequest;
import vn.edu.iuh.fit.order.dto.OrderResponse;
import vn.edu.iuh.fit.order.repository.OrderRepository;
import vn.edu.iuh.fit.order.service.OrderService;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:order-test;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "eureka.client.enabled=false"
})
class OrderSagaIntegrationTest {
    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @MockBean
    private RabbitTemplate rabbitTemplate;

    @Test
    void paymentCompletedMarksOrderPaidAndPublishesOrderPaidEvent() {
        List<OrderItemPayload> items = List.of(new OrderItemPayload(10L, 2, 120000D));
        items.get(0).setProductName("Basic Tee");
        items.get(0).setSize("M");
        items.get(0).setColor("Black");

        OrderResponse created = orderService.createOrder(new CreateOrderRequest(
                7L,
                items,
                240000D,
                "Student User",
                "0900000000",
                "1 Nguyen Van Bao",
                "Call before delivery",
                "BANK_TRANSFER"
        ), 7L);

        orderService.consume(new InventoryReservedEvent(created.id(), 7L, items, Instant.now()));
        orderService.consume(new PaymentCompletedEvent(created.id(), 7L, 99L, created.totalAmount(), Instant.now()));

        OrderEntity saved = orderRepository.findById(created.id()).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo("PAID");
        assertThat(saved.getPaymentStatus()).isEqualTo("PAID");
        assertThat(saved.getPaidAt()).isNotNull();

        ArgumentCaptor<OrderPaidEvent> eventCaptor = ArgumentCaptor.forClass(OrderPaidEvent.class);
        verify(rabbitTemplate, atLeastOnce()).convertAndSend(eq(EventRoutingKeys.EXCHANGE), eq(EventRoutingKeys.ORDER_PAID), eventCaptor.capture());
        assertThat(eventCaptor.getValue().getOrderId()).isEqualTo(created.id());
        assertThat(eventCaptor.getValue().getUserId()).isEqualTo(7L);
    }
}
