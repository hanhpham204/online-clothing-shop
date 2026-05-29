package vn.edu.iuh.fit.inventory.dto;

public record StockResponse(Long productId, Integer quantity, boolean available) {
}
