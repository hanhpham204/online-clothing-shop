package vn.edu.iuh.fit.cart.dto;

import java.util.List;

public record CartResponse(
        List<CartItemResponse> items,
        Double totalAmount,
        Integer totalItems
) {
}
