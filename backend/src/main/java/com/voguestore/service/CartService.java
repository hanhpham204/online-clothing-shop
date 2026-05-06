package com.voguestore.service;

import com.voguestore.dto.request.CartItemRequest;
import com.voguestore.dto.response.CartResponse;
import com.voguestore.entity.*;
import com.voguestore.exception.BadRequestException;
import com.voguestore.exception.ResourceNotFoundException;
import com.voguestore.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;

    public CartResponse getCart(Long userId) {
        List<CartItem> items = cartItemRepository.findByUserId(userId);
        return buildCartResponse(items);
    }

    @Transactional
    public CartResponse addToCart(Long userId, CartItemRequest request) {
        ProductVariant variant = variantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("Product variant not found"));

        if (variant.getStockQuantity() < request.getQuantity()) {
            throw new BadRequestException("Insufficient stock. Available: " + variant.getStockQuantity());
        }

        // Check if already in cart
        var existingItem = cartItemRepository.findByUserIdAndVariantId(userId, request.getVariantId());
        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            int newQty = item.getQuantity() + request.getQuantity();
            if (newQty > variant.getStockQuantity()) {
                throw new BadRequestException("Total quantity exceeds stock");
            }
            item.setQuantity(newQty);
            cartItemRepository.save(item);
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            CartItem newItem = CartItem.builder()
                    .user(user)
                    .variant(variant)
                    .quantity(request.getQuantity())
                    .build();
            cartItemRepository.save(newItem);
        }

        return getCart(userId);
    }

    @Transactional
    public CartResponse updateCartItem(Long userId, Long itemId, Integer quantity) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!item.getUser().getId().equals(userId)) {
            throw new BadRequestException("Cart item does not belong to user");
        }

        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            if (quantity > item.getVariant().getStockQuantity()) {
                throw new BadRequestException("Quantity exceeds stock");
            }
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        return getCart(userId);
    }

    @Transactional
    public CartResponse removeCartItem(Long userId, Long itemId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!item.getUser().getId().equals(userId)) {
            throw new BadRequestException("Cart item does not belong to user");
        }

        cartItemRepository.delete(item);
        return getCart(userId);
    }

    @Transactional
    public void clearCart(Long userId) {
        cartItemRepository.deleteByUserId(userId);
    }

    private CartResponse buildCartResponse(List<CartItem> items) {
        List<CartResponse.CartItemDto> dtos = items.stream()
                .map(item -> {
                    ProductVariant v = item.getVariant();
                    Product p = v.getProduct();
                    BigDecimal unitPrice = v.getFinalPrice();
                    BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

                    String imageUrl = p.getImages().stream()
                            .filter(ProductImage::getIsPrimary)
                            .map(ProductImage::getImageUrl)
                            .findFirst()
                            .orElse(p.getImages().isEmpty() ? null : p.getImages().get(0).getImageUrl());

                    return CartResponse.CartItemDto.builder()
                            .id(item.getId())
                            .variantId(v.getId())
                            .productId(p.getId())
                            .productName(p.getName())
                            .productSlug(p.getSlug())
                            .imageUrl(imageUrl)
                            .size(v.getSize())
                            .color(v.getColor())
                            .colorCode(v.getColorCode())
                            .quantity(item.getQuantity())
                            .unitPrice(unitPrice)
                            .totalPrice(totalPrice)
                            .stockQuantity(v.getStockQuantity())
                            .build();
                })
                .collect(Collectors.toList());

        BigDecimal total = dtos.stream()
                .map(CartResponse.CartItemDto::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalItems = dtos.stream()
                .mapToInt(CartResponse.CartItemDto::getQuantity)
                .sum();

        return CartResponse.builder()
                .items(dtos)
                .totalAmount(total)
                .totalItems(totalItems)
                .build();
    }
}
