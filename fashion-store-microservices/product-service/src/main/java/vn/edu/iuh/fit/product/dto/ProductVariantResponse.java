package vn.edu.iuh.fit.product.dto;

public record ProductVariantResponse(
        Long id,
        String size,
        String color,
        String colorCode,
        String sku,
        Integer stockQuantity,
        Double additionalPrice,
        Double finalPrice
) {
}
