package vn.edu.iuh.fit.order.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.iuh.fit.common.dto.ApiResponse;
import vn.edu.iuh.fit.order.dto.CreateOrderRequest;
import vn.edu.iuh.fit.order.dto.OrderResponse;
import vn.edu.iuh.fit.order.service.OrderService;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> create(@RequestBody CreateOrderRequest request,
                                                             @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<OrderResponse>builder()
                .success(true).message("Order created").data(orderService.createOrder(request, userId)).build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> orders(@RequestHeader(value = "X-User-Id", required = false) Long userId,
                                                                   @RequestParam(defaultValue = "0") int page,
                                                                   @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.<Page<OrderResponse>>builder()
                .success(true).message("Orders fetched").data(orderService.myOrders(userId, page, size)).build());
    }

    @GetMapping("/my-orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> myOrders(@RequestHeader(value = "X-User-Id", required = false) Long userId,
                                                                     @RequestParam(required = false) Long requestUserId) {
        Long resolvedUserId = requestUserId != null ? requestUserId : userId;
        return ResponseEntity.ok(ApiResponse.<List<OrderResponse>>builder().success(true).message("Orders fetched").data(orderService.myOrders(resolvedUserId)).build());
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> detail(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder().success(true).message("Order fetched").data(orderService.detail(orderId)).build());
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(@PathVariable Long orderId, @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder().success(true).message("Status updated").data(orderService.updateStatus(orderId, status)).build());
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelPut(@PathVariable Long orderId, @RequestParam(defaultValue = "User request") String reason) {
        orderService.cancel(orderId, reason);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Order cancelled").build());
    }

    @PatchMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable Long orderId, @RequestParam(defaultValue = "User request") String reason) {
        orderService.cancel(orderId, reason);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Order cancelled").build());
    }
}
