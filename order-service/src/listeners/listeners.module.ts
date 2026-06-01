import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { PaymentCompletedConsumer } from './payment-completed.consumer';

@Module({
  imports: [OrdersModule],
  providers: [PaymentCompletedConsumer],
})
export class ListenersModule {}
