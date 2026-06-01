import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ _id: false })
export class PendingCheckoutItem {
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

const PendingCheckoutItemSchema = SchemaFactory.createForClass(PendingCheckoutItem);

@Schema({ _id: false })
export class PendingCheckout {
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

  @Prop({ type: [PendingCheckoutItemSchema], required: true })
  items: PendingCheckoutItem[];

  @Prop({ required: true })
  cartTotal: number;
}

const PendingCheckoutSchema = SchemaFactory.createForClass(PendingCheckout);

@Schema({ timestamps: true })
export class Payment {
  // Optional now — for the new bank-transfer flow the Order is created only
  // AFTER payment succeeds, so orderId is back-filled later (or never if the
  // user abandons checkout). Kept for backward compatibility with COD orders
  // that already exist.
  @Prop()
  orderId?: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, unique: true })
  transferContent: string;

  @Prop({ required: true, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'PENDING' })
  status: string;

  @Prop()
  transactionId?: string;

  @Prop()
  bankBrand?: string;

  @Prop()
  accountNumber?: string;

  @Prop()
  vaNumber?: string;

  @Prop()
  bankName?: string;

  @Prop()
  qrCodeUrl?: string;

  @Prop()
  vaHolderName?: string;

  @Prop()
  sepayOrderId?: string;

  @Prop()
  expiredAt?: Date;

  // Cart + customer info saved while waiting for the bank transfer. Once the
  // SePay webhook arrives, payment-service publishes payment.completed using
  // this snapshot so order-service can materialize the actual Order.
  @Prop({ type: PendingCheckoutSchema })
  pendingCheckout?: PendingCheckout;

  // Marked true once order-service has acknowledged this payment by creating
  // an Order. Helps the frontend know when it's safe to show the order on
  // the My Orders page.
  @Prop({ default: false })
  orderCreated?: boolean;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
