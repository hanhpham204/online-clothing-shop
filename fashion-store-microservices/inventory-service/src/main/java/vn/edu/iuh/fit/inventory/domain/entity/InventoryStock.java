package vn.edu.iuh.fit.inventory.domain.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "inventory_stocks")
public class InventoryStock {
    @Id
    private Long productId;
    private Integer quantity;
}
