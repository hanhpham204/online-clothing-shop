package vn.edu.iuh.fit.payment.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import vn.edu.iuh.fit.common.event.EventRoutingKeys;
import vn.edu.iuh.fit.common.event.config.CommonRabbitConfig;

@Configuration
@Import(CommonRabbitConfig.class)
public class RabbitConfig {
    private static final String PAYMENT_QUEUE = "payment-service.queue";
    private static final String PAYMENT_DLQ = "payment-service.queue.dlq";

    @Bean
    public TopicExchange fashionExchange() {
        return new TopicExchange(EventRoutingKeys.EXCHANGE, true, false);
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(EventRoutingKeys.DLX_EXCHANGE, true, false);
    }

    @Bean
    public Queue paymentQueue() {
        return QueueBuilder.durable(PAYMENT_QUEUE)
                .deadLetterExchange(EventRoutingKeys.DLX_EXCHANGE)
                .deadLetterRoutingKey(PAYMENT_DLQ)
                .build();
    }

    @Bean
    public Queue paymentDeadLetterQueue() {
        return QueueBuilder.durable(PAYMENT_DLQ).build();
    }

    @Bean
    public Binding paymentDeadLetterBinding(Queue paymentDeadLetterQueue, DirectExchange deadLetterExchange) {
        return BindingBuilder.bind(paymentDeadLetterQueue).to(deadLetterExchange).with(PAYMENT_DLQ);
    }

    @Bean
    public Binding inventoryReservedBinding(Queue paymentQueue, TopicExchange fashionExchange) {
        return BindingBuilder.bind(paymentQueue).to(fashionExchange).with(EventRoutingKeys.INVENTORY_RESERVED);
    }
}
