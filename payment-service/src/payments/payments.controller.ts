import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateCheckoutIntentDto } from './dto/create-checkout-intent.dto';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ---------- New Streams-based bank-transfer entry point ----------
  // Frontend calls this for BANK_TRANSFER. Returns a SePay QR; the actual
  // Order is created later by order-service once the payment.completed event
  // arrives via Redis Stream.
  @Post('payments/checkout-intent')
  async createCheckoutIntent(@Body() dto: CreateCheckoutIntentDto) {
    return this.paymentsService.createCheckoutIntent(dto);
  }

  // ---------- Legacy path (kept for compatibility) ----------
  @Post('payments/create-transaction')
  async createTransaction(@Body() body: { orderId: string; amount: number }) {
    return this.paymentsService.createTransaction(body.orderId, body.amount);
  }

  // Look up a payment by orderId (used by My Orders / Pay-Now flow).
  // Declared BEFORE the generic /payments/:paymentId so it always matches.
  @Get('payments/order/:orderId')
  async getPaymentByOrderId(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentByOrderId(orderId);
  }

  // ---------- Polled by the checkout page while waiting for SePay ----------
  @Get('payments/:paymentId')
  async getPaymentById(@Param('paymentId') paymentId: string) {
    return this.paymentsService.getPaymentById(paymentId);
  }

  // Called by order-service over HTTP after it materializes an Order from
  // a payment.completed event. Lets the frontend know it's safe to show
  // the order on the My Orders page.
  @Patch('payments/:paymentId/link-order')
  async linkOrder(
    @Param('paymentId') paymentId: string,
    @Body() body: { orderId: string },
  ) {
    return this.paymentsService.markOrderCreated(paymentId, body.orderId);
  }

  // Accept every common SePay webhook path so we never return 404 for a
  // misconfigured URL.
  @Post([
    'payments/webhook/sepay',
    'api/v1/payments/sepay/webhook',
    'payments/sepay/webhook',
    'sepay/webhook',
  ])
  async processWebhook(@Headers() headers: any, @Body() body: any) {
    return this.paymentsService.processWebhook(headers, body);
  }
}
