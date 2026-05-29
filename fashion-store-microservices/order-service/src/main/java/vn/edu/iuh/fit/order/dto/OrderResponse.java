package vn.edu.iuh.fit.order.dto;

import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderCode,
        String status,
        String paymentStatus,
        String paymentMethod,
        String paymentCode,
        Double subtotal,
        Double shippingFee,
        Double discountAmount,
        Double totalAmount,
        String shippingName,
        String shippingPhone,
        String shippingAddress,
        String note,
        Instant paidAt,
        Instant createdAt,
        List<OrderItemResponse> items,
        String qrCodeUrl
) {
}
