package vn.edu.iuh.fit.inventory.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.iuh.fit.inventory.domain.entity.InventoryStock;

public interface InventoryRepository extends JpaRepository<InventoryStock, Long> {
}
