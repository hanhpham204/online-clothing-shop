package com.voguestore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String orderCode;
    private String status;
    private String paymentStatus;
    private String paymentMethod;
    private String paymentCode;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String shippingName;
    private String shippingPhone;
    private String shippingAddress;
    private String note;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    private List<OrderItemDto> items;
    private String qrCodeUrl;

    @Data
    @Builder
    @AllArgsConstructor
    public static class OrderItemDto {
        private Long id;
        private String productName;
        private String size;
        private String color;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }
}
