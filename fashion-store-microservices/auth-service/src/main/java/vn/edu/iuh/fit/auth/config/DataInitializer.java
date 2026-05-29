package vn.edu.iuh.fit.auth.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.edu.iuh.fit.auth.domain.entity.AuthUser;
import vn.edu.iuh.fit.auth.repository.AuthUserRepository;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final AuthUserRepository authUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@fashion-store.local}")
    private String adminEmail;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        String normalizedEmail = adminEmail.trim().toLowerCase();
        if (authUserRepository.existsByEmail(normalizedEmail)) {
            return;
        }
        AuthUser admin = new AuthUser();
        admin.setEmail(normalizedEmail);
        admin.setFullName("System Admin");
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole("ADMIN");
        admin.setProvider("LOCAL");
        admin.setActive(true);
        admin.setEmailVerified(true);
        authUserRepository.save(admin);
    }
}
