import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { OtpEmailConsumer } from './otp-email.consumer';
import { OrderEmailConsumer } from './order-email.consumer';
import { IdempotencyService } from './idempotency.service';

@Module({
  imports: [MailModule],
  providers: [IdempotencyService, OtpEmailConsumer, OrderEmailConsumer],
})
export class ListenersModule {}
