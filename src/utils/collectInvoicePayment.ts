import { toast } from 'sonner';
import { callRazorpayCreateOrder, callRazorpayVerifyPayment } from '@/services/cartService';
import { ConsultationInvoice } from '@/services/invoiceService';
import { isRazorpayCheckoutError, openRazorpayCheckout } from '@/services/paymentService';
import { isInvoiceUnpaid, prefillFromInvoice } from '@/utils/invoicePaymentState';

export { isInvoiceUnpaid, prefillFromInvoice, invoiceRemainingBalance } from '@/utils/invoicePaymentState';

export async function collectInvoicePayment(invoice: ConsultationInvoice): Promise<void> {
  if (!isInvoiceUnpaid(invoice)) {
    throw new Error('Invoice is already paid');
  }
  const created = await callRazorpayCreateOrder({
    invoiceUuid: invoice.uuid,
    source: 'TREATMENT_INVOICE',
  });
  if (!created.success) {
    throw new Error(created.message || 'Failed to start payment');
  }

  const prefill = prefillFromInvoice(invoice);
  const response = await openRazorpayCheckout({
    amount: created.data.amount,
    currency: created.data.currency || 'INR',
    name: 'Kittyp',
    description: `Invoice ${invoice.invoiceNumber || invoice.uuid.slice(0, 8)}`,
    order_id: created.data.id,
    prefill,
  });

  const verifyResponse = await callRazorpayVerifyPayment({
    orderId: response.razorpay_order_id,
    paymentId: response.razorpay_payment_id,
    signature: response.razorpay_signature,
  });
  if (!verifyResponse.success) {
    throw new Error('Payment verification failed');
  }
}

export function toastInvoicePaymentError(error: unknown): void {
  if (isRazorpayCheckoutError(error) && error.kind === 'dismissed') {
    toast.info('Payment cancelled');
    return;
  }
  if (isRazorpayCheckoutError(error)) {
    toast.error(error.message);
    return;
  }
  const ax = error as {
    response?: { data?: { message?: string; detailedMessage?: string } };
    message?: string;
  };
  const apiMessage = ax.response?.data?.message || ax.response?.data?.detailedMessage;
  if (apiMessage) {
    toast.error(apiMessage);
    return;
  }
  if (error instanceof Error && error.message) {
    toast.error(error.message);
    return;
  }
  toast.error('Payment failed. Please try again.');
}
