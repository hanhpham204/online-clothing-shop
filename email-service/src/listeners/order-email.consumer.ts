import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamConsumer } from '../events/stream-consumer.base';
import {
  EventEnvelope,
  OrderCreatedPayload,
  STREAM_NAMES,
  StreamName,
} from '../events/event-types';
import { MailService } from '../mail/mail.service';
import { renderOrderCreatedEmail } from '../mail/templates';
import { IdempotencyService } from './idempotency.service';

@Injectable()
export class OrderEmailConsumer extends StreamConsumer {
  protected readonly streamName: StreamName = STREAM_NAMES.orderCreated;
  protected readonly groupName = 'cg.email-service.orders';

  constructor(
    configService: ConfigService,
    private readonly mailService: MailService,
    private readonly idempotency: IdempotencyService,
  ) {
    super(configService);
  }

  protected async handle(envelope: EventEnvelope, messageId: string): Promise<void> {
    const payload = envelope.payload as OrderCreatedPayload;
    if (!payload?.email) {
      this.logger.warn(
        `order.created envelope ${envelope.eventId} (msgId=${messageId}) has no recipient email, skipping (order=${payload?.orderId}).`,
      );
      return;
    }

    const isFresh = await this.idempotency.claim(`order:${envelope.eventId}`);
    if (!isFresh) {
      this.logger.log(
        `Duplicate order.created event ${envelope.eventId} (msgId=${messageId}) — already emailed. Skipping.`,
      );
      return;
    }

    this.logger.log(
      `Sending order confirmation email — eventId=${envelope.eventId} orderId=${payload.orderId} to=${payload.email}`,
    );
    const rendered = renderOrderCreatedEmail(payload);
    await this.mailService.send(payload.email, rendered);
  }
}
