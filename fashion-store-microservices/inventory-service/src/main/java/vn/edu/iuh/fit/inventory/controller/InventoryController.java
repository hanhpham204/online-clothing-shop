package vn.edu.iuh.fit.inventory.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.iuh.fit.common.dto.ApiResponse;
import vn.edu.iuh.fit.inventory.dto.StockResponse;
import vn.edu.iuh.fit.inventory.service.InventoryService;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<StockResponse>> getStock(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.<StockResponse>builder().success(true).message("Stock fetched").data(inventoryService.getStock(productId)).build());
    }

    @PutMapping("/{productId}")
    public ResponseEntity<ApiResponse<StockResponse>> updateStock(@PathVariable Long productId, @RequestParam Integer quantity) {
        return ResponseEntity.ok(ApiResponse.<StockResponse>builder().success(true).message("Stock updated").data(inventoryService.updateStock(productId, quantity)).build());
    }
}
