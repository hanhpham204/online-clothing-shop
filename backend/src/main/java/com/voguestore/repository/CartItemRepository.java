package com.voguestore.repository;

import com.voguestore.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserId(Long userId);
    Optional<CartItem> findByUserIdAndVariantId(Long userId, Long variantId);
    void deleteByUserId(Long userId);
    long countByUserId(Long userId);
}
