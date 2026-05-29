package vn.edu.iuh.fit.product.dto;

import java.time.Instant;
import java.util.List;

public record ProductResponse(
        Long id,
        String name,
        String slug,
        String description,
        String material,
        String brand,
        Long categoryId,
        String categoryName,
        Double basePrice,
        Double salePrice,
        Double effectivePrice,
        boolean isActive,
        boolean isFeatured,
        Long viewCount,
        Double avgRating,
        Integer reviewCount,
        List<ProductImageResponse> images,
        List<ProductVariantResponse> variants,
        Instant createdAt
) {
}
