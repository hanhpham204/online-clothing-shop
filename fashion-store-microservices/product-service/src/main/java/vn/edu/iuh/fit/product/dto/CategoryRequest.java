package vn.edu.iuh.fit.product.dto;

public record CategoryRequest(
        String name,
        String slug,
        String description,
        String imageUrl,
        Long parentId
) {
}
