import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamConsumer } from '../events/stream-consumer.base';
import {
  EventEnvelope,
  OrderCancelledPayload,
  STREAM_NAMES,
  StreamName,
} from '../events/event-types';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrderCancelledConsumer extends StreamConsumer {
  protected readonly streamName: StreamName = STREAM_NAMES.orderCancelled;
  protected readonly groupName = 'cg.product-service.order-cancelled';

  constructor(
    configService: ConfigService,
    private readonly productsService: ProductsService,
  ) {
    super(configService);
  }

  protected async handle(envelope: EventEnvelope, messageId: string): Promise<void> {
    const payload = envelope.payload as OrderCancelledPayload & { items?: any[] };
    if (!payload?.orderId) {
      this.logger.warn(
        `order.cancelled envelope ${envelope.eventId} (msgId=${messageId}) missing orderId, skipping.`,
      );
      return;
    }

    if (!payload.items || payload.items.length === 0) {
      this.logger.warn(
        `order.cancelled event for orderId=${payload.orderId} has no items to release, skipping.`,
      );
      return;
    }

    this.logger.log(
      `Handling order.cancelled eventId=${envelope.eventId} msgId=${messageId} orderId=${payload.orderId} (Releasing stock)`
    );

    try {
      const releaseItems = payload.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      await this.productsService.releaseStock(releaseItems);
      this.logger.log(`Stock released successfully for orderId=${payload.orderId}`);
    } catch (err) {
      this.logger.error(
        `Failed to release stock for orderId=${payload.orderId}: ${(err as Error).message}`
      );
    }
  }
}
