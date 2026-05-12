package com.voguestore.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    @NotBlank
    private String secret;

    @NotBlank
    private String issuer;

    @NotNull
    private Long accessExpiration;

    @NotNull
    private Long refreshExpiration;

    @NotBlank
    private String refreshCookieName;

    @NotBlank
    private String refreshCookiePath;

    private boolean cookieSecure = true;

    @NotBlank
    private String cookieSameSite = "Strict";
}
