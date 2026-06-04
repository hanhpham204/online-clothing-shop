import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamConsumer } from '../events/stream-consumer.base';
import { StreamPublisherService } from '../events/stream-publisher.service';
import {
  EventEnvelope,
  OrderCreatedPayload,
  STREAM_NAMES,
  StreamName,
  StockReservedPayload,
  StockFailedPayload,
} from '../events/event-types';
import { ProductsService } from '../products/products.service';

@Injectable()
export class OrderCreatedConsumer extends StreamConsumer {
  protected readonly streamName: StreamName = STREAM_NAMES.orderCreated;
  protected readonly groupName = 'cg.product-service.order-created';

  constructor(
    configService: ConfigService,
    private readonly productsService: ProductsService,
    private readonly publisher: StreamPublisherService,
  ) {
    super(configService);
  }

  protected async handle(envelope: EventEnvelope, messageId: string): Promise<void> {
    const payload = envelope.payload as OrderCreatedPayload;
    if (!payload?.orderId || !payload?.items) {
      this.logger.warn(
        `order.created envelope ${envelope.eventId} (msgId=${messageId}) missing orderId or items, skipping.`,
      );
      return;
    }

    this.logger.log(
      `Handling order.created eventId=${envelope.eventId} msgId=${messageId} orderId=${payload.orderId}`,
    );

    try {
      const reservationItems = payload.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      await this.productsService.reserveStock(reservationItems);

      this.logger.log(`Stock reserved successfully for orderId=${payload.orderId}`);

      await this.publisher.publish<StockReservedPayload>(
        STREAM_NAMES.stockReserved,
        { orderId: payload.orderId },
        { eventId: envelope.eventId }
      );
    } catch (err) {
      const reason = (err as Error).message || 'Lỗi không xác định';
      this.logger.error(`Stock reservation failed for orderId=${payload.orderId}: ${reason}`);

      await this.publisher.publish<StockFailedPayload>(
        STREAM_NAMES.stockFailed,
        { orderId: payload.orderId, reason },
        { eventId: envelope.eventId }
      );
    }
  }
}
