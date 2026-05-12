package com.voguestore.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voguestore.dto.request.LoginRequest;
import com.voguestore.dto.request.RegisterRequest;
import com.voguestore.service.RedisService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RedisService redisService;

    @Test
    void shouldRegisterLoginRefreshAndLogoutWithCookies() throws Exception {
        when(redisService.isTokenBlacklisted(anyString())).thenReturn(false);
        when(redisService.isLoginLocked(anyString())).thenReturn(false);
        when(redisService.incrementLoginAttempts(anyString(), anyLong())).thenReturn(0L);
        doNothing().when(redisService).resetLoginAttempts(anyString());
        doNothing().when(redisService).blacklistToken(anyString(), anyLong());

        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("integration-user@voguestore.com");
        registerRequest.setPassword("SecurePass1!");
        registerRequest.setFullName("Integration User");
        registerRequest.setPhone("0123456789");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(cookie().exists("vs_rt"))
                .andExpect(cookie().exists("XSRF-TOKEN"));

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("integration-user@voguestore.com");
        loginRequest.setPassword("SecurePass1!");

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("vs_rt"))
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andReturn();

        Cookie refreshCookie = loginResult.getResponse().getCookie("vs_rt");
        Cookie csrfCookie = loginResult.getResponse().getCookie("XSRF-TOKEN");

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(refreshCookie, csrfCookie)
                        .header("X-CSRF-TOKEN", csrfCookie.getValue()))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("vs_rt"));

        mockMvc.perform(post("/api/auth/logout")
                        .cookie(refreshCookie))
                .andExpect(status().isForbidden());
    }
}
