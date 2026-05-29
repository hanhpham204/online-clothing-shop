package vn.edu.iuh.fit.product.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.iuh.fit.common.event.EventRoutingKeys;
import vn.edu.iuh.fit.common.event.ProductUpdatedEvent;
import vn.edu.iuh.fit.common.exception.BusinessException;
import vn.edu.iuh.fit.product.domain.entity.Brand;
import vn.edu.iuh.fit.product.domain.entity.Category;
import vn.edu.iuh.fit.product.domain.entity.Product;
import vn.edu.iuh.fit.product.domain.entity.ProductImage;
import vn.edu.iuh.fit.product.domain.entity.ProductVariant;
import vn.edu.iuh.fit.product.dto.BrandResponse;
import vn.edu.iuh.fit.product.dto.CategoryRequest;
import vn.edu.iuh.fit.product.dto.CategoryResponse;
import vn.edu.iuh.fit.product.dto.PageResponse;
import vn.edu.iuh.fit.product.dto.ProductFiltersResponse;
import vn.edu.iuh.fit.product.dto.ProductImageResponse;
import vn.edu.iuh.fit.product.dto.ProductRequest;
import vn.edu.iuh.fit.product.dto.ProductResponse;
import vn.edu.iuh.fit.product.dto.ProductVariantRequest;
import vn.edu.iuh.fit.product.dto.ProductVariantResponse;
import vn.edu.iuh.fit.product.repository.BrandRepository;
import vn.edu.iuh.fit.product.repository.CategoryRepository;
import vn.edu.iuh.fit.product.repository.ProductImageRepository;
import vn.edu.iuh.fit.product.repository.ProductRepository;
import vn.edu.iuh.fit.product.repository.ProductVariantRepository;

import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.function.Supplier;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ProductService {
    private static final Duration PRODUCT_LIST_TTL = Duration.ofMinutes(5);
    private static final Duration PRODUCT_DETAIL_TTL = Duration.ofMinutes(10);
    private static final Duration CATEGORY_LIST_TTL = Duration.ofMinutes(30);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductImageRepository imageRepository;
    private final RedisCacheService cacheService;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> list(int page, int size, String sortBy, String sortDir) {
        String key = "product:list:page:%d:size:%d:sort:%s:%s".formatted(page, size, sortBy, sortDir);
        return cached(key, PRODUCT_LIST_TTL, new TypeReference<>() {
        }, () -> toPageResponse(productRepository.findAll(pageable(page, size, sortBy, sortDir))));
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> byCategory(Long categoryId, int page, int size) {
        String key = "product:list:category:%s:page:%d:size:%d".formatted(categoryId, page, size);
        return cached(key, PRODUCT_LIST_TTL, new TypeReference<>() {
        }, () -> toPageResponse(productRepository.findAll((root, query, cb) ->
                cb.equal(root.join("category", JoinType.LEFT).get("id"), categoryId), pageable(page, size, "createdAt", "desc"))));
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> featured(int limit) {
        int safeLimit = Math.max(limit, 1);
        String key = "product:list:featured:limit:%d".formatted(safeLimit);
        return cached(key, PRODUCT_LIST_TTL, new TypeReference<>() {
        }, () -> productRepository.findAll(
                        (root, query, cb) -> cb.and(
                                cb.isTrue(root.get("active")),
                                cb.isTrue(root.get("featured"))
                        ),
                        PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .getContent()
                .stream()
                .map(this::toResponse)
                .toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> search(String keyword, Long categoryId, Double minPrice, Double maxPrice,
                                                String size, String color, String sort, int page, int pageSize) {
        Specification<Product> spec = Specification.where(activeProducts())
                .and(keywordSpec(keyword))
                .and(categorySpec(categoryId))
                .and(priceSpec(minPrice, maxPrice))
                .and(variantSpec(size, color));
        return toPageResponse(productRepository.findAll(spec, pageableFromSort(page, pageSize, sort)));
    }

    @Transactional(readOnly = true)
    public ProductResponse detail(String idOrSlug) {
        String key = "product:detail:" + idOrSlug;
        return cached(key, PRODUCT_DETAIL_TTL, new TypeReference<>() {
        }, () -> {
            Product product = findProduct(idOrSlug);
            product.setViewCount(product.getViewCount() + 1);
            return toResponse(productRepository.save(product));
        });
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Product product = applyRequest(new Product(), request);
        Product saved = productRepository.save(product);
        publish(saved, "CREATED");
        evictProductCache(saved.getId(), saved.getSlug());
        return toResponse(saved);
    }

    @Transactional
    public ProductResponse update(Long productId, ProductRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", "Product not found"));
        Product saved = productRepository.save(applyRequest(product, request));
        publish(saved, "UPDATED");
        evictProductCache(saved.getId(), saved.getSlug());
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", "Product not found"));
        productRepository.delete(product);
        publish(product, "DELETED");
        evictProductCache(productId, product.getSlug());
    }

    @Transactional
    public ProductImageResponse addImage(Long productId, String imageUrl, boolean primary) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", "Product not found"));
        ProductImage image = new ProductImage();
        image.setProduct(product);
        image.setImageUrl(imageUrl);
        image.setAltText(product.getName());
        image.setSortOrder(product.getImages().size());
        image.setPrimaryImage(primary || product.getImages().isEmpty());
        product.getImages().add(image);
        Product saved = productRepository.save(product);
        evictProductCache(saved.getId(), saved.getSlug());
        return toImageResponse(image);
    }

    @Transactional
    public void deleteImage(Long imageId) {
        ProductImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "IMAGE_NOT_FOUND", "Image not found"));
        Long productId = image.getProduct().getId();
        String slug = image.getProduct().getSlug();
        imageRepository.delete(image);
        evictProductCache(productId, slug);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> categories() {
        return cached("category:all", CATEGORY_LIST_TTL, new TypeReference<>() {
        }, () -> categoryRepository.findAll().stream()
                .filter(category -> category.getParent() == null)
                .sorted(Comparator.comparing(Category::getName))
                .map(this::toCategoryResponse)
                .toList());
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String slug = request.slug() == null || request.slug().isBlank() ? slugify(request.name()) : request.slug();
        if (categoryRepository.existsBySlug(slug)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "CATEGORY_EXISTS", "Category slug already exists");
        }
        Category category = new Category();
        category.setName(request.name());
        category.setSlug(slug);
        category.setDescription(request.description());
        category.setImageUrl(request.imageUrl());
        if (request.parentId() != null) {
            category.setParent(categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "CATEGORY_NOT_FOUND", "Parent category not found")));
        }
        Category saved = categoryRepository.save(category);
        cacheService.delete("category:all");
        return toCategoryResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BrandResponse> brands() {
        return brandRepository.findAll().stream().map(this::toBrandResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProductFiltersResponse filters() {
        return new ProductFiltersResponse(variantRepository.findDistinctSizes(), variantRepository.findDistinctColors(), brands(), categories());
    }

    @Transactional(readOnly = true)
    public List<String> suggestions(String keyword) {
        String normalized = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);
        if (normalized.length() < 2) {
            return List.of();
        }
        return productRepository.findAll(keywordSpec(normalized), PageRequest.of(0, 8))
                .stream()
                .map(Product::getName)
                .toList();
    }

    private Product applyRequest(Product product, ProductRequest request) {
        product.setName(request.name());
        product.setSlug(uniqueSlug(request.slug() == null || request.slug().isBlank() ? slugify(request.name()) : request.slug(), product.getId()));
        product.setDescription(request.description());
        product.setMaterial(request.material());
        product.setBasePrice(resolveBasePrice(request));
        product.setSalePrice(request.salePrice());
        product.setActive(request.isActive() == null || request.isActive());
        product.setFeatured(Boolean.TRUE.equals(request.isFeatured()));
        product.setBrand(resolveBrand(request.brand()));
        product.setCategory(resolveCategory(request));

        product.getVariants().clear();
        List<ProductVariantRequest> variantRequests = request.variants();
        if (variantRequests == null || variantRequests.isEmpty()) {
            ProductVariant variant = new ProductVariant();
            variant.setProduct(product);
            variant.setSize(request.size());
            variant.setColor(request.color());
            variant.setAdditionalPrice(0D);
            product.getVariants().add(variant);
        } else {
            variantRequests.forEach(variantRequest -> {
                ProductVariant variant = new ProductVariant();
                variant.setProduct(product);
                variant.setSize(variantRequest.size());
                variant.setColor(variantRequest.color());
                variant.setColorCode(variantRequest.colorCode());
                variant.setSku(variantRequest.sku());
                variant.setStockQuantity(variantRequest.stockQuantity() == null ? 0 : variantRequest.stockQuantity());
                variant.setAdditionalPrice(variantRequest.additionalPrice() == null ? 0D : variantRequest.additionalPrice());
                product.getVariants().add(variant);
            });
        }

        product.getImages().clear();
        List<String> imageUrls = request.imageUrls();
        if ((imageUrls == null || imageUrls.isEmpty()) && request.imageUrl() != null) {
            imageUrls = List.of(request.imageUrl());
        }
        if (imageUrls != null) {
            for (int i = 0; i < imageUrls.size(); i++) {
                ProductImage image = new ProductImage();
                image.setProduct(product);
                image.setImageUrl(imageUrls.get(i));
                image.setAltText(product.getName());
                image.setSortOrder(i);
                image.setPrimaryImage(i == 0);
                product.getImages().add(image);
            }
        }
        return product;
    }

    private Category resolveCategory(ProductRequest request) {
        if (request.categoryId() != null) {
            return categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "CATEGORY_NOT_FOUND", "Category not found"));
        }
        if (request.category() == null || request.category().isBlank()) {
            return null;
        }
        String slug = slugify(request.category());
        return categoryRepository.findBySlug(slug).orElseGet(() -> {
            Category category = new Category();
            category.setName(request.category());
            category.setSlug(slug);
            return categoryRepository.save(category);
        });
    }

    private Brand resolveBrand(String brandName) {
        if (brandName == null || brandName.isBlank()) {
            return null;
        }
        return brandRepository.findByNameIgnoreCase(brandName.trim()).orElseGet(() -> {
            Brand brand = new Brand();
            brand.setName(brandName.trim());
            return brandRepository.save(brand);
        });
    }

    private Double resolveBasePrice(ProductRequest request) {
        if (request.basePrice() != null) {
            return request.basePrice();
        }
        return request.price() == null ? 0D : request.price();
    }

    private Product findProduct(String idOrSlug) {
        if (idOrSlug.matches("\\d+")) {
            return productRepository.findById(Long.parseLong(idOrSlug))
                    .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", "Product not found"));
        }
        return productRepository.findBySlug(idOrSlug)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", "Product not found"));
    }

    private Specification<Product> activeProducts() {
        return (root, query, cb) -> cb.isTrue(root.get("active"));
    }

    private Specification<Product> keywordSpec(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }
            String like = "%" + keyword.toLowerCase(Locale.ROOT) + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), like),
                    cb.like(cb.lower(root.get("description")), like)
            );
        };
    }

    private Specification<Product> categorySpec(Long categoryId) {
        return (root, query, cb) -> categoryId == null
                ? cb.conjunction()
                : cb.equal(root.join("category", JoinType.LEFT).get("id"), categoryId);
    }

    private Specification<Product> priceSpec(Double minPrice, Double maxPrice) {
        return (root, query, cb) -> {
            if (minPrice == null && maxPrice == null) {
                return cb.conjunction();
            }
            var effective = cb.<Double>coalesce(root.<Double>get("salePrice"), root.<Double>get("basePrice"));
            if (minPrice != null && maxPrice != null) {
                return cb.between(effective, minPrice, maxPrice);
            }
            if (minPrice != null) {
                return cb.greaterThanOrEqualTo(effective, minPrice);
            }
            return cb.lessThanOrEqualTo(effective, maxPrice);
        };
    }

    private Specification<Product> variantSpec(String size, String color) {
        return (root, query, cb) -> {
            if ((size == null || size.isBlank()) && (color == null || color.isBlank())) {
                return cb.conjunction();
            }
            query.distinct(true);
            var join = root.join("variants", JoinType.LEFT);
            var predicate = cb.conjunction();
            if (size != null && !size.isBlank()) {
                predicate = cb.and(predicate, cb.equal(join.get("size"), size));
            }
            if (color != null && !color.isBlank()) {
                predicate = cb.and(predicate, cb.equal(join.get("color"), color));
            }
            return predicate;
        };
    }

    private PageRequest pageable(int page, int size, String sortBy, String sortDir) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(direction, sortBy == null ? "createdAt" : sortBy));
    }

    private PageRequest pageableFromSort(int page, int size, String sort) {
        return switch (sort == null ? "newest" : sort) {
            case "price_asc" -> PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "basePrice"));
            case "price_desc" -> PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "basePrice"));
            case "name_asc" -> PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));
            default -> PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        };
    }

    private PageResponse<ProductResponse> toPageResponse(Page<Product> page) {
        return new PageResponse<>(
                page.getContent().stream().map(this::toResponse).toList(),
                page.getTotalPages(),
                page.getTotalElements(),
                page.getNumber(),
                page.getSize()
        );
    }

    private ProductResponse toResponse(Product product) {
        Double effectivePrice = product.getSalePrice() != null ? product.getSalePrice() : product.getBasePrice();
        String brandName = product.getBrand() == null ? null : product.getBrand().getName();
        Long categoryId = product.getCategory() == null ? null : product.getCategory().getId();
        String categoryName = product.getCategory() == null ? null : product.getCategory().getName();
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getDescription(),
                product.getMaterial(),
                brandName,
                categoryId,
                categoryName,
                product.getBasePrice(),
                product.getSalePrice(),
                effectivePrice,
                product.isActive(),
                product.isFeatured(),
                product.getViewCount(),
                product.getAvgRating(),
                product.getReviewCount(),
                product.getImages().stream()
                        .sorted(Comparator.comparing(ProductImage::getSortOrder))
                        .map(this::toImageResponse)
                        .toList(),
                product.getVariants().stream().map(variant -> toVariantResponse(variant, effectivePrice)).toList(),
                product.getCreatedAt()
        );
    }

    private ProductImageResponse toImageResponse(ProductImage image) {
        return new ProductImageResponse(image.getId(), image.getImageUrl(), image.getAltText(), image.getSortOrder(), image.isPrimaryImage());
    }

    private ProductVariantResponse toVariantResponse(ProductVariant variant, Double effectivePrice) {
        double additionalPrice = variant.getAdditionalPrice() == null ? 0D : variant.getAdditionalPrice();
        return new ProductVariantResponse(
                variant.getId(),
                variant.getSize(),
                variant.getColor(),
                variant.getColorCode(),
                variant.getSku(),
                variant.getStockQuantity(),
                additionalPrice,
                effectivePrice + additionalPrice
        );
    }

    private CategoryResponse toCategoryResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                category.getImageUrl(),
                category.getChildren().stream()
                        .sorted(Comparator.comparing(Category::getName))
                        .map(this::toCategoryResponse)
                        .toList()
        );
    }

    private BrandResponse toBrandResponse(Brand brand) {
        return new BrandResponse(brand.getId(), brand.getName(), brand.getLogoUrl());
    }

    private void publish(Product product, String action) {
        ProductUpdatedEvent event = new ProductUpdatedEvent(product.getId(), product.getName(), action, Instant.now());
        rabbitTemplate.convertAndSend(EventRoutingKeys.EXCHANGE, EventRoutingKeys.PRODUCT_UPDATED, event);
    }

    private void evictProductCache(Long productId, String slug) {
        cacheService.delete("product:detail:" + productId);
        if (slug != null) {
            cacheService.delete("product:detail:" + slug);
        }
        cacheService.deleteByPattern("product:list:*");
        cacheService.delete("category:all");
    }

    private <T> T cached(String key, Duration ttl, TypeReference<T> typeReference, Supplier<T> supplier) {
        try {
            return cacheService.get(key)
                    .map(json -> readJson(json, typeReference))
                    .orElseGet(() -> {
                        T value = supplier.get();
                        writeJson(key, value, ttl);
                        return value;
                    });
        } catch (Exception ex) {
            return supplier.get();
        }
    }

    private <T> T readJson(String json, TypeReference<T> typeReference) {
        try {
            return objectMapper.readValue(json, typeReference);
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    private void writeJson(String key, Object value, Duration ttl) {
        try {
            cacheService.set(key, objectMapper.writeValueAsString(value), ttl);
        } catch (Exception ignored) {
            // Cache failure must not fail product requests.
        }
    }

    private String uniqueSlug(String baseSlug, Long currentProductId) {
        String candidate = baseSlug;
        int suffix = 2;
        while (productRepository.findBySlug(candidate)
                .filter(existing -> currentProductId == null || !existing.getId().equals(currentProductId))
                .isPresent()) {
            candidate = baseSlug + "-" + suffix++;
        }
        return candidate;
    }

    private String slugify(String input) {
        String value = input == null || input.isBlank() ? "product" : input.trim().toLowerCase(Locale.ROOT);
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD);
        String withoutAccents = Pattern.compile("\\p{InCombiningDiacriticalMarks}+").matcher(normalized).replaceAll("");
        return withoutAccents.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }
}
