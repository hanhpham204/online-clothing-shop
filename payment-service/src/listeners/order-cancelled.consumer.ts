import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamConsumer } from '../events/stream-consumer.base';
import {
  EventEnvelope,
  OrderCancelledPayload,
  STREAM_NAMES,
  StreamName,
} from '../events/event-types';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class OrderCancelledConsumer extends StreamConsumer {
  protected readonly streamName: StreamName = STREAM_NAMES.orderCancelled;
  protected readonly groupName = 'cg.payment-service.order-cancelled';

  constructor(
    configService: ConfigService,
    private readonly paymentsService: PaymentsService,
  ) {
    super(configService);
  }

  protected async handle(envelope: EventEnvelope, messageId: string): Promise<void> {
    const payload = envelope.payload as OrderCancelledPayload;
    if (!payload?.orderId) {
      this.logger.warn(
        `order.cancelled envelope ${envelope.eventId} (msgId=${messageId}) missing orderId, skipping.`,
      );
      return;
    }

    this.logger.log(
      `Handling order.cancelled eventId=${envelope.eventId} msgId=${messageId} orderId=${payload.orderId}`
    );

    try {
      await this.paymentsService.processRefund(payload.orderId, payload.paymentId, payload.reason || 'Saga rollback');
    } catch (err) {
      this.logger.error(
        `Failed to process refund for orderId=${payload.orderId}: ${(err as Error).message}`
      );
    }
  }
}
