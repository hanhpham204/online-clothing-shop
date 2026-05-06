package com.voguestore.service;

import com.voguestore.dto.response.StatisticsResponse;
import com.voguestore.enums.OrderStatus;
import com.voguestore.repository.OrderRepository;
import com.voguestore.repository.ProductRepository;
import com.voguestore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public StatisticsResponse getOverview() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime endOfToday = LocalDate.now().atTime(LocalTime.MAX);
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        BigDecimal totalRevenue = orderRepository.calculateRevenue(
                LocalDateTime.of(2020, 1, 1, 0, 0), LocalDateTime.now());
        BigDecimal todayRevenue = orderRepository.calculateRevenue(startOfToday, endOfToday);
        BigDecimal monthRevenue = orderRepository.calculateRevenue(startOfMonth, endOfToday);

        long totalOrders = orderRepository.count();
        long todayOrders = orderRepository.countOrdersBetween(startOfToday, endOfToday);
        long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);
        long totalUsers = userRepository.countByIsActiveTrue();
        long totalProducts = productRepository.count();

        return StatisticsResponse.builder()
                .totalRevenue(totalRevenue)
                .todayRevenue(todayRevenue)
                .monthRevenue(monthRevenue)
                .totalOrders(totalOrders)
                .todayOrders(todayOrders)
                .pendingOrders(pendingOrders)
                .totalUsers(totalUsers)
                .totalProducts(totalProducts)
                .build();
    }
}
