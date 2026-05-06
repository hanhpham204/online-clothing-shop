package com.voguestore.controller;

import com.voguestore.dto.request.ProductRequest;
import com.voguestore.dto.response.ApiResponse;
import com.voguestore.dto.response.OrderResponse;
import com.voguestore.dto.response.ProductResponse;
import com.voguestore.dto.response.StatisticsResponse;
import com.voguestore.entity.Category;
import com.voguestore.entity.User;
import com.voguestore.exception.ResourceNotFoundException;
import com.voguestore.repository.CategoryRepository;
import com.voguestore.repository.UserRepository;
import com.voguestore.service.OrderService;
import com.voguestore.service.ProductService;
import com.voguestore.service.StatisticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ProductService productService;
    private final OrderService orderService;
    private final StatisticsService statisticsService;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    // ─── Statistics ─────────────────────────────────────
    @GetMapping("/statistics/overview")
    public ResponseEntity<ApiResponse<StatisticsResponse>> getOverview() {
        return ResponseEntity.ok(ApiResponse.success(statisticsService.getOverview()));
    }

    // ─── Products ───────────────────────────────────────
    @PostMapping("/products")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductRequest request) {
        ProductResponse product = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product created", product));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.success(productService.updateProduct(id, request)));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted", null));
    }

    // ─── Orders ─────────────────────────────────────────
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getAllOrders(PageRequest.of(page, size))));
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.updateOrderStatus(id, body.get("status"))));
    }

    // ─── Users ──────────────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> getUsers() {
        List<User> users = userRepository.findAll();
        // Clear passwords for response
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<Void>> toggleUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setIsActive(body.get("isActive"));
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success("User status updated", null));
    }

    // ─── Categories ─────────────────────────────────────
    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<Category>> createCategory(@RequestBody Map<String, String> body) {
        Category category = Category.builder()
                .name(body.get("name"))
                .slug(body.get("slug"))
                .description(body.get("description"))
                .isActive(true)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(categoryRepository.save(category)));
    }
}
