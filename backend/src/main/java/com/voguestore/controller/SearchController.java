package com.voguestore.controller;

import com.voguestore.dto.response.ApiResponse;
import com.voguestore.dto.response.ProductResponse;
import com.voguestore.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    /**
     * Full-featured product search with dynamic filters.
     * GET /api/products/search?keyword=...&categoryId=...&minPrice=...&maxPrice=...&size=...&color=...&sort=...&page=...&pageSize=...
     */
    @GetMapping("/products/search")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) String color,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int pageSize,
            Authentication authentication) {

        // Record search history for authenticated users
        if (authentication != null && keyword != null && !keyword.isBlank()) {
            Long userId = (Long) authentication.getPrincipal();
            searchService.recordSearch(userId, keyword);
        }

        Page<ProductResponse> results = searchService.searchProducts(
                keyword, categoryId, minPrice, maxPrice, size, color, sort, page, pageSize);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    /**
     * Autocomplete suggestions (fast, cached).
     * GET /api/products/suggest?keyword=...
     */
    @GetMapping("/products/suggest")
    public ResponseEntity<ApiResponse<List<String>>> suggest(
            @RequestParam String keyword) {
        List<String> suggestions = searchService.getSuggestions(keyword);
        return ResponseEntity.ok(ApiResponse.success(suggestions));
    }

    /**
     * Available filter values (sizes, colors) for the filter sidebar.
     * GET /api/products/filters
     */
    @GetMapping("/products/filters")
    public ResponseEntity<ApiResponse<Map<String, List<String>>>> getFilters() {
        Map<String, List<String>> filters = searchService.getAvailableFilters();
        return ResponseEntity.ok(ApiResponse.success(filters));
    }

    /**
     * User's search history (requires auth).
     * GET /api/search/history
     */
    @GetMapping("/search/history")
    public ResponseEntity<ApiResponse<List<String>>> getHistory(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        List<String> history = searchService.getSearchHistory(userId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    /**
     * Clear user's search history.
     * DELETE /api/search/history
     */
    @DeleteMapping("/search/history")
    public ResponseEntity<ApiResponse<Void>> clearHistory(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        searchService.clearSearchHistory(userId);
        return ResponseEntity.ok(ApiResponse.success("Search history cleared", null));
    }
}
