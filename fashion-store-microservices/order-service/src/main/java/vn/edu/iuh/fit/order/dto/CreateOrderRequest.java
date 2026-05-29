package vn.edu.iuh.fit.order.dto;

import vn.edu.iuh.fit.common.event.OrderItemPayload;

import java.util.List;

public record CreateOrderRequest(
        Long userId,
        List<OrderItemPayload> items,
        Double totalAmount,
        String shippingName,
        String shippingPhone,
        String shippingAddress,
        String note,
        String paymentMethod
) {
}
