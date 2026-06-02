import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamConsumer } from '../events/stream-consumer.base';
import {
  EventEnvelope,
  StockFailedPayload,
  STREAM_NAMES,
  StreamName,
} from '../events/event-types';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class StockFailedConsumer extends StreamConsumer {
  protected readonly streamName: StreamName = STREAM_NAMES.stockFailed;
  protected readonly groupName = 'cg.order-service.stock-failed';

  constructor(
    configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {
    super(configService);
  }

  protected async handle(envelope: EventEnvelope, messageId: string): Promise<void> {
    const payload = envelope.payload as StockFailedPayload;
    if (!payload?.orderId) {
      this.logger.warn(
        `stock.failed envelope ${envelope.eventId} (msgId=${messageId}) missing orderId, skipping.`,
      );
      return;
    }

    this.logger.log(
      `Handling stock.failed eventId=${envelope.eventId} msgId=${messageId} orderId=${payload.orderId} reason=${payload.reason || 'unknown'}`
    );

    try {
      await this.ordersService.cancelOrder(payload.orderId, payload.reason || 'Hết hàng hoặc lỗi tồn kho');
    } catch (err) {
      this.logger.error(
        `Failed to cancel orderId=${payload.orderId} on stock.failed: ${(err as Error).message}`
      );
    }
  }
}
