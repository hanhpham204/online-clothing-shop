import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamConsumer } from '../events/stream-consumer.base';
import {
  EventEnvelope,
  StockReservedPayload,
  STREAM_NAMES,
  StreamName,
} from '../events/event-types';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class StockReservedConsumer extends StreamConsumer {
  protected readonly streamName: StreamName = STREAM_NAMES.stockReserved;
  protected readonly groupName = 'cg.order-service.stock-reserved';

  constructor(
    configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {
    super(configService);
  }

  protected async handle(envelope: EventEnvelope, messageId: string): Promise<void> {
    const payload = envelope.payload as StockReservedPayload;
    if (!payload?.orderId) {
      this.logger.warn(
        `stock.reserved envelope ${envelope.eventId} (msgId=${messageId}) missing orderId, skipping.`,
      );
      return;
    }

    this.logger.log(
      `Handling stock.reserved eventId=${envelope.eventId} msgId=${messageId} orderId=${payload.orderId}`
    );

    try {
      await this.ordersService.confirmOrder(payload.orderId);
    } catch (err) {
      this.logger.error(
        `Failed to confirm orderId=${payload.orderId} on stock.reserved: ${(err as Error).message}`
      );
    }
  }
}
