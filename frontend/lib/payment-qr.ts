export interface PaymentQrInfo {
  transferContent: string;
  amount: number;
  vaNumber?: string;
  bankName?: string;
  qrCodeUrl?: string;
  vaHolderName?: string;
}

export interface BankDisplayInfo {
  bankId: string;
  bankAccount: string;
  accountName: string;
  isVa: boolean;
}

export function getBankDisplayInfo(): BankDisplayInfo {
  return {
    bankId: process.env.NEXT_PUBLIC_BANK_ID || "Sacombank",
    bankAccount: process.env.NEXT_PUBLIC_BANK_ACCOUNT || "SEP20002ILUALA",
    accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "LUALA SHOP",
    isVa: process.env.NEXT_PUBLIC_IS_VA !== "false",
  };
}

export function getVaAccountNumber(
  payment: PaymentQrInfo,
  bankInfo: BankDisplayInfo = getBankDisplayInfo(),
): string {
  if (payment.vaNumber) return payment.vaNumber;
  if (bankInfo.isVa) return `${bankInfo.bankAccount}${payment.transferContent}`;
  return bankInfo.bankAccount;
}

export function getPaymentQrUrl(
  payment: PaymentQrInfo,
  bankInfo: BankDisplayInfo = getBankDisplayInfo(),
): string {
  if (payment.qrCodeUrl) {
    if (!payment.qrCodeUrl.includes("des=")) {
      const separator = payment.qrCodeUrl.includes("?") ? "&" : "?";
      return `${payment.qrCodeUrl}${separator}des=${encodeURIComponent(`LUALA ${payment.transferContent}`)}`;
    }
    return payment.qrCodeUrl;
  }

  const vaAccountNumber = getVaAccountNumber(payment, bankInfo);
  const bankName = payment.bankName || bankInfo.bankId;
  const amount = Math.round(payment.amount);
  const description = `LUALA ${payment.transferContent}`;

  return `https://qr.sepay.vn/img?acc=${encodeURIComponent(vaAccountNumber)}&bank=${encodeURIComponent(bankName)}&amount=${amount}&des=${encodeURIComponent(description)}`;
}

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(amount));
}

export function getAccountDisplayName(
  payment: PaymentQrInfo,
  bankInfo: BankDisplayInfo = getBankDisplayInfo(),
): string {
  return payment.vaHolderName || bankInfo.accountName;
}
