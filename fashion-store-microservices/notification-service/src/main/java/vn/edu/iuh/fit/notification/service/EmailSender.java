package vn.edu.iuh.fit.notification.service;

public interface EmailSender {
    void send(String to, String subject, String body);
}
