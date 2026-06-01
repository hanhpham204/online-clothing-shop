import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamConsumer } from '../events/stream-consumer.base';
import {
  EventEnvelope,
  PaymentCompletedPayload,
  STREAM_NAMES,
  StreamName,
} from '../events/event-types';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentCompletedConsumer extends StreamConsumer {
  protected readonly streamName: StreamName = STREAM_NAMES.paymentCompleted;
  protected readonly groupName = 'cg.order-service';

  constructor(
    configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {
    super(configService);
  }

  protected async handle(envelope: EventEnvelope, messageId: string): Promise<void> {
    const payload = envelope.payload as PaymentCompletedPayload;
    if (!payload?.paymentId) {
      this.logger.warn(
        `payment.completed envelope ${envelope.eventId} (msgId=${messageId}) missing paymentId, skipping.`,
      );
      return;
    }
    this.logger.log(
      `Handling payment.completed eventId=${envelope.eventId} msgId=${messageId} paymentId=${payload.paymentId}`,
    );
    await this.ordersService.createFromPaymentCompleted(payload);
  }
}
