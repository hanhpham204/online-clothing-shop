package com.voguestore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
public class StatisticsResponse {
    private BigDecimal totalRevenue;
    private BigDecimal todayRevenue;
    private BigDecimal monthRevenue;
    private Long totalOrders;
    private Long todayOrders;
    private Long pendingOrders;
    private Long totalUsers;
    private Long totalProducts;
}
