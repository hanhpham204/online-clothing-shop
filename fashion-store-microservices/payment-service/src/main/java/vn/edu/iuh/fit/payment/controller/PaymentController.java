package vn.edu.iuh.fit.payment.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.iuh.fit.common.dto.ApiResponse;
import vn.edu.iuh.fit.payment.dto.PaymentResponse;
import vn.edu.iuh.fit.payment.service.PaymentService;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPayment(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<PaymentResponse>builder()
                .success(true).message("Payment fetched").data(paymentService.getPayment(id)).build());
    }
}
