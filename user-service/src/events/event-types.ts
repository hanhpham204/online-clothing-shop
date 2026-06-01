// Shared event contract used across services for Redis Streams transport.
// Keep in sync with the matching files in email-service, order-service, and payment-service.

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
