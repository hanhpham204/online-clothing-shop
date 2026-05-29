package vn.edu.iuh.fit.cart.dto;

public record CartItemResponse(
        Long id,
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
        Double totalPrice,
        Integer stockQuantity
) {
}
