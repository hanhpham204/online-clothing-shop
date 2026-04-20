package vn.edu.iuh.fit.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    public void sendEmailVerificationOtp(String toEmail, String name, String otp, long expiresInMinutes) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Ma OTP xac minh email");
        message.setText(buildVerificationContent(name, otp, expiresInMinutes));
        mailSender.send(message);
    }

    private String buildVerificationContent(String name, String otp, long expiresInMinutes) {
        String safeName = name == null || name.isBlank() ? "ban" : name;
        return """
                Xin chao %s,

                Ma OTP xac minh email cua ban la: %s

                Ma co hieu luc trong %d phut.
                Neu ban khong tao tai khoan, vui long bo qua email nay.
                """.formatted(safeName, otp, expiresInMinutes);
    }
}
