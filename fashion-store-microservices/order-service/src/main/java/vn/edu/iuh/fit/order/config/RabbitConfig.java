package vn.edu.iuh.fit.order.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import vn.edu.iuh.fit.common.event.EventRoutingKeys;
import vn.edu.iuh.fit.common.event.config.CommonRabbitConfig;

@Configuration
@Import(CommonRabbitConfig.class)
public class RabbitConfig {
    private static final String ORDER_QUEUE = "order-service.queue";
    private static final String ORDER_DLQ = "order-service.queue.dlq";

    @Bean
    public TopicExchange fashionExchange() {
        return new TopicExchange(EventRoutingKeys.EXCHANGE, true, false);
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(EventRoutingKeys.DLX_EXCHANGE, true, false);
    }

    @Bean
    public Queue orderQueue() {
        return QueueBuilder.durable(ORDER_QUEUE)
                .deadLetterExchange(EventRoutingKeys.DLX_EXCHANGE)
                .deadLetterRoutingKey(ORDER_DLQ)
                .build();
    }

    @Bean
    public Queue orderDeadLetterQueue() {
        return QueueBuilder.durable(ORDER_DLQ).build();
    }

    @Bean
    public Binding orderDeadLetterBinding(Queue orderDeadLetterQueue, DirectExchange deadLetterExchange) {
        return BindingBuilder.bind(orderDeadLetterQueue).to(deadLetterExchange).with(ORDER_DLQ);
    }

    @Bean
    public Binding inventoryReservedBinding(Queue orderQueue, TopicExchange fashionExchange) {
        return BindingBuilder.bind(orderQueue).to(fashionExchange).with(EventRoutingKeys.INVENTORY_RESERVED);
    }

    @Bean
    public Binding inventoryFailedBinding(Queue orderQueue, TopicExchange fashionExchange) {
        return BindingBuilder.bind(orderQueue).to(fashionExchange).with(EventRoutingKeys.INVENTORY_FAILED);
    }

    @Bean
    public Binding paymentCompletedBinding(Queue orderQueue, TopicExchange fashionExchange) {
        return BindingBuilder.bind(orderQueue).to(fashionExchange).with(EventRoutingKeys.PAYMENT_COMPLETED);
    }

    @Bean
    public Binding paymentFailedBinding(Queue orderQueue, TopicExchange fashionExchange) {
        return BindingBuilder.bind(orderQueue).to(fashionExchange).with(EventRoutingKeys.PAYMENT_FAILED);
    }
}
