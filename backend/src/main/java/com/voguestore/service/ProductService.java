package com.voguestore.service;

import com.voguestore.dto.request.ProductRequest;
import com.voguestore.dto.response.ProductResponse;
import com.voguestore.entity.*;
import com.voguestore.exception.ResourceNotFoundException;
import com.voguestore.repository.*;
import com.voguestore.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductImageRepository imageRepository;
    private final ReviewRepository reviewRepository;
    private final RedisService redisService;

    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        return productRepository.findByIsActiveTrue(pageable)
                .map(this::toResponse);
    }

    public ProductResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + slug));

        // Increment view count
        product.setViewCount(product.getViewCount() + 1);
        productRepository.save(product);

        return toResponse(product);
    }

    public List<ProductResponse> getFeaturedProducts() {
        return productRepository.findByIsFeaturedTrueAndIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Page<ProductResponse> searchProducts(String keyword, Pageable pageable) {
        return productRepository.searchProducts(keyword, pageable)
                .map(this::toResponse);
    }

    public Page<ProductResponse> getProductsByCategory(Long categoryId, Pageable pageable) {
        return productRepository.findByCategoryIdAndIsActiveTrue(categoryId, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        }

        String slug = SlugUtils.toSlug(request.getName());
        if (productRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }

        Product product = Product.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .material(request.getMaterial())
                .brand(request.getBrand())
                .category(category)
                .basePrice(request.getBasePrice())
                .salePrice(request.getSalePrice())
                .isFeatured(request.getIsFeatured())
                .isActive(true)
                .viewCount(0)
                .build();

        product = productRepository.save(product);

        // Save variants
        if (request.getVariants() != null) {
            for (ProductRequest.VariantRequest vr : request.getVariants()) {
                ProductVariant variant = ProductVariant.builder()
                        .product(product)
                        .size(vr.getSize())
                        .color(vr.getColor())
                        .colorCode(vr.getColorCode())
                        .sku(vr.getSku())
                        .stockQuantity(vr.getStockQuantity())
                        .additionalPrice(vr.getAdditionalPrice())
                        .build();
                variantRepository.save(variant);
            }
        }

        // Save images
        if (request.getImageUrls() != null) {
            for (int i = 0; i < request.getImageUrls().size(); i++) {
                ProductImage image = ProductImage.builder()
                        .product(product)
                        .imageUrl(request.getImageUrls().get(i))
                        .sortOrder(i)
                        .isPrimary(i == 0)
                        .build();
                imageRepository.save(image);
            }
        }

        // Clear product caches
        redisService.deleteCacheByPattern("products:*");

        logger.info("Product created: {}", product.getName());
        return toResponse(product);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setMaterial(request.getMaterial());
        product.setBrand(request.getBrand());
        product.setBasePrice(request.getBasePrice());
        product.setSalePrice(request.getSalePrice());
        product.setIsFeatured(request.getIsFeatured());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(category);
        }

        product = productRepository.save(product);

        // Clear product caches
        redisService.deleteCacheByPattern("products:*");

        logger.info("Product updated: {}", product.getName());
        return toResponse(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setIsActive(false);
        productRepository.save(product);
        redisService.deleteCacheByPattern("products:*");
        logger.info("Product deactivated: {}", product.getName());
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
