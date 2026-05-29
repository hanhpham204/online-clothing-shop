package vn.edu.iuh.fit.order.dto;

public record OrderItemResponse(
        Long id,
        String productName,
        String size,
        String color,
        Integer quantity,
        Double unitPrice,
        Double totalPrice
) {
}
