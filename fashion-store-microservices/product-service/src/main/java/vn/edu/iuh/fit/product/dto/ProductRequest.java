package vn.edu.iuh.fit.product.dto;

import java.util.List;

public record ProductRequest(
        String name,
        String slug,
        String description,
        String material,
        String brand,
        Long categoryId,
        Double basePrice,
        Double salePrice,
        Boolean isActive,
        Boolean isFeatured,
        List<ProductVariantRequest> variants,
        List<String> imageUrls,
        String category,
        String size,
        String color,
        Double price,
        String imageUrl
) {
}
