package vn.edu.iuh.fit.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemPayload {
    private Long productId;
    private Integer quantity;
    private Double unitPrice;
    private String productName;
    private String size;
    private String color;

    public OrderItemPayload(Long productId, Integer quantity, Double unitPrice) {
        this.productId = productId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }
}
