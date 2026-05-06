package com.voguestore.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voguestore.dto.SepayWebhookDto;
import com.voguestore.entity.Order;
import com.voguestore.entity.PaymentTransaction;
import com.voguestore.enums.OrderStatus;
import com.voguestore.enums.PaymentStatus;
import com.voguestore.repository.OrderRepository;
import com.voguestore.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    private final OrderRepository orderRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ObjectMapper objectMapper;

    /**
     * Process SePay webhook callback.
     * Matches payment to order by extracting payment code from transfer content.
     * Idempotent: duplicate webhooks for same reference code are ignored.
     */
    @Transactional
    public boolean processWebhook(SepayWebhookDto webhook) {
        logger.info("Processing SePay webhook: gateway={}, amount={}, content={}",
                webhook.getGateway(), webhook.getTransferAmount(), webhook.getContent());

        // Only process incoming transfers
        if (!"in".equalsIgnoreCase(webhook.getTransferType())) {
            logger.info("Ignoring outgoing transfer");
            return true;
        }

        // Idempotency check
        if (webhook.getReferenceCode() != null) {
            Optional<PaymentTransaction> existing = paymentTransactionRepository
                    .findByReferenceCode(webhook.getReferenceCode());
            if (existing.isPresent()) {
                logger.info("Duplicate webhook ignored for reference: {}", webhook.getReferenceCode());
                return true;
            }
        }

        // Save transaction record
        PaymentTransaction transaction = PaymentTransaction.builder()
                .gateway(webhook.getGateway())
                .transactionDate(LocalDateTime.now())
                .accountNumber(webhook.getAccountNumber())
                .amount(webhook.getTransferAmount())
                .content(webhook.getContent())
                .referenceCode(webhook.getReferenceCode())
                .build();

        try {
            transaction.setSepayData(objectMapper.writeValueAsString(webhook));
        } catch (Exception e) {
            logger.warn("Failed to serialize webhook data", e);
        }

        // Try to match order by payment code in content
        String content = webhook.getContent();
        if (content != null) {
            // Search for payment code pattern (VSORDxxxxxxxx)
            Optional<Order> orderOpt = findOrderByContent(content);

            if (orderOpt.isPresent()) {
                Order order = orderOpt.get();

                // Verify amount matches
                if (webhook.getTransferAmount().compareTo(order.getTotalAmount()) >= 0) {
                    order.setPaymentStatus(PaymentStatus.PAID);
                    order.setStatus(OrderStatus.PAID);
                    order.setPaidAt(LocalDateTime.now());
                    orderRepository.save(order);

                    transaction.setOrder(order);
                    logger.info("Order {} paid successfully! Amount: {}",
                            order.getOrderCode(), webhook.getTransferAmount());
                } else {
                    logger.warn("Payment amount mismatch for order {}: expected={}, received={}",
                            order.getOrderCode(), order.getTotalAmount(), webhook.getTransferAmount());
                }
            } else {
                logger.warn("No matching order found for content: {}", content);
            }
        }

        paymentTransactionRepository.save(transaction);
        return true;
    }

    /**
     * Find order by searching for payment code in transfer content.
     * The content field may contain the payment code among other text.
     */
    private Optional<Order> findOrderByContent(String content) {
        // Remove spaces and convert to uppercase for matching
        String normalized = content.toUpperCase().replaceAll("\\s+", "");

        // Search all pending orders and check if their payment code is in the content
        var pendingOrders = orderRepository.findByStatus(OrderStatus.PENDING);
        for (Order order : pendingOrders) {
            if (order.getPaymentCode() != null &&
                normalized.contains(order.getPaymentCode().toUpperCase())) {
                return Optional.of(order);
            }
        }

        return Optional.empty();
    }

    public String getPaymentStatus(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElse(null);
        return order != null ? order.getPaymentStatus().name() : "NOT_FOUND";
    }
}
