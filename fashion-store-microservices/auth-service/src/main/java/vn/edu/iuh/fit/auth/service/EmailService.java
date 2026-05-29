package vn.edu.iuh.fit.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:noreply@fashion-store.local}")
    private String fromEmail;

    public void sendEmailVerificationOtp(String toEmail, String name, String otp, long expiresInMinutes) {
        if (!mailEnabled) {
            log.info("Email OTP for {} is {} and expires in {} minutes", toEmail, otp, expiresInMinutes);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Fashion Store email verification OTP");
        message.setText(buildVerificationContent(name, otp, expiresInMinutes));
        mailSender.send(message);
    }

    private String buildVerificationContent(String name, String otp, long expiresInMinutes) {
        String safeName = name == null || name.isBlank() ? "customer" : name;
        return """
                Hello %s,

                Your Fashion Store email verification OTP is: %s

                This code is valid for %d minutes.
                If you did not create an account, please ignore this email.
                """.formatted(safeName, otp, expiresInMinutes);
    }
}
