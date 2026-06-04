import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { PaymentCompletedConsumer } from './payment-completed.consumer';
import { StockReservedConsumer } from './stock-reserved.consumer';
import { StockFailedConsumer } from './stock-failed.consumer';

@Module({
  imports: [OrdersModule],
  providers: [
    PaymentCompletedConsumer,
    StockReservedConsumer,
    StockFailedConsumer,
  ],
})
export class ListenersModule {}

