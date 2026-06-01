import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
export class OrderItem {
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  size: string;

  @Prop()
  image?: string;
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
  @Prop()
  userId?: string;

  @Prop()
  email?: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  shippingAddress: string;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true, enum: ['COD', 'BANK_TRANSFER'] })
  paymentMethod: string;

  @Prop({ required: true, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' })
  paymentStatus: string;

  @Prop({
    required: true,
    enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING',
  })
  orderStatus: string;

  // Unique (sparse) — so COD orders with no paymentId don't conflict, but the
  // payment.completed consumer can rely on Mongo's unique index to guarantee
  // exactly-once order creation per payment, even under stream redelivery.
  @Prop({ unique: true, sparse: true })
  paymentId?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
