package com.voguestore.controller;

import com.voguestore.dto.response.ApiResponse;
import com.voguestore.entity.Category;
import com.voguestore.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAllCategories() {
        List<Category> categories = categoryRepository.findByParentIsNullAndIsActiveTrue();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<Category>>> getAllFlatCategories() {
        return ResponseEntity.ok(ApiResponse.success(categoryRepository.findByIsActiveTrue()));
    }
}
