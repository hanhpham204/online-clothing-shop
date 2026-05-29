package vn.edu.iuh.fit.auth.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import vn.edu.iuh.fit.common.event.EventRoutingKeys;
import vn.edu.iuh.fit.common.event.config.CommonRabbitConfig;

@Configuration
@Import(CommonRabbitConfig.class)
public class RabbitConfig {
    @Bean
    public TopicExchange fashionExchange() {
        return new TopicExchange(EventRoutingKeys.EXCHANGE, true, false);
    }
}
