package vn.edu.iuh.fit.cart.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import vn.edu.iuh.fit.common.event.EventRoutingKeys;
import vn.edu.iuh.fit.common.event.config.CommonRabbitConfig;

@Configuration
@Import(CommonRabbitConfig.class)
public class RabbitConfig {
    private static final String CART_QUEUE = "cart-service.queue";
    private static final String CART_DLQ = "cart-service.queue.dlq";

    @Bean
    public TopicExchange fashionExchange() {
        return new TopicExchange(EventRoutingKeys.EXCHANGE, true, false);
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(EventRoutingKeys.DLX_EXCHANGE, true, false);
    }

    @Bean
    public Queue cartQueue() {
        return QueueBuilder.durable(CART_QUEUE)
                .deadLetterExchange(EventRoutingKeys.DLX_EXCHANGE)
                .deadLetterRoutingKey(CART_DLQ)
                .build();
    }

    @Bean
    public Queue cartDeadLetterQueue() {
        return QueueBuilder.durable(CART_DLQ).build();
    }

    @Bean
    public Binding cartPaidBinding(Queue cartQueue, TopicExchange fashionExchange) {
        return BindingBuilder.bind(cartQueue).to(fashionExchange).with(EventRoutingKeys.ORDER_PAID);
    }

    @Bean
    public Binding cartDeadLetterBinding(Queue cartDeadLetterQueue, DirectExchange deadLetterExchange) {
        return BindingBuilder.bind(cartDeadLetterQueue).to(deadLetterExchange).with(CART_DLQ);
    }
}
