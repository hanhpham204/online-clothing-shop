package com.voguestore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class CartResponse {
    private List<CartItemDto> items;
    private BigDecimal totalAmount;
    private Integer totalItems;

    @Data
    @Builder
    @AllArgsConstructor
    public static class CartItemDto {
        private Long id;
        private Long variantId;
        private Long productId;
        private String productName;
        private String productSlug;
        private String imageUrl;
        private String size;
        private String color;
        private String colorCode;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
        private Integer stockQuantity;
    }
}
