package com.voguestore.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SessionPasswordConfirmRequest {

    @NotBlank(message = "Password confirmation is required")
    private String password;
}
