package vn.edu.iuh.fit.product.dto;

import java.util.List;

public record PageResponse<T>(
        List<T> content,
        int totalPages,
        long totalElements,
        int number,
        int size
) {
}
