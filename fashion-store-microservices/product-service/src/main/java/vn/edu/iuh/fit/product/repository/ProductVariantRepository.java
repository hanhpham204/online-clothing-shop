package vn.edu.iuh.fit.product.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import vn.edu.iuh.fit.product.domain.entity.ProductVariant;

import java.util.List;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    @Query("select distinct v.size from ProductVariant v where v.size is not null order by v.size")
    List<String> findDistinctSizes();

    @Query("select distinct v.color from ProductVariant v where v.color is not null order by v.color")
    List<String> findDistinctColors();
}
