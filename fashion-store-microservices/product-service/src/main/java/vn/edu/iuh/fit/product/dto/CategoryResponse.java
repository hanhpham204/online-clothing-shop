package vn.edu.iuh.fit.product.dto;

import java.util.List;

public record CategoryResponse(
        Long id,
        String name,
        String slug,
        String description,
        String imageUrl,
        List<CategoryResponse> children
) {
}
