package vn.edu.iuh.fit.product.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.iuh.fit.product.domain.entity.Category;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
