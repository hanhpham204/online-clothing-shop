package com.voguestore.service;

import com.voguestore.config.SecurityProperties;
import com.voguestore.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private final RedisService redisService;
    private final SecurityProperties securityProperties;

    public void assertLoginAllowed(String key) {
        if (redisService.isLoginLocked(key)) {
            throw new UnauthorizedException("Too many failed login attempts. Please try again later.");
        }
    }

    public void recordFailedAttempt(String key) {
        SecurityProperties.LoginRateLimit config = securityProperties.getLoginRateLimit();
        long attempts = redisService.incrementLoginAttempts(key, config.getWindowSeconds());
        if (attempts >= config.getMaxAttempts()) {
            redisService.lockLogin(key, config.getLockDurationSeconds());
        }
    }

    public void recordSuccessfulAttempt(String key) {
        redisService.resetLoginAttempts(key);
    }
}
