package vn.edu.iuh.fit.product.dto;

public record ProductImageResponse(
        Long id,
        String imageUrl,
        String altText,
        Integer sortOrder,
        boolean isPrimary
) {
}
