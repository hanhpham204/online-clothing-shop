package vn.edu.iuh.fit.order.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "orders")
public class OrderEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private String orderCode;
    @Lob
    private String itemsJson;
    private Double subtotal;
    private Double shippingFee;
    private Double discountAmount;
    private Double totalAmount;
    private String shippingName;
    private String shippingPhone;
    private String shippingAddress;
    private String note;
    private String paymentMethod;
    private String paymentStatus;
    private String paymentCode;
    private String status;
    private Instant paidAt;
    private Instant createdAt;
}
