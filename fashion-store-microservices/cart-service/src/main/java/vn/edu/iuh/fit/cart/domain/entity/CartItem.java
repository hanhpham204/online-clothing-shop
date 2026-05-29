package vn.edu.iuh.fit.cart.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {
    private Long variantId;
    private Long productId;
    private String productName;
    private String productSlug;
    private String imageUrl;
    private String size;
    private String color;
    private String colorCode;
    private Integer quantity;
    private Double unitPrice;
    private Integer stockQuantity;

    public Double getTotalPrice() {
        return (unitPrice == null ? 0D : unitPrice) * (quantity == null ? 0 : quantity);
    }
}
