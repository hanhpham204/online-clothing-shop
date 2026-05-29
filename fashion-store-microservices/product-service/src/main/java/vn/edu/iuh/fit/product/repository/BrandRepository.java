package vn.edu.iuh.fit.product.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.iuh.fit.product.domain.entity.Brand;

import java.util.Optional;

public interface BrandRepository extends JpaRepository<Brand, Long> {
    Optional<Brand> findByNameIgnoreCase(String name);
}
