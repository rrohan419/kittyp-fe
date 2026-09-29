import type { ConsultationInvoice } from '@/services/invoiceService';

export function invoiceRemainingBalance(invoice: ConsultationInvoice): number {
  if (typeof invoice.balance === 'number') {
    return invoice.balance;
  }
  const amount = Number(invoice.amount) || 0;
  const paid = Number(invoice.paidAmount) || 0;
  return Math.max(0, amount - paid);
}

export function isInvoiceUnpaid(invoice: ConsultationInvoice): boolean {
  if (invoice.status === 'PAID' || invoice.paymentStatus === 'PAID') {
    return false;
  }
  return invoiceRemainingBalance(invoice) > 0;
}

const RECORDED_MODES = new Set(['UPI', 'CASH', 'CARD', 'NEFT', 'OTHER']);

export function recordedPaymentMode(paymentMode?: string): string {
  const mode = (paymentMode || '').trim().toUpperCase();
  return RECORDED_MODES.has(mode) ? mode : 'UPI';
}

export function prefillFromInvoice(invoice: ConsultationInvoice): {
  name?: string;
  email?: string;
  contact?: string;
} {
  let snap: Record<string, unknown> = {};
  if (invoice.ownerSnapshot) {
    try {
      snap = JSON.parse(invoice.ownerSnapshot) as Record<string, unknown>;
    } catch {
      snap = {};
    }
  }
  const name = typeof snap.ownerName === 'string' ? snap.ownerName : '';
  const email = typeof snap.ownerEmail === 'string' ? snap.ownerEmail : '';
  const contact = typeof snap.ownerPhone === 'string' ? snap.ownerPhone : '';
  return { name, email, contact };
}
