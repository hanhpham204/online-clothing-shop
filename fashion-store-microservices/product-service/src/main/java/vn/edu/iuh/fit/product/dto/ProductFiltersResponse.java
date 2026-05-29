package vn.edu.iuh.fit.product.dto;

import java.util.List;

public record ProductFiltersResponse(List<String> sizes, List<String> colors, List<BrandResponse> brands, List<CategoryResponse> categories) {
}
