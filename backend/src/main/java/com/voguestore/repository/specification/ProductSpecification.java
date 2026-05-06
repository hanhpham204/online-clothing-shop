package com.voguestore.repository.specification;

import com.voguestore.entity.Product;
import com.voguestore.entity.ProductVariant;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Dynamic query builder for product search using JPA Criteria API.
 * Combines multiple optional filters into a single WHERE clause.
 */
public class ProductSpecification {

    private ProductSpecification() {}

    public static Specification<Product> buildSearch(
            String keyword,
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String size,
            String color) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Only active products
            predicates.add(cb.isTrue(root.get("isActive")));

            // Keyword search: name, description, brand (case-insensitive LIKE)
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.toLowerCase().trim() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), pattern);
                Predicate descLike = cb.like(cb.lower(root.get("description")), pattern);
                Predicate brandLike = cb.like(cb.lower(root.get("brand")), pattern);
                predicates.add(cb.or(nameLike, descLike, brandLike));
            }

            // Category filter
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            // Price range (uses effectivePrice logic: salePrice if present, else basePrice)
            if (minPrice != null) {
                Predicate minBase = cb.greaterThanOrEqualTo(root.get("basePrice"), minPrice);
                Predicate minSale = cb.and(
                        cb.isNotNull(root.get("salePrice")),
                        cb.greaterThanOrEqualTo(root.get("salePrice"), minPrice)
                );
                // Product matches if: (salePrice is not null AND salePrice >= min) OR (salePrice is null AND basePrice >= min)
                predicates.add(cb.or(
                        cb.and(cb.isNotNull(root.get("salePrice")), cb.greaterThanOrEqualTo(root.get("salePrice"), minPrice)),
                        cb.and(cb.isNull(root.get("salePrice")), cb.greaterThanOrEqualTo(root.get("basePrice"), minPrice))
                ));
            }
            if (maxPrice != null) {
                predicates.add(cb.or(
                        cb.and(cb.isNotNull(root.get("salePrice")), cb.lessThanOrEqualTo(root.get("salePrice"), maxPrice)),
                        cb.and(cb.isNull(root.get("salePrice")), cb.lessThanOrEqualTo(root.get("basePrice"), maxPrice))
                ));
            }

            // Size and color filter: requires JOIN to product_variants
            if ((size != null && !size.isBlank()) || (color != null && !color.isBlank())) {
                Join<Product, ProductVariant> variantJoin = root.join("variants", JoinType.INNER);

                if (size != null && !size.isBlank()) {
                    predicates.add(cb.equal(cb.upper(variantJoin.get("size")), size.toUpperCase().trim()));
                }
                if (color != null && !color.isBlank()) {
                    predicates.add(cb.like(cb.lower(variantJoin.get("color")), "%" + color.toLowerCase().trim() + "%"));
                }

                // Prevent duplicate results from JOIN
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Autocomplete: fast prefix search on product name only.
     */
    public static Specification<Product> suggestByName(String keyword) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("isActive")));

            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.toLowerCase().trim() + "%";
                predicates.add(cb.like(cb.lower(root.get("name")), pattern));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
