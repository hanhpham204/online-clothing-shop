package com.voguestore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String material;
    private String brand;
    private Long categoryId;
    private String categoryName;
    private BigDecimal basePrice;
    private BigDecimal salePrice;
    private BigDecimal effectivePrice;
    private Boolean isActive;
    private Boolean isFeatured;
    private Integer viewCount;
    private Double avgRating;
    private Integer reviewCount;
    private List<ImageDto> images;
    private List<VariantDto> variants;
    private LocalDateTime createdAt;

    @Data
    @Builder
    @AllArgsConstructor
    public static class ImageDto {
        private Long id;
        private String imageUrl;
        private String altText;
        private Integer sortOrder;
        private Boolean isPrimary;
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class VariantDto {
        private Long id;
        private String size;
        private String color;
        private String colorCode;
        private String sku;
        private Integer stockQuantity;
        private BigDecimal additionalPrice;
        private BigDecimal finalPrice;
    }
}
