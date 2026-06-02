import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { OrderCancelledConsumer } from './order-cancelled.consumer';

@Module({
  imports: [PaymentsModule],
  providers: [OrderCancelledConsumer],
})
export class ListenersModule {}
