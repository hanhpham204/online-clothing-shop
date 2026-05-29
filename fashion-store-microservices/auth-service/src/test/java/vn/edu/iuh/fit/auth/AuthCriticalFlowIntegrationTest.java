package vn.edu.iuh.fit.auth;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import vn.edu.iuh.fit.auth.domain.entity.AuthUser;
import vn.edu.iuh.fit.auth.dto.AuthResponse;
import vn.edu.iuh.fit.auth.dto.LoginRequest;
import vn.edu.iuh.fit.auth.dto.RefreshTokenRequest;
import vn.edu.iuh.fit.auth.dto.RegisterRequest;
import vn.edu.iuh.fit.auth.dto.VerifyEmailOtpRequest;
import vn.edu.iuh.fit.auth.repository.AuthUserRepository;
import vn.edu.iuh.fit.auth.service.AuthApplicationService;
import vn.edu.iuh.fit.auth.service.EmailService;
import vn.edu.iuh.fit.auth.service.GoogleTokenVerifierService;
import vn.edu.iuh.fit.auth.service.RedisCacheService;
import vn.edu.iuh.fit.common.exception.BusinessException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:auth-test;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "eureka.client.enabled=false",
        "app.jwt.secret=change-this-secret-key-for-graduation-project"
})
class AuthCriticalFlowIntegrationTest {
    @Autowired
    private AuthApplicationService authService;

    @Autowired
    private AuthUserRepository authUserRepository;

    @MockBean
    private RabbitTemplate rabbitTemplate;

    @MockBean
    private RedisCacheService redisCacheService;

    @MockBean
    private EmailService emailService;

    @MockBean
    private GoogleTokenVerifierService googleTokenVerifierService;

    @Test
    void registerVerifyLoginAndRotateRefreshToken() {
        when(redisCacheService.get(anyString())).thenReturn(Optional.empty());

        authService.register(new RegisterRequest("student@example.com", "secret123", "Student User"));

        assertThatThrownBy(() -> authService.login(new LoginRequest("student@example.com", "secret123")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Email is not verified");

        AuthUser user = authUserRepository.findByEmail("student@example.com").orElseThrow();
        authService.verifyEmailOtp(new VerifyEmailOtpRequest(user.getEmail(), user.getEmailVerificationOtp()));

        AuthResponse login = authService.login(new LoginRequest("student@example.com", "secret123"));
        AuthResponse rotated = authService.refresh(new RefreshTokenRequest(login.refreshToken()));

        assertThat(login.accessToken()).isNotBlank();
        assertThat(login.refreshToken()).isNotBlank();
        assertThat(rotated.refreshToken()).isNotEqualTo(login.refreshToken());
        assertThat(rotated.email()).isEqualTo("student@example.com");

        assertThatThrownBy(() -> authService.refresh(new RefreshTokenRequest(login.refreshToken())))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("reuse detected");
    }
}
