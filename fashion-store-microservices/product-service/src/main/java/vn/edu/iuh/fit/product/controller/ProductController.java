package vn.edu.iuh.fit.product.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.iuh.fit.common.dto.ApiResponse;
import vn.edu.iuh.fit.product.dto.BrandResponse;
import vn.edu.iuh.fit.product.dto.CategoryRequest;
import vn.edu.iuh.fit.product.dto.CategoryResponse;
import vn.edu.iuh.fit.product.dto.PageResponse;
import vn.edu.iuh.fit.product.dto.ProductFiltersResponse;
import vn.edu.iuh.fit.product.dto.ProductImageResponse;
import vn.edu.iuh.fit.product.dto.ProductRequest;
import vn.edu.iuh.fit.product.dto.ProductResponse;
import vn.edu.iuh.fit.product.service.ProductService;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping("/api/products")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<ProductResponse>>builder()
                .success(true).message("Products fetched").data(productService.list(page, size, sortBy, sortDir)).build());
    }

    @GetMapping("/api/products/search")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) String color,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int pageSize
    ) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<ProductResponse>>builder()
                .success(true).message("Products searched")
                .data(productService.search(keyword, categoryId, minPrice, maxPrice, size, color, sort, page, pageSize))
                .build());
    }

    @GetMapping("/api/products/filters")
    public ResponseEntity<ApiResponse<ProductFiltersResponse>> filters() {
        return ResponseEntity.ok(ApiResponse.<ProductFiltersResponse>builder()
                .success(true).message("Product filters fetched").data(productService.filters()).build());
    }

    @GetMapping("/api/products/suggest")
    public ResponseEntity<ApiResponse<List<String>>> suggest(@RequestParam String keyword) {
        return ResponseEntity.ok(ApiResponse.<List<String>>builder()
                .success(true).message("Product suggestions fetched").data(productService.suggestions(keyword)).build());
    }

    @GetMapping("/api/products/category/{categoryId}")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> byCategory(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<ProductResponse>>builder()
                .success(true).message("Products fetched").data(productService.byCategory(categoryId, page, size)).build());
    }

    @GetMapping("/api/products/featured")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> featured(
            @RequestParam(defaultValue = "8") int limit
    ) {
        return ResponseEntity.ok(ApiResponse.<List<ProductResponse>>builder()
                .success(true).message("Featured products fetched").data(productService.featured(limit)).build());
    }

    @GetMapping("/api/products/{idOrSlug}")
    public ResponseEntity<ApiResponse<ProductResponse>> detail(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(ApiResponse.<ProductResponse>builder()
                .success(true).message("Product fetched").data(productService.detail(idOrSlug)).build());
    }

    @GetMapping({"/api/categories", "/api/categories/all"})
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> categories() {
        return ResponseEntity.ok(ApiResponse.<List<CategoryResponse>>builder()
                .success(true).message("Categories fetched").data(productService.categories()).build());
    }

    @GetMapping("/api/brands")
    public ResponseEntity<ApiResponse<List<BrandResponse>>> brands() {
        return ResponseEntity.ok(ApiResponse.<List<BrandResponse>>builder()
                .success(true).message("Brands fetched").data(productService.brands()).build());
    }

    @GetMapping("/api/sizes")
    public ResponseEntity<ApiResponse<List<String>>> sizes() {
        return ResponseEntity.ok(ApiResponse.<List<String>>builder()
                .success(true).message("Sizes fetched").data(productService.filters().sizes()).build());
    }

    @GetMapping("/api/colors")
    public ResponseEntity<ApiResponse<List<String>>> colors() {
        return ResponseEntity.ok(ApiResponse.<List<String>>builder()
                .success(true).message("Colors fetched").data(productService.filters().colors()).build());
    }

    @PostMapping({"/api/products", "/api/admin/products"})
    public ResponseEntity<ApiResponse<ProductResponse>> create(@RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<ProductResponse>builder()
                .success(true).message("Product created").data(productService.create(request)).build());
    }

    @PutMapping({"/api/products/{id}", "/api/admin/products/{id}"})
    public ResponseEntity<ApiResponse<ProductResponse>> update(@PathVariable Long id, @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.<ProductResponse>builder()
                .success(true).message("Product updated").data(productService.update(id, request)).build());
    }

    @DeleteMapping({"/api/products/{id}", "/api/admin/products/{id}"})
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Product deleted").build());
    }

    @PostMapping("/api/admin/categories")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<CategoryResponse>builder()
                .success(true).message("Category created").data(productService.createCategory(request)).build());
    }

    @PostMapping("/api/admin/products/{id}/images")
    public ResponseEntity<ApiResponse<ProductImageResponse>> addImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "false") boolean isPrimary
    ) {
        String safeName = file.getOriginalFilename() == null ? "image" : file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_");
        ProductImageResponse image = productService.addImage(id, "/api/products/images/" + System.currentTimeMillis() + "-" + safeName, isPrimary);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<ProductImageResponse>builder()
                .success(true).message("Image uploaded").data(image).build());
    }

    @DeleteMapping("/api/admin/products/images/{imageId}")
    public ResponseEntity<ApiResponse<Void>> deleteImage(@PathVariable Long imageId) {
        productService.deleteImage(imageId);
        return ResponseEntity.ok(ApiResponse.<Void>builder().success(true).message("Image deleted").build());
    }
}
