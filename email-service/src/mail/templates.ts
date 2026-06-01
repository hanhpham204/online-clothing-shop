import {
  AuthOtpRequestedPayload,
  OrderCreatedPayload,
} from '../events/event-types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(amount));
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

export function renderOtpEmail(payload: AuthOtpRequestedPayload): RenderedEmail {
  const greeting = payload.fullName ? `Hi ${escapeHtml(payload.fullName)},` : 'Hi there,';
  const purposeLabel =
    payload.purpose === 'PASSWORD_RESET'
      ? 'reset your password'
      : 'verify your email';
  const subject =
    payload.purpose === 'PASSWORD_RESET'
      ? 'Your LUA LA password reset code'
      : 'Your LUA LA verification code';

  const text = `${greeting}\n\nUse the code below to ${purposeLabel}.\n\nCode: ${payload.otp}\n\nThis code will expire at ${payload.expiresAt}.\n\nIf you did not request this code, please ignore this email.\n\n— LUA LA Team`;

  const html = `<!doctype html>
<html><body style="font-family:Inter,Arial,sans-serif;background:#0f172a;color:#f8fafc;padding:32px;">
  <div style="max-width:560px;margin:0 auto;background:#1e293b;border-radius:16px;padding:32px;">
    <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#ffffff;">LUA LA</h1>
    <p style="margin:0 0 16px 0;">${greeting}</p>
    <p style="margin:0 0 24px 0;">Use the code below to ${purposeLabel}.</p>
    <div style="font-family:'Courier New',monospace;font-size:32px;letter-spacing:8px;font-weight:700;text-align:center;background:#0f172a;border:1px solid #334155;border-radius:12px;padding:20px;margin-bottom:24px;color:#facc15;">${escapeHtml(payload.otp)}</div>
    <p style="margin:0 0 8px 0;color:#cbd5e1;font-size:13px;">Expires at: ${escapeHtml(payload.expiresAt)}</p>
    <p style="margin:0;color:#94a3b8;font-size:13px;">If you did not request this code, please ignore this email.</p>
  </div>
</body></html>`;

  return { subject, text, html };
}

export function renderOrderCreatedEmail(payload: OrderCreatedPayload): RenderedEmail {
  const subject = `Order ${payload.orderId} received — LUA LA`;
  const isBankTransfer = payload.paymentMethod === 'BANK_TRANSFER';
  const paymentNote = isBankTransfer
    ? 'We are waiting for your bank transfer. Your order will ship as soon as the payment is confirmed.'
    : 'You chose Cash on Delivery. We will contact you to schedule shipping.';

  const itemsLines = payload.items
    .map(
      (item) =>
        `- ${item.name} (size ${item.size}) x${item.quantity} — $${formatCurrency(
          item.price * item.quantity,
        )}`,
    )
    .join('\n');

  const text = `Hi ${payload.fullName},\n\nThanks for your order at LUA LA!\n\nOrder ID: ${payload.orderId}\nPayment method: ${payload.paymentMethod}\nTotal: $${formatCurrency(payload.totalAmount)}\n\nItems:\n${itemsLines}\n\nShipping to: ${payload.shippingAddress}\n\n${paymentNote}\n\n— LUA LA Team`;

  const itemsHtml = payload.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #334155;">${escapeHtml(item.name)} <span style=\"color:#94a3b8;\">(size ${escapeHtml(item.size)})</span></td>
        <td style="padding:8px 0;border-bottom:1px solid #334155;text-align:center;">x${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #334155;text-align:right;">$${formatCurrency(item.price * item.quantity)}</td>
      </tr>`,
    )
    .join('');

  const html = `<!doctype html>
<html><body style="font-family:Inter,Arial,sans-serif;background:#0f172a;color:#f8fafc;padding:32px;">
  <div style="max-width:640px;margin:0 auto;background:#1e293b;border-radius:16px;padding:32px;">
    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#ffffff;">Order received</h1>
    <p style="margin:0 0 24px 0;color:#cbd5e1;">Order ID: <strong style="color:#ffffff;">${escapeHtml(payload.orderId)}</strong></p>

    <p style="margin:0 0 16px 0;">Hi ${escapeHtml(payload.fullName)},</p>
    <p style="margin:0 0 24px 0;">Thanks for shopping with LUA LA! ${paymentNote}</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">
          <th style="text-align:left;padding-bottom:8px;border-bottom:1px solid #475569;">Item</th>
          <th style="text-align:center;padding-bottom:8px;border-bottom:1px solid #475569;">Qty</th>
          <th style="text-align:right;padding-bottom:8px;border-bottom:1px solid #475569;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding-top:12px;font-weight:600;color:#cbd5e1;">Total</td>
          <td style="padding-top:12px;text-align:right;font-weight:700;color:#ffffff;">$${formatCurrency(payload.totalAmount)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:16px;margin-bottom:16px;">
      <div style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Shipping to</div>
      <div style="color:#ffffff;">${escapeHtml(payload.shippingAddress)}</div>
      <div style="color:#cbd5e1;font-size:13px;margin-top:4px;">${escapeHtml(payload.phoneNumber)}</div>
    </div>

    <p style="margin:0;color:#94a3b8;font-size:13px;">Payment method: ${escapeHtml(payload.paymentMethod)} • Status: ${escapeHtml(payload.paymentStatus)}</p>
  </div>
</body></html>`;

  return { subject, text, html };
}
