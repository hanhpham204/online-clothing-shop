package vn.edu.iuh.fit.cart.dto;

public record CartItemRequest(
        Long variantId,
        Long productId,
        String productName,
        String productSlug,
        String imageUrl,
        String size,
        String color,
        String colorCode,
        Integer quantity,
        Double unitPrice,
        Integer stockQuantity
) {
}
