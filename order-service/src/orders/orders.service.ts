import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { StreamPublisherService } from '../events/stream-publisher.service';
import {
  OrderCreatedPayload,
  PaymentCompletedPayload,
  OrderCancelledPayload,
  STREAM_NAMES,
} from '../events/event-types';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly paymentServiceUrl: string;

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly streamPublisher: StreamPublisherService,
  ) {
    this.paymentServiceUrl =
      this.configService.get<string>('PAYMENT_SERVICE_URL') || 'http://localhost:8085';
  }

  /**
   * COD-only entry point. Bank-transfer orders are created via the
   * payment.completed stream consumer, NOT by the frontend hitting this
   * endpoint directly.
   */
  async create(createOrderDto: CreateOrderDto) {
    if (createOrderDto.paymentMethod === 'BANK_TRANSFER') {
      throw new BadRequestException(
        'BANK_TRANSFER orders must be initiated via /payments/checkout-intent. ' +
          'The order will be created automatically once the bank transfer is confirmed.',
      );
    }

    const totalAmount = createOrderDto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const createdOrder = new this.orderModel({
      ...createOrderDto,
      totalAmount,
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING_STOCK',
    });

    const savedOrder = await createdOrder.save();
    await this.publishOrderCreated(savedOrder);

    return { order: savedOrder };
  }

  /**
   * Idempotent order materialization from a payment.completed event. If an
   * Order with this paymentId already exists (because the stream redelivered
   * the same message after a crash), we return the existing one without
   * double-publishing order.created.
   */
  async createFromPaymentCompleted(payload: PaymentCompletedPayload): Promise<OrderDocument> {
    const existing = await this.orderModel.findOne({ paymentId: payload.paymentId });
    if (existing) {
      this.logger.log(
        `Order for paymentId=${payload.paymentId} already exists (orderId=${existing._id}). Skipping duplicate creation.`,
      );
      return existing;
    }

    const order = new this.orderModel({
      paymentId: payload.paymentId,
      userId: payload.customer.userId,
      email: payload.customer.email,
      fullName: payload.customer.fullName,
      phoneNumber: payload.customer.phoneNumber,
      shippingAddress: payload.customer.shippingAddress,
      items: payload.items,
      totalAmount: payload.cartTotal,
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PAID',
      orderStatus: 'PENDING_STOCK',
    });

    try {
      const saved = await order.save();
      this.logger.log(
        `Materialized Order ${saved._id} from paymentId=${payload.paymentId} (paid=${payload.paidAmount} VND, cartTotal=$${payload.cartTotal}).`,
      );
      await this.publishOrderCreated(saved);
      await this.notifyPaymentLinked(payload.paymentId, saved._id.toString());
      return saved;
    } catch (err: any) {
      // Unique-index race: another consumer just created the same order;
      // re-fetch and return it instead of failing the message.
      if (err?.code === 11000) {
        const existing2 = await this.orderModel.findOne({ paymentId: payload.paymentId });
        if (existing2) {
          this.logger.warn(
            `Duplicate key on paymentId=${payload.paymentId}, resolved by re-fetch (orderId=${existing2._id}).`,
          );
          return existing2;
        }
      }
      throw err;
    }
  }

  private async notifyPaymentLinked(paymentId: string, orderId: string) {
    // Fire-and-forget HTTP call so the frontend's payment-polling sees the
    // linked orderId quickly. If this fails, the order is still safe — we
    // already published order.created on the stream.
    try {
      await firstValueFrom(
        this.httpService.patch(
          `${this.paymentServiceUrl}/payments/${paymentId}/link-order`,
          { orderId },
        ),
      );
    } catch (err) {
      this.logger.warn(
        `Could not back-fill orderId on payment ${paymentId}: ${(err as Error).message}`,
      );
    }
  }

  private async publishOrderCreated(order: OrderDocument) {
    const payload: OrderCreatedPayload = {
      orderId: order._id.toString(),
      paymentId: order.paymentId,
      userId: order.userId,
      email: order.email,
      fullName: order.fullName,
      phoneNumber: order.phoneNumber,
      shippingAddress: order.shippingAddress,
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        image: item.image,
      })),
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod as OrderCreatedPayload['paymentMethod'],
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt:
        (order as unknown as { createdAt?: Date }).createdAt?.toISOString?.() ??
        new Date().toISOString(),
    };

    try {
      // Stable eventId so duplicate publishes (e.g. from retries) dedupe on
      // the email-service side via idempotency cache.
      await this.streamPublisher.publish(STREAM_NAMES.orderCreated, payload, {
        eventId: `order-created:${payload.orderId}`,
      });
    } catch (err) {
      this.logger.warn(
        `Could not publish order.created for ${payload.orderId}: ${(err as Error).message}`,
      );
    }
  }

  async findAll(userId?: string): Promise<OrderDocument[]> {
    const filter = userId ? { userId } : {};
    return this.orderModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async updateStatus(
    id: string,
    paymentStatus: string,
    orderStatus: string,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    order.paymentStatus = paymentStatus;
    order.orderStatus = orderStatus;
    return await order.save();
  }

  async cancelOrder(orderId: string, reason: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    order.orderStatus = 'CANCELLED';
    const saved = await order.save();

    this.logger.log(`Order ${orderId} has been CANCELLED. Reason: ${reason}`);

    // Publish order.cancelled event so payment service can refund and product service can release stock
    await this.publishOrderCancelled(saved, reason);

    return saved;
  }

  async confirmOrder(orderId: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.paymentMethod === 'COD') {
      order.orderStatus = 'PENDING';
    } else {
      order.orderStatus = 'CONFIRMED';
    }

    const saved = await order.save();
    this.logger.log(`Order ${orderId} has been CONFIRMED. Current status: ${saved.orderStatus}`);
    return saved;
  }

  private async publishOrderCancelled(order: OrderDocument, reason: string) {
    const payload: OrderCancelledPayload = {
      orderId: order._id.toString(),
      paymentId: order.paymentId,
      userId: order.userId,
      email: order.email,
      totalAmount: order.totalAmount,
      reason,
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        image: item.image,
      })),
    };

    try {
      await this.streamPublisher.publish(STREAM_NAMES.orderCancelled, payload, {
        eventId: `order-cancelled:${payload.orderId}`,
      });
    } catch (err) {
      this.logger.warn(
        `Could not publish order.cancelled for ${payload.orderId}: ${(err as Error).message}`,
      );
    }
  }
}
