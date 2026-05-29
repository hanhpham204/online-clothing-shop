package vn.edu.iuh.fit.product.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.iuh.fit.product.domain.entity.ProductImage;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
}
