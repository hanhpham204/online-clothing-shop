package com.voguestore.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "security")
public class SecurityProperties {

    private List<String> allowedOrigins = new ArrayList<>();

    private LoginRateLimit loginRateLimit = new LoginRateLimit();

    public List<String> getAllowedOrigins() {
        return allowedOrigins;
    }

    public void setAllowedOrigins(List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    public LoginRateLimit getLoginRateLimit() {
        return loginRateLimit;
    }

    public void setLoginRateLimit(LoginRateLimit loginRateLimit) {
        this.loginRateLimit = loginRateLimit;
    }

    public static class LoginRateLimit {
        private int maxAttempts = 5;
        private long lockDurationSeconds = 900;
        private long windowSeconds = 300;

        public int getMaxAttempts() {
            return maxAttempts;
        }

        public void setMaxAttempts(int maxAttempts) {
            this.maxAttempts = maxAttempts;
        }

        public long getLockDurationSeconds() {
            return lockDurationSeconds;
        }

        public void setLockDurationSeconds(long lockDurationSeconds) {
            this.lockDurationSeconds = lockDurationSeconds;
        }

        public long getWindowSeconds() {
            return windowSeconds;
        }

        public void setWindowSeconds(long windowSeconds) {
            this.windowSeconds = windowSeconds;
        }
    }
}
