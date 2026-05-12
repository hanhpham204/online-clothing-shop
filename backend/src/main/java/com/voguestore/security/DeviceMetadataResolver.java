package com.voguestore.security;

import jakarta.servlet.http.HttpServletRequest;
import lombok.Builder;
import lombok.Getter;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class DeviceMetadataResolver {

    public DeviceMetadata resolve(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        String ipAddress = extractIp(request);
        String os = detectOs(userAgent);
        String browser = detectBrowser(userAgent);
        String deviceType = detectDeviceType(userAgent);

        return DeviceMetadata.builder()
                .userAgent(userAgent)
                .ipAddress(ipAddress)
                .os(os)
                .browser(browser)
                .deviceName(deviceType + " - " + os)
                .approximateLocation(approximateLocation(ipAddress))
                .build();
    }

    private String extractIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwardedFor)) {
            return forwardedFor.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(realIp)) {
            return realIp;
        }
        return request.getRemoteAddr();
    }

    private String detectOs(String ua) {
        if (ua == null) return "Unknown";
        if (ua.contains("Windows")) return "Windows";
        if (ua.contains("Mac OS")) return "macOS";
        if (ua.contains("Android")) return "Android";
        if (ua.contains("iPhone") || ua.contains("iPad") || ua.contains("iOS")) return "iOS";
        if (ua.contains("Linux")) return "Linux";
        return "Unknown";
    }

    private String detectBrowser(String ua) {
        if (ua == null) return "Unknown";
        if (ua.contains("Edg/")) return "Edge";
        if (ua.contains("Chrome/")) return "Chrome";
        if (ua.contains("Firefox/")) return "Firefox";
        if (ua.contains("Safari/") && !ua.contains("Chrome/")) return "Safari";
        return "Unknown";
    }

    private String detectDeviceType(String ua) {
        if (ua == null) return "Unknown device";
        if (ua.contains("Mobile")) return "Mobile";
        if (ua.contains("Tablet") || ua.contains("iPad")) return "Tablet";
        return "Desktop";
    }

    private String approximateLocation(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) {
            return "Unknown";
        }
        if (ipAddress.startsWith("10.") || ipAddress.startsWith("192.168.") || ipAddress.startsWith("172.")) {
            return "Private network";
        }
        return "Approximate region unavailable";
    }

    @Getter
    @Builder
    public static class DeviceMetadata {
        private String deviceName;
        private String browser;
        private String os;
        private String ipAddress;
        private String approximateLocation;
        private String userAgent;
    }
}
