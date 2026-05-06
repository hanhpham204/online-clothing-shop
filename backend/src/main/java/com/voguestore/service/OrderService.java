package com.voguestore.service;

import com.voguestore.dto.request.OrderRequest;
import com.voguestore.dto.response.OrderResponse;
import com.voguestore.entity.*;
import com.voguestore.enums.OrderStatus;
import com.voguestore.enums.PaymentStatus;
import com.voguestore.exception.BadRequestException;
import com.voguestore.exception.ResourceNotFoundException;
import com.voguestore.repository.*;
import com.voguestore.util.OrderCodeGenerator;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;

    @Value("${sepay.bank-account}")
    private String sepayBankAccount;

    @Value("${sepay.bank-name}")
    private String sepayBankName;

    @Transactional
    public OrderResponse createOrder(Long userId, OrderRequest request) {
        List<CartItem> cartItems = cartItemRepository.findByUserId(userId);
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Calculate totals
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem cartItem : cartItems) {
            ProductVariant variant = cartItem.getVariant();
            if (variant.getStockQuantity() < cartItem.getQuantity()) {
                throw new BadRequestException("Insufficient stock for: " + variant.getProduct().getName() +
                        " (" + variant.getSize() + "/" + variant.getColor() + ")");
            }
            BigDecimal itemTotal = variant.getFinalPrice()
                    .multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            subtotal = subtotal.add(itemTotal);
        }

        BigDecimal shippingFee = new BigDecimal("30000"); // fixed shipping 30,000 VND
        BigDecimal totalAmount = subtotal.add(shippingFee);

        // Generate unique order code & payment code
        String orderCode = OrderCodeGenerator.generate();
        String paymentCode = "VS" + orderCode.replace("-", "");

        // Create order
        Order order = Order.builder()
                .orderCode(orderCode)
                .user(user)
                .status(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.UNPAID)
                .paymentMethod(request.getPaymentMethod())
                .paymentCode(paymentCode)
                .subtotal(subtotal)
                .shippingFee(shippingFee)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(totalAmount)
                .shippingName(request.getShippingName())
                .shippingPhone(request.getShippingPhone())
                .shippingAddress(request.getShippingAddress())
                .note(request.getNote())
                .build();

        order = orderRepository.save(order);

        // Create order items & deduct stock
        for (CartItem cartItem : cartItems) {
            ProductVariant variant = cartItem.getVariant();
            Product product = variant.getProduct();

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .variant(variant)
                    .productName(product.getName())
                    .size(variant.getSize())
                    .color(variant.getColor())
                    .quantity(cartItem.getQuantity())
                    .unitPrice(variant.getFinalPrice())
                    .totalPrice(variant.getFinalPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())))
                    .build();
            order.getItems().add(orderItem);

            // Deduct stock
            variant.setStockQuantity(variant.getStockQuantity() - cartItem.getQuantity());
            variantRepository.save(variant);
        }

        order = orderRepository.save(order);

        // Clear cart after order
        cartItemRepository.deleteByUserId(userId);

        logger.info("Order created: {} for user: {}", orderCode, user.getEmail());
        return toResponse(order);
    }

    public Page<OrderResponse> getUserOrders(Long userId, Pageable pageable) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    public OrderResponse getOrderById(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }

        return toResponse(order);
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Can only cancel pending orders");
        }

        // Restore stock
        for (OrderItem item : order.getItems()) {
            ProductVariant variant = item.getVariant();
            variant.setStockQuantity(variant.getStockQuantity() + item.getQuantity());
            variantRepository.save(variant);
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        logger.info("Order cancelled: {}", order.getOrderCode());
        return toResponse(order);
    }

    // Admin methods
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toResponse);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        order.setStatus(OrderStatus.valueOf(status.toUpperCase()));
        orderRepository.save(order);

        logger.info("Order {} status updated to: {}", order.getOrderCode(), status);
        return toResponse(order);
    }

    public String generateQrUrl(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }

        String content = URLEncoder.encode(order.getPaymentCode(), StandardCharsets.UTF_8);
        return String.format("https://qr.sepay.vn/img?acc=%s&bank=%s&amount=%s&des=%s",
                sepayBankAccount, sepayBankName,
                order.getTotalAmount().toBigInteger().toString(), content);
    }

    private OrderResponse toResponse(Order order) {
        List<OrderResponse.OrderItemDto> items = order.getItems().stream()
                .map(item -> OrderResponse.OrderItemDto.builder()
                        .id(item.getId())
                        .productName(item.getProductName())
                        .size(item.getSize())
                        .color(item.getColor())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .totalPrice(item.getTotalPrice())
                        .build())
                .collect(Collectors.toList());

        String qrUrl = null;
        if (order.getPaymentStatus() == PaymentStatus.UNPAID) {
            String content = URLEncoder.encode(order.getPaymentCode(), StandardCharsets.UTF_8);
            qrUrl = String.format("https://qr.sepay.vn/img?acc=%s&bank=%s&amount=%s&des=%s",
                    sepayBankAccount, sepayBankName,
                    order.getTotalAmount().toBigInteger().toString(), content);
        }

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .status(order.getStatus().name())
                .paymentStatus(order.getPaymentStatus().name())
                .paymentMethod(order.getPaymentMethod())
                .paymentCode(order.getPaymentCode())
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .totalAmount(order.getTotalAmount())
                .shippingName(order.getShippingName())
                .shippingPhone(order.getShippingPhone())
                .shippingAddress(order.getShippingAddress())
                .note(order.getNote())
                .paidAt(order.getPaidAt())
                .createdAt(order.getCreatedAt())
                .items(items)
                .qrCodeUrl(qrUrl)
                .build();
    }
}
