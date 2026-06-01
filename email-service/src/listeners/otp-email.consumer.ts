import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamConsumer } from '../events/stream-consumer.base';
import {
  AuthOtpRequestedPayload,
  EventEnvelope,
  STREAM_NAMES,
  StreamName,
} from '../events/event-types';
import { MailService } from '../mail/mail.service';
import { renderOtpEmail } from '../mail/templates';
import { IdempotencyService } from './idempotency.service';

@Injectable()
export class OtpEmailConsumer extends StreamConsumer {
  protected readonly streamName: StreamName = STREAM_NAMES.authOtpRequested;
  protected readonly groupName = 'cg.email-service.otp';

  constructor(
    configService: ConfigService,
    private readonly mailService: MailService,
    private readonly idempotency: IdempotencyService,
  ) {
    super(configService);
  }

  protected async handle(envelope: EventEnvelope, messageId: string): Promise<void> {
    const payload = envelope.payload as AuthOtpRequestedPayload;
    if (!payload?.email) {
      this.logger.warn(
        `auth.otp.requested envelope ${envelope.eventId} (msgId=${messageId}) has no email, skipping.`,
      );
      return;
    }

    const isFresh = await this.idempotency.claim(`otp:${envelope.eventId}`);
    if (!isFresh) {
      this.logger.log(
        `Duplicate OTP event ${envelope.eventId} (msgId=${messageId}) — already emailed. Skipping.`,
      );
      return;
    }

    this.logger.log(
      `Sending OTP email — eventId=${envelope.eventId} purpose=${payload.purpose} to=${payload.email}`,
    );
    const rendered = renderOtpEmail(payload);
    await this.mailService.send(payload.email, rendered);
  }
}
