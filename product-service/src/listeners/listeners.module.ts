import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { OrderCreatedConsumer } from './order-created.consumer';
import { OrderCancelledConsumer } from './order-cancelled.consumer';

@Module({
  imports: [ProductsModule],
  providers: [OrderCreatedConsumer, OrderCancelledConsumer],
})
export class ListenersModule {}
