// Shared event contract used across services for Redis Streams transport.
// Keep in sync with the matching files in email-service, user-service, and payment-service.

export const STREAM_NAMES = {
  authOtpRequested: 'streams.auth.otp.requested',
  paymentCompleted: 'streams.payment.completed',
  orderCreated: 'streams.order.created',
} as const;

export type StreamName = (typeof STREAM_NAMES)[keyof typeof STREAM_NAMES];

export interface EventEnvelope<TPayload = unknown> {
  eventId: string;
  eventType: StreamName;
  occurredAt: string;
  source: string;
  payload: TPayload;
}

export interface CheckoutItemPayload {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  image?: string;
}

export interface CheckoutCustomerPayload {
  userId?: string;
  email?: string;
  fullName: string;
  phoneNumber: string;
  shippingAddress: string;
}

export interface PaymentCompletedPayload {
  paymentId: string;
  paymentMethod: 'BANK_TRANSFER';
  transactionId?: string;
  transferContent: string;
  paidAmount: number;
  cartTotal: number;
  bankBrand?: string;
  accountNumber?: string;
  paidAt: string;
  customer: CheckoutCustomerPayload;
  items: CheckoutItemPayload[];
}

export interface OrderCreatedPayload {
  orderId: string;
  paymentId?: string;
  userId?: string;
  email?: string;
  fullName: string;
  phoneNumber: string;
  shippingAddress: string;
  items: CheckoutItemPayload[];
  totalAmount: number;
  paymentMethod: 'COD' | 'BANK_TRANSFER';
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
}
