import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { CreateCheckoutIntentDto } from './dto/create-checkout-intent.dto';
import { StreamPublisherService } from '../events/stream-publisher.service';
import { PaymentCompletedPayload, STREAM_NAMES } from '../events/event-types';
import { PaymentsGateway } from './payments.gateway';
import Redis from 'ioredis';
import { REDIS_PUBLISHER } from '../events/redis-client';

interface SePayOrderResult {
  sepayOrderId: string;
  orderCode: string;
  vaNumber: string;
  bankName: string;
  qrCodeUrl: string;
  vaHolderName?: string;
  expiredAt?: Date;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private webhookToken: string;
  private vaPrefix: string;
  private sepayApiBaseUrl: string;
  private sepayApiToken: string;
  private sepayBankAccountXid: string;
  private sepayOrderDurationSeconds: number;
  private fixedAmount: number;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly streamPublisher: StreamPublisherService,
    private readonly paymentsGateway: PaymentsGateway,
    @Inject(REDIS_PUBLISHER) private readonly redisPublisher: Redis,
  ) {
    this.webhookToken = this.configService.get<string>('SEPAY_WEBHOOK_SECRET') || 'test_token';
    this.vaPrefix = this.configService.get<string>('SEPAY_VA_PREFIX') || 'SEP10002ILUALA';
    this.sepayApiBaseUrl = this.configService.get<string>('SEPAY_API_BASE_URL') || 'https://userapi.sepay.vn';
    this.sepayApiToken = this.configService.get<string>('SEPAY_API_TOKEN') || '';
    this.sepayBankAccountXid = this.configService.get<string>('SEPAY_BANK_ACCOUNT_XID') || '';
    this.sepayOrderDurationSeconds = Number(
      this.configService.get<string>('SEPAY_ORDER_DURATION_SECONDS') || '86400',
    );
    // Fixed SePay payment amount (VND) for every order, so USD-priced orders
    // don't end up with an enormous VND amount after conversion. Override via
    // the SEPAY_FIXED_AMOUNT env var (defaults to 10,000 VND).
    this.fixedAmount = Number(
      this.configService.get<string>('SEPAY_FIXED_AMOUNT') || '10000',
    );
  }

  private generateTransferContent(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateUniqueTransferContent(): Promise<string> {
    let transferContent = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 15) {
      transferContent = this.generateTransferContent();
      const existing = await this.paymentModel.findOne({ transferContent, status: 'PENDING' });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      transferContent = Date.now().toString().slice(-6);
    }

    return transferContent;
  }

  private parseSePayExpiredAt(expiredAt?: string): Date | undefined {
    if (!expiredAt) return undefined;
    const parsed = new Date(expiredAt.replace(' ', 'T'));
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private isPaymentExpired(payment: PaymentDocument): boolean {
    if (payment.status !== 'PENDING') return false;
    if (payment.expiredAt) return new Date() > new Date(payment.expiredAt);
    return false;
  }

  private ensureSePayConfigured(): void {
    if (!this.sepayApiToken || !this.sepayBankAccountXid) {
      throw new InternalServerErrorException(
        'SePay is not configured. Please set SEPAY_API_TOKEN and SEPAY_BANK_ACCOUNT_XID.',
      );
    }
  }

  private async createSePayOrder(amount: number, orderCode: string): Promise<SePayOrderResult> {
    this.ensureSePayConfigured();

    const normalizedAmount = Math.max(1, Math.round(amount));

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.sepayApiBaseUrl}/v2/bank-accounts/${this.sepayBankAccountXid}/orders`,
          {
            amount: normalizedAmount,
            order_code: orderCode,
            va_prefix: this.vaPrefix,
            duration: this.sepayOrderDurationSeconds,
            with_qrcode: '1',
            qrcode_template: 'compact',
          },
          {
            headers: {
              Authorization: `Bearer ${this.sepayApiToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (!response.data || response.data.status !== 'success' || !response.data.data) {
        throw new InternalServerErrorException(
          response.data?.message || 'SePay did not return a valid order payload',
        );
      }

      const sepayOrderData = response.data.data;

      return {
        sepayOrderId: sepayOrderData.id,
        orderCode: sepayOrderData.order_code || orderCode,
        vaNumber: sepayOrderData.va_number,
        bankName: sepayOrderData.bank_name,
        qrCodeUrl: sepayOrderData.qr_code_url,
        vaHolderName: sepayOrderData.va_holder_name || sepayOrderData.account_holder_name,
        expiredAt: this.parseSePayExpiredAt(sepayOrderData.expired_at),
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      this.logger.error(`SePay Order API call failed: ${message}`);
      throw new InternalServerErrorException(`Failed to create SePay QR code: ${message}`);
    }
  }

  private mapPaymentResponse(payment: PaymentDocument) {
    return {
      paymentId: payment._id.toString(),
      orderId: payment.orderId,
      transferContent: payment.transferContent,
      amount: payment.amount,
      cartTotal: payment.pendingCheckout?.cartTotal,
      status: payment.status,
      vaNumber: payment.vaNumber,
      bankName: payment.bankName,
      qrCodeUrl: payment.qrCodeUrl,
      vaHolderName: payment.vaHolderName,
      expiredAt: payment.expiredAt,
      orderCreated: !!payment.orderCreated,
    };
  }

  private async refreshSePayOrder(payment: PaymentDocument): Promise<PaymentDocument> {
    const transferContent = await this.generateUniqueTransferContent();
    const sepayOrder = await this.createSePayOrder(this.fixedAmount, transferContent);

    payment.amount = this.fixedAmount;
    payment.transferContent = transferContent;
    payment.vaNumber = sepayOrder.vaNumber;
    payment.bankName = sepayOrder.bankName;
    payment.qrCodeUrl = sepayOrder.qrCodeUrl;
    payment.vaHolderName = sepayOrder.vaHolderName;
    payment.sepayOrderId = sepayOrder.sepayOrderId;
    payment.expiredAt = sepayOrder.expiredAt;

    return payment.save();
  }

  /**
   * Bank-transfer checkout intent. The Order document is NOT created here —
   * we keep the cart in `pendingCheckout` and only fire payment.completed
   * (via Redis Streams) once SePay confirms the transfer. order-service
   * consumes that event and creates the Order at that point.
   */
  async createCheckoutIntent(dto: CreateCheckoutIntentDto) {
    const cartTotal = dto.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const transferContent = await this.generateUniqueTransferContent();
    const sepayOrder = await this.createSePayOrder(this.fixedAmount, transferContent);

    const payment = new this.paymentModel({
      amount: this.fixedAmount,
      transferContent,
      status: 'PENDING',
      vaNumber: sepayOrder.vaNumber,
      bankName: sepayOrder.bankName,
      qrCodeUrl: sepayOrder.qrCodeUrl,
      vaHolderName: sepayOrder.vaHolderName,
      sepayOrderId: sepayOrder.sepayOrderId,
      expiredAt: sepayOrder.expiredAt,
      pendingCheckout: {
        userId: dto.userId,
        email: dto.email,
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        shippingAddress: dto.shippingAddress,
        items: dto.items,
        cartTotal,
      },
    });

    const saved = await payment.save();
    this.logger.log(
      `Checkout intent ${saved._id} — VA ${saved.vaNumber}, transferContent=${transferContent}, cartTotal=${cartTotal}, charge=${saved.amount} VND, expires=${saved.expiredAt?.toISOString() || 'n/a'}`,
    );

    return this.mapPaymentResponse(saved);
  }

  /**
   * Legacy entry-point kept for backwards compatibility (used by older flows
   * where order-service created the Order first and then asked us for a QR).
   * The new path is createCheckoutIntent.
   */
  async createTransaction(orderId: string, _amount: number) {
    const transferContent = await this.generateUniqueTransferContent();
    const sepayOrder = await this.createSePayOrder(this.fixedAmount, transferContent);

    const payment = new this.paymentModel({
      orderId,
      amount: this.fixedAmount,
      transferContent,
      status: 'PENDING',
      vaNumber: sepayOrder.vaNumber,
      bankName: sepayOrder.bankName,
      qrCodeUrl: sepayOrder.qrCodeUrl,
      vaHolderName: sepayOrder.vaHolderName,
      sepayOrderId: sepayOrder.sepayOrderId,
      expiredAt: sepayOrder.expiredAt,
    });

    const saved = await payment.save();
    this.logger.log(
      `Created SePay payment for order ${orderId}. VA: ${saved.vaNumber}, amount: ${saved.amount}, expires: ${saved.expiredAt?.toISOString() || 'n/a'}`,
    );

    return this.mapPaymentResponse(saved);
  }

  async getPaymentById(paymentId: string) {
    if (!isValidObjectId(paymentId)) {
      throw new BadRequestException(`Invalid payment id: ${paymentId}`);
    }
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    if (this.isPaymentExpired(payment)) {
      this.logger.warn(`Payment QR expired for payment ${paymentId}. Refreshing SePay order...`);
      const refreshed = await this.refreshSePayOrder(payment);
      return this.mapPaymentResponse(refreshed);
    }

    return this.mapPaymentResponse(payment);
  }

  async getPaymentByOrderId(orderId: string) {
    const payment = await this.paymentModel.findOne({ orderId });
    if (!payment) {
      throw new BadRequestException(`No payment information found for order ${orderId}`);
    }

    if (this.isPaymentExpired(payment)) {
      this.logger.warn(`Payment QR expired for order ${orderId}. Refreshing SePay order...`);
      const refreshedPayment = await this.refreshSePayOrder(payment);
      return this.mapPaymentResponse(refreshedPayment);
    }

    return this.mapPaymentResponse(payment);
  }

  async markOrderCreated(paymentId: string, orderId: string) {
    if (!isValidObjectId(paymentId)) {
      throw new BadRequestException(`Invalid payment id: ${paymentId}`);
    }
    const updated = await this.paymentModel.findByIdAndUpdate(
      paymentId,
      { orderId, orderCreated: true },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }
    this.logger.log(`Payment ${paymentId} linked to order ${orderId}.`);
    return this.mapPaymentResponse(updated);
  }

  async processWebhook(headers: any, body: any) {
    this.logger.log(`Received SePay Webhook. Headers: ${JSON.stringify(headers)}, Body: ${JSON.stringify(body)}`);

    const authHeader = headers['authorization'];
    if (!authHeader) {
      this.logger.error('Webhook request missing Authorization header');
      throw new UnauthorizedException('Missing authorization token');
    }

    const token = authHeader.replace(/Bearer |Apikey /i, '').trim();
    const apiToken = this.configService.get<string>('SEPAY_API_TOKEN') || '';
    const isMatch = token === this.webhookToken || (apiToken && token === apiToken);

    if (!isMatch) {
      this.logger.error(`Webhook token mismatch. Received: ${token}, Expected webhook secret or API token`);
      throw new UnauthorizedException('Invalid authorization token');
    }

    if (body.code === 'SEPAYTEST' || (body.content && body.content.toString().includes('SEPAY TEST'))) {
      this.logger.log('Received SePay Webhook Test Delivery. Confirming success.');
      return { success: true };
    }

    const transferType = body.transferType || body.transfer_type || 'in';
    if (transferType.toLowerCase() !== 'in') {
      this.logger.log(`Skipping non-inward transaction: ${transferType}`);
      return { success: true };
    }

    const amountReceived = Number(body.transferAmount || body.amount_in || body.amount || 0);
    const content = [body.content, body.transferDescription, body.description]
      .filter(Boolean)
      .join(' ');
    const code = (body.code || '').toString().trim();
    const subAccount = (body.subAccount || body.sub_account || '').toString().trim();
    const accountNumber = (body.accountNumber || body.account_number || '').toString().trim();
    const transferContentCandidates = new Set<string>();

    if (code && code !== 'null') {
      transferContentCandidates.add(code);
    }

    if (subAccount && this.vaPrefix && subAccount.startsWith(this.vaPrefix)) {
      const codeFromVa = subAccount.substring(this.vaPrefix.length).trim();
      if (codeFromVa) {
        transferContentCandidates.add(codeFromVa);
      }
    }

    for (const match of content.matchAll(/LUALA\s*(\d{6})/gi)) {
      transferContentCandidates.add(match[1]);
    }

    let payment: PaymentDocument | null = null;
    const vaCandidates = [subAccount, accountNumber].filter(Boolean);
    if (vaCandidates.length > 0) {
      payment = await this.paymentModel.findOne({
        vaNumber: { $in: vaCandidates },
      });
    }

    const candidates = Array.from(transferContentCandidates);
    if (!payment && candidates.length > 0) {
      payment = await this.paymentModel.findOne({
        transferContent: { $in: candidates },
      });
    }

    if (!payment) {
      const pendingPayments = await this.paymentModel.find({ status: 'PENDING' });
      for (const p of pendingPayments) {
        const matchesContent = content.includes(p.transferContent);
        const matchesVa = !!p.vaNumber && vaCandidates.includes(p.vaNumber);
        if (matchesContent || matchesVa) {
          payment = p;
          this.logger.log(`Reconciled via fallback scan. Found code: ${p.transferContent}`);
          break;
        }
      }
    }

    if (!payment) {
      this.logger.error(
        `No payment matched SePay webhook. code: "${code}", subAccount: "${subAccount}", accountNumber: "${accountNumber}", content: "${content}"`,
      );
      throw new BadRequestException('Payment not found for webhook transaction');
    }

    if (payment.status === 'COMPLETED') {
      this.logger.log(`Duplicate SePay webhook for completed payment ${payment._id}. Returning success.`);
      // Re-publishing is safe — the consumer dedupes by eventId/paymentId,
      // but we don't need to spam the stream. Just acknowledge.
      return { success: true };
    }

    if (payment.status !== 'PENDING') {
      this.logger.warn(`Skipping SePay webhook for payment ${payment._id} with status ${payment.status}.`);
      return { success: true };
    }

    if (amountReceived < payment.amount) {
      this.logger.error(`Insufficient amount. Required: ${payment.amount}, Received: ${amountReceived}`);
      payment.status = 'FAILED';
      await payment.save();
      
      this.paymentsGateway.sendPaymentStatus(payment._id.toString(), 'FAILED');
      try {
        await this.redisPublisher.publish(`payment:status:${payment._id.toString()}`, 'FAILED');
      } catch (err) {
        this.logger.error(`Failed to publish FAILED status to Redis Pub/Sub: ${(err as Error).message}`);
      }
      
      throw new BadRequestException(`Insufficient amount received. Required ${payment.amount}`);
    }

    payment.status = 'COMPLETED';
    payment.transactionId = body.id || body.referenceCode || body.code || '';
    payment.bankBrand = body.gateway || '';
    payment.accountNumber = body.accountNumber || '';
    await payment.save();

    this.logger.log(`Payment ${payment._id} marked COMPLETED. Publishing payment.completed to Redis Stream.`);
    
    this.paymentsGateway.sendPaymentStatus(payment._id.toString(), 'COMPLETED');
    try {
      await this.redisPublisher.publish(`payment:status:${payment._id.toString()}`, 'COMPLETED');
    } catch (err) {
      this.logger.error(`Failed to publish COMPLETED status to Redis Pub/Sub: ${(err as Error).message}`);
    }

    if (payment.pendingCheckout) {
      try {
        await this.publishPaymentCompleted(payment, amountReceived, body);
      } catch (err) {
        // Stream durability + retries via XAUTOCLAIM mean order-service will
        // eventually receive the event when Redis is back, so we don't fail
        // the webhook here — that would make SePay retry which is wasteful.
        this.logger.error(
          `Failed to publish payment.completed for payment ${payment._id}: ${(err as Error).message}. Webhook ACKed; will be picked up after restart.`,
        );
      }
    } else if (payment.orderId) {
      // Legacy COD path that pre-created an order; skip stream publish.
      this.logger.warn(
        `Payment ${payment._id} has no pendingCheckout (legacy flow with pre-existing orderId=${payment.orderId}). Skipping payment.completed publish.`,
      );
    } else {
      this.logger.warn(
        `Payment ${payment._id} completed but has neither pendingCheckout nor orderId — cannot materialize an Order.`,
      );
    }

    return { success: true };
  }

  private async publishPaymentCompleted(
    payment: PaymentDocument,
    amountReceived: number,
    webhookBody: any,
  ): Promise<void> {
    const pending = payment.pendingCheckout;
    if (!pending) return;

    const payload: PaymentCompletedPayload = {
      paymentId: payment._id.toString(),
      paymentMethod: 'BANK_TRANSFER',
      transactionId: payment.transactionId || undefined,
      transferContent: payment.transferContent,
      paidAmount: amountReceived,
      cartTotal: pending.cartTotal,
      bankBrand: payment.bankBrand || webhookBody?.gateway || undefined,
      accountNumber: payment.accountNumber || undefined,
      paidAt: new Date().toISOString(),
      customer: {
        userId: pending.userId,
        email: pending.email,
        fullName: pending.fullName,
        phoneNumber: pending.phoneNumber,
        shippingAddress: pending.shippingAddress,
      },
      items: pending.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        image: item.image,
      })),
    };

    // Use the paymentId as a stable eventId — if the webhook is retried,
    // we want the consumer to see the same id and dedupe.
    await this.streamPublisher.publish(STREAM_NAMES.paymentCompleted, payload, {
      eventId: `payment-completed:${payment._id.toString()}`,
    });
  }
}
