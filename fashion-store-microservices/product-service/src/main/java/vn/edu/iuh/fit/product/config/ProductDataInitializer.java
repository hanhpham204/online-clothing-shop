package vn.edu.iuh.fit.product.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.iuh.fit.product.domain.entity.Brand;
import vn.edu.iuh.fit.product.domain.entity.Category;
import vn.edu.iuh.fit.product.domain.entity.Product;
import vn.edu.iuh.fit.product.domain.entity.ProductImage;
import vn.edu.iuh.fit.product.domain.entity.ProductVariant;
import vn.edu.iuh.fit.product.repository.BrandRepository;
import vn.edu.iuh.fit.product.repository.CategoryRepository;
import vn.edu.iuh.fit.product.repository.ProductRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductDataInitializer implements ApplicationRunner {
    private static final Pattern DIACRITICS = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${app.seed.product-data-path:}")
    private String productDataPath;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!seedEnabled) {
            log.info("Product seed disabled by app.seed.enabled=false");
            return;
        }

        if (productRepository.count() > 0) {
            log.info("Product table already has data, skipping seed");
            return;
        }

        List<SeedRow> rows = loadSeedRows();
        if (rows.isEmpty()) {
            log.warn("No product seed rows found. Checked path '{}'", productDataPath);
            return;
        }

        Map<Integer, List<SeedRow>> grouped = rows.stream()
                .filter(this::isValidRow)
                .collect(Collectors.groupingBy(
                        SeedRow::productIndex,
                        LinkedHashMap::new,
                        Collectors.toCollection(ArrayList::new)
                ));

        Map<String, Category> categories = new LinkedHashMap<>();
        Map<String, Brand> brands = new LinkedHashMap<>();

        for (Map.Entry<Integer, List<SeedRow>> entry : grouped.entrySet()) {
            List<SeedRow> groupRows = entry.getValue().stream()
                    .sorted(Comparator.comparingInt(row -> Optional.ofNullable(row.imageIndex()).orElse(999)))
                    .toList();

            SeedRow first = groupRows.get(0);
            String categoryName = safeValue(first.category(), "Uncategorized");
            String subCategory = safeValue(first.subCategory(), "General");

            Category category = categories.computeIfAbsent(categoryName, this::resolveCategory);
            Brand brand = brands.computeIfAbsent(subCategory, this::resolveBrand);

            Product product = new Product();
            product.setName(first.name().trim());
            product.setSlug(buildProductSlug(first));
            product.setDescription("Seeded product from Cloudinary dataset. Category: " + subCategory + ".");
            product.setMaterial(subCategory);
            product.setCategory(category);
            product.setBrand(brand);
            product.setBasePrice(Optional.ofNullable(first.price()).orElse(0D));
            product.setSalePrice(null);
            product.setActive(true);
            product.setFeatured(first.productIndex() <= 12);

            List<ProductImage> images = new ArrayList<>();
            int sortOrder = 0;
            for (SeedRow row : groupRows) {
                if (row.imageUrl() == null || row.imageUrl().isBlank()) {
                    continue;
                }
                ProductImage image = new ProductImage();
                image.setProduct(product);
                image.setImageUrl(row.imageUrl().trim());
                image.setAltText(product.getName());
                image.setSortOrder(sortOrder);
                image.setPrimaryImage(sortOrder == 0);
                images.add(image);
                sortOrder++;
            }
            product.setImages(images);

            ProductVariant variant = new ProductVariant();
            variant.setProduct(product);
            variant.setSize("M");
            variant.setColor(categoryName);
            variant.setColorCode("#000000");
            variant.setSku("SKU-" + safeValue(first.productId(), String.valueOf(first.productIndex())));
            variant.setStockQuantity(100);
            variant.setAdditionalPrice(0D);
            product.setVariants(new ArrayList<>(List.of(variant)));

            productRepository.save(product);
        }

        log.info("Seeded {} products from {}", grouped.size(), productDataPath);
    }

    private boolean isValidRow(SeedRow row) {
        return row.productIndex() != null
                && row.name() != null
                && !row.name().isBlank();
    }

    private Category resolveCategory(String categoryName) {
        String slug = slugify(categoryName);
        return categoryRepository.findBySlug(slug).orElseGet(() -> {
            Category category = new Category();
            category.setName(categoryName);
            category.setSlug(slug);
            category.setDescription(categoryName + " products");
            return categoryRepository.save(category);
        });
    }

    private Brand resolveBrand(String subCategory) {
        return brandRepository.findByNameIgnoreCase(subCategory).orElseGet(() -> {
            Brand brand = new Brand();
            brand.setName(subCategory);
            return brandRepository.save(brand);
        });
    }

    private String buildProductSlug(SeedRow row) {
        String base = slugify(row.name());
        return base + "-" + row.productIndex();
    }

    private String slugify(String input) {
        String value = safeValue(input, "product").trim().toLowerCase(Locale.ROOT);
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD);
        String withoutAccents = DIACRITICS.matcher(normalized).replaceAll("");
        String slug = withoutAccents.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        return slug.isBlank() ? "product" : slug;
    }

    private String safeValue(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private List<SeedRow> loadSeedRows() {
        if (productDataPath != null && !productDataPath.isBlank()) {
            Path path = Path.of(productDataPath);
            if (Files.exists(path)) {
                try {
                    return objectMapper.readValue(Files.readString(path), new TypeReference<List<SeedRow>>() {
                    });
                } catch (IOException ex) {
                    log.error("Failed to read product seed file at {}", productDataPath, ex);
                }
            }
        }

        ClassPathResource classPathResource = new ClassPathResource("seed/product_image_links_for_sql_agent.json");
        if (classPathResource.exists()) {
            try {
                return objectMapper.readValue(classPathResource.getInputStream(), new TypeReference<List<SeedRow>>() {
                });
            } catch (IOException ex) {
                log.error("Failed to read classpath seed file", ex);
            }
        }
        return List.of();
    }

    private record SeedRow(
            @JsonProperty("product_index") Integer productIndex,
            @JsonProperty("product_id") String productId,
            @JsonProperty("name") String name,
            @JsonProperty("image_index") Integer imageIndex,
            @JsonProperty("image_url") String imageUrl,
            @JsonProperty("category") String category,
            @JsonProperty("subCategory") String subCategory,
            @JsonProperty("price") Double price
    ) {
    }
}
