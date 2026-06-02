// Shared event contract used across services for Redis Streams transport.
// Keep in sync with the matching files in other services.

export const STREAM_NAMES = {
  authOtpRequested: 'streams.auth.otp.requested',
  paymentCompleted: 'streams.payment.completed',
  orderCreated: 'streams.order.created',
  stockReserved: 'streams.stock.reserved',
  stockFailed: 'streams.stock.failed',
  orderCancelled: 'streams.order.cancelled',
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

export interface StockReservedPayload {
  orderId: string;
}

export interface StockFailedPayload {
  orderId: string;
  reason: string;
}

export interface OrderCancelledPayload {
  orderId: string;
  paymentId?: string;
  userId?: string;
  email?: string;
  totalAmount: number;
  reason: string;
  items?: CheckoutItemPayload[];
}

