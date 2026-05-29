package vn.edu.iuh.fit.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class MockEmailSender implements EmailSender {
    @Override
    public void send(String to, String subject, String body) {
        log.info("MOCK EMAIL -> to={}, subject={}, body={}", to, subject, body);
    }
}
