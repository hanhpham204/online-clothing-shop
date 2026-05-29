package vn.edu.iuh.fit.cart.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.iuh.fit.cart.dto.CartItemRequest;
import vn.edu.iuh.fit.cart.dto.CartResponse;
import vn.edu.iuh.fit.cart.service.CartService;
import vn.edu.iuh.fit.common.dto.ApiResponse;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestParam(required = false) Long userId
    ) {
        return ResponseEntity.ok(ApiResponse.<CartResponse>builder()
                .success(true).message("Cart fetched").data(cartService.getCart(resolveUserId(headerUserId, userId))).build());
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestParam(required = false) Long userId,
            @RequestBody CartItemRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.<CartResponse>builder()
                .success(true).message("Item added").data(cartService.addItem(resolveUserId(headerUserId, userId), request)).build());
    }

    @PutMapping("/items/{variantId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateQuantity(
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestParam(required = false) Long userId,
            @PathVariable Long variantId,
            @RequestBody CartItemRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.<CartResponse>builder()
                .success(true).message("Cart updated")
                .data(cartService.updateQuantity(resolveUserId(headerUserId, userId), variantId, request.quantity()))
                .build());
    }

    @DeleteMapping("/items/{variantId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestParam(required = false) Long userId,
            @PathVariable Long variantId
    ) {
        return ResponseEntity.ok(ApiResponse.<CartResponse>builder()
                .success(true).message("Item removed").data(cartService.removeItem(resolveUserId(headerUserId, userId), variantId)).build());
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clear(
            @RequestHeader(value = "X-User-Id", required = false) Long headerUserId,
            @RequestParam(required = false) Long userId
    ) {
        cartService.clearCart(resolveUserId(headerUserId, userId));
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Cart cleared").build());
    }

    private Long resolveUserId(Long headerUserId, Long requestUserId) {
        return headerUserId != null ? headerUserId : requestUserId;
    }
}
