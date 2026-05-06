package com.voguestore.controller;

import com.voguestore.dto.SepayWebhookDto;
import com.voguestore.dto.response.ApiResponse;
import com.voguestore.service.OrderService;
import com.voguestore.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

    private final PaymentService paymentService;
    private final OrderService orderService;

    /**
     * SePay webhook callback endpoint.
     * POST /api/webhook/sepay
     * Must return {"success": true} for SePay to consider it received.
     */
    @PostMapping("/api/webhook/sepay")
    public ResponseEntity<Map<String, Boolean>> handleSepayWebhook(
            @RequestBody SepayWebhookDto webhook) {
        logger.info("Received SePay webhook callback");

        try {
            boolean result = paymentService.processWebhook(webhook);
            return ResponseEntity.ok(Map.of("success", result));
        } catch (Exception e) {
            logger.error("Error processing SePay webhook", e);
            return ResponseEntity.ok(Map.of("success", false));
        }
    }

    /**
     * Generate payment QR code URL for an order.
     * GET /api/payment/{orderId}/qr
     */
    @GetMapping("/api/payment/{orderId}/qr")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPaymentQr(
            Authentication auth,
            @PathVariable Long orderId) {
        Long userId = (Long) auth.getPrincipal();
        String qrUrl = orderService.generateQrUrl(orderId, userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("qrUrl", qrUrl)));
    }

    /**
     * Check payment status of an order.
     * GET /api/payment/{orderId}/status
     */
    @GetMapping("/api/payment/{orderId}/status")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPaymentStatus(
            @PathVariable Long orderId) {
        String status = paymentService.getPaymentStatus(orderId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", status)));
    }
}
