package vn.edu.iuh.fit.payment.dto;

public record PaymentResponse(Long paymentId, Long orderId, String status, Double amount) {
}
