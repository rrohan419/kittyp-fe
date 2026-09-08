import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import { Loader2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OwnerInvoice, fetchMyParentInvoices, fetchOwnerInvoicePdfUrl } from '@/services/invoiceService';
import {
  collectInvoicePayment,
  isInvoiceUnpaid,
  toastInvoicePaymentError,
} from '@/utils/collectInvoicePayment';

export default function ParentBillingPage() {
  const [items, setItems] = useState<OwnerInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingUuid, setPayingUuid] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchMyParentInvoices());
    } catch {
      setItems([]);
      toast.error('Could not load invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unpaid = useMemo(() => items.filter((i) => isInvoiceUnpaid(i)), [items]);
  const paid = useMemo(() => items.filter((i) => !isInvoiceUnpaid(i)), [items]);

  const pay = async (invoice: OwnerInvoice) => {
    setPayingUuid(invoice.uuid);
    try {
      await collectInvoicePayment(invoice as Parameters<typeof collectInvoicePayment>[0]);
      toast.success('Payment recorded');
      await load();
    } catch (err) {
      toastInvoicePaymentError(err);
    } finally {
      setPayingUuid(null);
    }
  };

  const openPdf = async (invoice: OwnerInvoice) => {
    if (!invoice.petUuid) {
      toast.error('Pet missing on invoice');
      return;
    }
    try {
      const url = await fetchOwnerInvoicePdfUrl(invoice.petUuid, invoice.uuid);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('PDF not available');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading billing…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" />
          Billing
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unpaid clinic invoices and payment history. Test Mode Razorpay — do not complete live charges in QA.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Unpaid ({unpaid.length})</h2>
        {unpaid.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No unpaid invoices.
            </CardContent>
          </Card>
        ) : (
          unpaid.map((inv) => <InvoiceRow key={inv.uuid} invoice={inv} paying={payingUuid === inv.uuid} onPay={pay} onPdf={openPdf} />)
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Paid / other ({paid.length})</h2>
        {paid.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No paid invoices yet. Book a visit from{' '}
              <Link className="underline" to="/app/book">
                appointments
              </Link>
              .
            </CardContent>
          </Card>
        ) : (
          paid.map((inv) => <InvoiceRow key={inv.uuid} invoice={inv} onPdf={openPdf} />)
        )}
      </section>
    </div>
  );
}

function InvoiceRow({
  invoice,
  paying,
  onPay,
  onPdf,
}: {
  invoice: OwnerInvoice;
  paying?: boolean;
  onPay?: (invoice: OwnerInvoice) => void;
  onPdf: (invoice: OwnerInvoice) => void;
}) {
  const created = invoice.createdAt ? parseISO(invoice.createdAt) : null;
  const unpaid = isInvoiceUnpaid(invoice);
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-base truncate">
            {invoice.invoiceNumber || invoice.uuid.slice(0, 8)}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {[invoice.clinicName, invoice.doctorName, invoice.reason].filter(Boolean).join(' · ') || 'Consultation'}
          </p>
        </div>
        <Badge variant={unpaid ? 'destructive' : 'secondary'}>
          {invoice.paymentStatus || invoice.status || (unpaid ? 'UNPAID' : 'PAID')}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <span className="font-semibold">
            {invoice.currency || 'INR'} {Number(invoice.amount ?? 0).toFixed(2)}
          </span>
          {created && isValid(created) ? (
            <span className="text-xs text-muted-foreground ml-2">{format(created, 'd MMM yyyy')}</span>
          ) : null}
        </div>
        <div className="flex gap-2">
          {invoice.pdfAvailable ? (
            <Button size="sm" variant="outline" onClick={() => onPdf(invoice)}>
              PDF
            </Button>
          ) : null}
          {unpaid && onPay ? (
            <Button size="sm" disabled={paying} onClick={() => onPay(invoice)}>
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pay with Razorpay'}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
