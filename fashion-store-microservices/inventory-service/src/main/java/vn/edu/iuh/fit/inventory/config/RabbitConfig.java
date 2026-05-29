package vn.edu.iuh.fit.inventory.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import vn.edu.iuh.fit.common.event.EventRoutingKeys;
import vn.edu.iuh.fit.common.event.config.CommonRabbitConfig;

@Configuration
@Import(CommonRabbitConfig.class)
public class RabbitConfig {
    private static final String INVENTORY_QUEUE = "inventory-service.queue";
    private static final String INVENTORY_DLQ = "inventory-service.queue.dlq";

    @Bean
    public TopicExchange fashionExchange() {
        return new TopicExchange(EventRoutingKeys.EXCHANGE, true, false);
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(EventRoutingKeys.DLX_EXCHANGE, true, false);
    }

    @Bean
    public Queue inventoryQueue() {
        return QueueBuilder.durable(INVENTORY_QUEUE)
                .deadLetterExchange(EventRoutingKeys.DLX_EXCHANGE)
                .deadLetterRoutingKey(INVENTORY_DLQ)
                .build();
    }

    @Bean
    public Queue inventoryDeadLetterQueue() {
        return QueueBuilder.durable(INVENTORY_DLQ).build();
    }

    @Bean
    public Binding inventoryDeadLetterBinding(Queue inventoryDeadLetterQueue, DirectExchange deadLetterExchange) {
        return BindingBuilder.bind(inventoryDeadLetterQueue).to(deadLetterExchange).with(INVENTORY_DLQ);
    }

    @Bean
    public Binding orderCreatedBinding(Queue inventoryQueue, TopicExchange fashionExchange) {
        return BindingBuilder.bind(inventoryQueue).to(fashionExchange).with(EventRoutingKeys.ORDER_CREATED);
    }
}
