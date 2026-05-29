package vn.edu.iuh.fit.product.dto;

public record ProductVariantRequest(
        String size,
        String color,
        String colorCode,
        String sku,
        Integer stockQuantity,
        Double additionalPrice
) {
}
