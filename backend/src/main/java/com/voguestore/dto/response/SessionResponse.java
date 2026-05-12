package com.voguestore.dto.response;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class SessionResponse {
    Long id;
    String deviceName;
    String browser;
    String os;
    String ipAddress;
    String approximateLocation;
    String userAgent;
    LocalDateTime createdAt;
    LocalDateTime lastActiveAt;
    LocalDateTime expiresAt;
    boolean currentSession;
}
