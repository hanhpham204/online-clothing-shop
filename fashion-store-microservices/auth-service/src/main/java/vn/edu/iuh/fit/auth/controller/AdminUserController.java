package vn.edu.iuh.fit.auth.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.iuh.fit.auth.dto.AdminUserResponse;
import vn.edu.iuh.fit.auth.dto.UpdateUserStatusRequest;
import vn.edu.iuh.fit.auth.service.AuthApplicationService;
import vn.edu.iuh.fit.common.dto.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final AuthApplicationService authService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminUserResponse>>> listUsers() {
        return ResponseEntity.ok(ApiResponse.<List<AdminUserResponse>>builder()
                .success(true)
                .message("Users fetched")
                .data(authService.listUsers())
                .build());
    }

    @PutMapping("/{userId}/status")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateStatus(
            @PathVariable Long userId,
            @RequestBody UpdateUserStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.<AdminUserResponse>builder()
                .success(true)
                .message("User status updated")
                .data(authService.updateUserStatus(userId, request))
                .build());
    }
}
