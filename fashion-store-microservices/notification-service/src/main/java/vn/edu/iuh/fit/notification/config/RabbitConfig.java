package vn.edu.iuh.fit.notification.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import vn.edu.iuh.fit.common.event.EventRoutingKeys;
import vn.edu.iuh.fit.common.event.config.CommonRabbitConfig;

@Configuration
@Import(CommonRabbitConfig.class)
public class RabbitConfig {
    private static final String NOTIFICATION_QUEUE = "notification-service.queue";
    private static final String NOTIFICATION_DLQ = "notification-service.queue.dlq";

    @Bean
    public TopicExchange fashionExchange() {
        return new TopicExchange(EventRoutingKeys.EXCHANGE, true, false);
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(EventRoutingKeys.DLX_EXCHANGE, true, false);
    }

    @Bean
    public Queue notificationQueue() {
        return QueueBuilder.durable(NOTIFICATION_QUEUE)
                .deadLetterExchange(EventRoutingKeys.DLX_EXCHANGE)
                .deadLetterRoutingKey(NOTIFICATION_DLQ)
                .build();
    }

    @Bean
    public Queue notificationDeadLetterQueue() {
        return QueueBuilder.durable(NOTIFICATION_DLQ).build();
    }

    @Bean
    public Binding notificationDeadLetterBinding(Queue notificationDeadLetterQueue, DirectExchange deadLetterExchange) {
        return BindingBuilder.bind(notificationDeadLetterQueue).to(deadLetterExchange).with(NOTIFICATION_DLQ);
    }

    @Bean
    public Binding[] notificationBindings(Queue notificationQueue, TopicExchange fashionExchange) {
        return new Binding[]{
                BindingBuilder.bind(notificationQueue).to(fashionExchange).with(EventRoutingKeys.USER_REGISTERED),
                BindingBuilder.bind(notificationQueue).to(fashionExchange).with(EventRoutingKeys.ORDER_CREATED),
                BindingBuilder.bind(notificationQueue).to(fashionExchange).with(EventRoutingKeys.PAYMENT_COMPLETED),
                BindingBuilder.bind(notificationQueue).to(fashionExchange).with(EventRoutingKeys.PAYMENT_FAILED),
                BindingBuilder.bind(notificationQueue).to(fashionExchange).with(EventRoutingKeys.ORDER_PAID),
                BindingBuilder.bind(notificationQueue).to(fashionExchange).with(EventRoutingKeys.ORDER_CANCELLED)
        };
    }
}
