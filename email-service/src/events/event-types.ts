// Shared event contract used across services for Redis Streams transport.
// Keep in sync with the matching files in user-service, order-service, and payment-service.

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

export interface AuthOtpRequestedPayload {
  email: string;
  otp: string;
  purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
  expiresAt: string;
  fullName?: string;
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

// Emitted by payment-service when a SePay bank transfer is confirmed.
// order-service consumes this to materialize the actual Order document.
export interface PaymentCompletedPayload {
  paymentId: string;
  paymentMethod: 'BANK_TRANSFER';
  transactionId?: string;
  transferContent: string;
  paidAmount: number; // VND received (from SePay)
  cartTotal: number; // USD total of the cart
  bankBrand?: string;
  accountNumber?: string;
  paidAt: string;
  customer: CheckoutCustomerPayload;
  items: CheckoutItemPayload[];
}

// Emitted by order-service after an Order is successfully created (COD direct,
// or after a payment.completed has been materialized for bank transfers).
// email-service consumes this to send the order confirmation email.
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
