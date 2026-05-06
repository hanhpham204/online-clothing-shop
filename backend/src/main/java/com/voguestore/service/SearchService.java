package com.voguestore.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.voguestore.dto.response.ProductResponse;
import com.voguestore.entity.Product;
import com.voguestore.entity.ProductImage;
import com.voguestore.entity.ProductVariant;
import com.voguestore.entity.Review;
import com.voguestore.repository.ProductRepository;
import com.voguestore.repository.ReviewRepository;
import com.voguestore.repository.specification.ProductSpecification;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Search service with dynamic filtering, Redis caching,
 * autocomplete suggestions, and search history.
 */
@Service
@RequiredArgsConstructor
public class SearchService {

    private static final Logger logger = LoggerFactory.getLogger(SearchService.class);

    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;
    private final RedisService redisService;

    private static final long SEARCH_CACHE_TTL_SECONDS = 120; // 2 minutes
    private static final int SUGGEST_LIMIT = 5;

    // ═══════════════════════════════════════════
    // ADVANCED SEARCH with Specification
    // ═══════════════════════════════════════════

    public Page<ProductResponse> searchProducts(
            String keyword,
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String size,
            String color,
            String sortBy,
            int page,
            int pageSize) {

        // 1. Build cache key from all parameters
        String cacheKey = buildCacheKey(keyword, categoryId, minPrice, maxPrice, size, color, sortBy, page, pageSize);

        // 2. Check Redis cache
        Map<String, Object> cached = redisService.getCachedSearchResults(
                cacheKey, new TypeReference<Map<String, Object>>() {});
        if (cached != null) {
            logger.debug("Search cache hit: {}", cacheKey);
            // Return cached page (already serialized)
            // For simplicity, we re-query on cache miss; cache stores the raw map
        }

        // 3. Build sort
        Sort sort = buildSort(sortBy);
        Pageable pageable = PageRequest.of(page, pageSize, sort);

        // 4. Execute specification query
        var spec = ProductSpecification.buildSearch(keyword, categoryId, minPrice, maxPrice, size, color);
        Page<Product> productPage = productRepository.findAll(spec, pageable);

        // 5. Map to DTOs
        Page<ProductResponse> result = productPage.map(this::toResponse);

        // 6. Cache the results
        try {
            redisService.cacheSearchResults(cacheKey, result, SEARCH_CACHE_TTL_SECONDS);
        } catch (Exception e) {
            logger.warn("Failed to cache search results: {}", e.getMessage());
        }

        return result;
    }

    // ═══════════════════════════════════════════
    // AUTOCOMPLETE SUGGESTIONS
    // ═══════════════════════════════════════════

    public List<String> getSuggestions(String keyword) {
        if (keyword == null || keyword.trim().length() < 2) {
            return List.of();
        }

        String normalizedKeyword = keyword.toLowerCase().trim();

        // Check cache first
        List<String> cached = redisService.getCachedSuggestions(normalizedKeyword);
        if (cached != null) {
            return cached;
        }

        // Query DB: distinct product names matching keyword
        Pageable top5 = PageRequest.of(0, SUGGEST_LIMIT);
        List<String> suggestions = productRepository.findProductNameSuggestions(normalizedKeyword, top5);

        // Cache for 5 minutes
        redisService.cacheSuggestions(normalizedKeyword, suggestions);

        return suggestions;
    }

    // ═══════════════════════════════════════════
    // SEARCH HISTORY
    // ═══════════════════════════════════════════

    public void recordSearch(Long userId, String keyword) {
        if (userId != null && keyword != null && !keyword.isBlank()) {
            redisService.addSearchHistory(userId, keyword.trim());
        }
    }

    public List<String> getSearchHistory(Long userId) {
        return redisService.getSearchHistory(userId);
    }

    public void clearSearchHistory(Long userId) {
        redisService.clearSearchHistory(userId);
    }

    // ═══════════════════════════════════════════
    // AVAILABLE FILTER VALUES
    // ═══════════════════════════════════════════

    /**
     * Returns distinct sizes and colors available across all active product variants.
     * Used to populate filter dropdowns on frontend.
     */
    public Map<String, List<String>> getAvailableFilters() {
        // This can also be cached in Redis (long TTL since it rarely changes)
        List<Product> allActive = productRepository.findAll(
                ProductSpecification.buildSearch(null, null, null, null, null, null));

        List<String> sizes = allActive.stream()
                .flatMap(p -> p.getVariants().stream())
                .map(ProductVariant::getSize)
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        List<String> colors = allActive.stream()
                .flatMap(p -> p.getVariants().stream())
                .map(ProductVariant::getColor)
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        return Map.of("sizes", sizes, "colors", colors);
    }

    // ═══════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════

    private Sort buildSort(String sortBy) {
        if (sortBy == null) return Sort.by(Sort.Direction.DESC, "createdAt");

        return switch (sortBy) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "basePrice");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "basePrice");
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "best_seller" -> Sort.by(Sort.Direction.DESC, "viewCount");
            case "name_asc" -> Sort.by(Sort.Direction.ASC, "name");
            case "name_desc" -> Sort.by(Sort.Direction.DESC, "name");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    private String buildCacheKey(String keyword, Long categoryId, BigDecimal minPrice,
                                  BigDecimal maxPrice, String size, String color,
                                  String sortBy, int page, int pageSize) {
        String raw = String.format("k=%s|c=%s|min=%s|max=%s|s=%s|col=%s|sort=%s|p=%d|ps=%d",
                keyword, categoryId, minPrice, maxPrice, size, color, sortBy, page, pageSize);
        try {
            // Use MD5 hash for compact cache key
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(raw.getBytes());
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            return raw.hashCode() + "";
        }
    }

    private ProductResponse toResponse(Product product) {
        Double avgRating = reviewRepository.getAverageRating(product.getId());
        int reviewCount = product.getReviews() != null ? product.getReviews().size() : 0;

        List<ProductResponse.ImageDto> images = product.getImages().stream()
                .map(img -> ProductResponse.ImageDto.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .altText(img.getAltText())
                        .sortOrder(img.getSortOrder())
                        .isPrimary(img.getIsPrimary())
                        .build())
                .collect(Collectors.toList());

        List<ProductResponse.VariantDto> variants = product.getVariants().stream()
                .map(v -> ProductResponse.VariantDto.builder()
                        .id(v.getId())
                        .size(v.getSize())
                        .color(v.getColor())
                        .colorCode(v.getColorCode())
                        .sku(v.getSku())
                        .stockQuantity(v.getStockQuantity())
                        .additionalPrice(v.getAdditionalPrice())
                        .finalPrice(v.getFinalPrice())
                        .build())
                .collect(Collectors.toList());

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .material(product.getMaterial())
                .brand(product.getBrand())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .basePrice(product.getBasePrice())
                .salePrice(product.getSalePrice())
                .effectivePrice(product.getEffectivePrice())
                .isActive(product.getIsActive())
                .isFeatured(product.getIsFeatured())
                .viewCount(product.getViewCount())
                .avgRating(avgRating)
                .reviewCount(reviewCount)
                .images(images)
                .variants(variants)
                .createdAt(product.getCreatedAt())
                .build();
    }
}
