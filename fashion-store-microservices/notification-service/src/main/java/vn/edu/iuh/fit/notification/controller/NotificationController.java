package vn.edu.iuh.fit.notification.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.iuh.fit.common.dto.ApiResponse;
import vn.edu.iuh.fit.notification.dto.NotificationResponse;
import vn.edu.iuh.fit.notification.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<NotificationResponse>> latest() {
        return ResponseEntity.ok(ApiResponse.<NotificationResponse>builder()
                .success(true).message("Latest notification fetched")
                .data(notificationService.getLatest()).build());
    }
}
