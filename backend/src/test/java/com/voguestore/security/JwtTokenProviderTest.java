package com.voguestore.security;

import com.voguestore.config.JwtProperties;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtTokenProviderTest {

    @Test
    void shouldGenerateAndParseAccessTokenClaims() {
        JwtProperties props = new JwtProperties();
        props.setSecret("test-test-test-test-test-test-test-test");
        props.setIssuer("test");
        props.setAccessExpiration(900000L);
        props.setRefreshExpiration(1209600000L);
        props.setRefreshCookieName("vs_rt");
        props.setRefreshCookiePath("/api/auth");
        props.setCookieSecure(false);
        props.setCookieSameSite("Strict");

        JwtTokenProvider jwtTokenProvider = new JwtTokenProvider(props);
        String token = jwtTokenProvider.generateAccessToken(10L, List.of("USER"), 55L);

        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateAccessToken(token));
        assertEquals(10L, jwtTokenProvider.getUserIdFromToken(token));
        assertEquals(55L, jwtTokenProvider.getSessionIdFromToken(token));
        assertEquals(List.of("USER"), jwtTokenProvider.getRoles(token));
    }
}
