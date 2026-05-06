package com.voguestore.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductRequest {
    @NotBlank(message = "Product name is required")
    private String name;

    private String description;
    private String material;
    private String brand;
    private Long categoryId;

    @NotNull(message = "Base price is required")
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal basePrice;

    private BigDecimal salePrice;
    private Boolean isFeatured = false;

    private List<VariantRequest> variants;
    private List<String> imageUrls;

    @Data
    public static class VariantRequest {
        @NotBlank private String size;
        @NotBlank private String color;
        private String colorCode;
        private String sku;
        @Min(0) private Integer stockQuantity = 0;
        private BigDecimal additionalPrice = BigDecimal.ZERO;
    }
}
