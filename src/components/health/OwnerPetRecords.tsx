import { useCallback, useMemo, useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { FileText, Loader2, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InvoicePdfDialog } from '@/components/invoice/InvoicePdfDialog';
import { OwnerInvoice, fetchOwnerInvoicePdfUrl } from '@/services/invoiceService';

function money(inv: OwnerInvoice): string {
  const currency = inv.currency || 'INR';
  const amount = inv.amount == null ? '—' : Number(inv.amount).toLocaleString('en-IN');
  return `${currency} ${amount}`;
}

function when(inv: OwnerInvoice): string {
  const raw = inv.consultationDate || inv.createdAt;
  if (!raw) return '—';
  const d = parseISO(raw.length === 10 ? `${raw}T00:00:00` : raw);
  return isValid(d) ? format(d, 'MMM d, yyyy') : '—';
}

function paymentLabel(inv: OwnerInvoice): string {
  return (inv.paymentStatus || inv.status || 'Issued').replace(/_/g, ' ');
}

type Props = {
  petId: string;
  invoices: OwnerInvoice[];
  loading?: boolean;
};

export function OwnerPetRecords({ petId, invoices, loading }: Props) {
  const [pdfUuid, setPdfUuid] = useState<string | null>(null);
  const fetchUrl = useCallback(
    (invoiceUuid: string) => fetchOwnerInvoicePdfUrl(petId, invoiceUuid),
    [petId]
  );

  const withNotes = useMemo(
    () =>
      invoices.filter(
        (inv) =>
          (inv.doctorNotes && inv.doctorNotes.trim()) ||
          (inv.diagnosis && inv.diagnosis.trim()) ||
          (inv.nextVisitNotes && inv.nextVisitNotes.trim())
      ),
    [invoices]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No invoices yet. After the clinic collects payment, the bill and PDF appear here.
            </p>
          ) : (
            invoices.map((inv) => (
              <div
                key={inv.uuid}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {inv.invoiceNumber || 'Invoice'} · {money(inv)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {when(inv)}
                    {inv.clinicName ? ` · ${inv.clinicName}` : ''}
                    {inv.doctorName ? ` · Dr. ${inv.doctorName.replace(/^Dr\.?\s*/i, '')}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline">{paymentLabel(inv)}</Badge>
                  {inv.pdfAvailable ? (
                    <Button size="sm" variant="secondary" onClick={() => setPdfUuid(inv.uuid)}>
                      <FileText className="h-4 w-4 mr-1" />
                      View PDF
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">PDF pending</span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Doctor&apos;s notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {withNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Notes from completed consults will show here once the doctor finishes the visit.
            </p>
          ) : (
            withNotes.map((inv) => (
              <div key={`notes-${inv.uuid}`} className="space-y-2 p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">
                  {when(inv)}
                  {inv.doctorName ? ` · Dr. ${inv.doctorName.replace(/^Dr\.?\s*/i, '')}` : ''}
                </p>
                {inv.diagnosis?.trim() && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Diagnosis</p>
                    <p className="text-sm whitespace-pre-wrap">{inv.diagnosis}</p>
                  </div>
                )}
                {inv.doctorNotes?.trim() && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Doctor&apos;s notes</p>
                    <p className="text-sm whitespace-pre-wrap">{inv.doctorNotes}</p>
                  </div>
                )}
                {inv.nextVisitNotes?.trim() && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Next visit</p>
                    <p className="text-sm whitespace-pre-wrap">{inv.nextVisitNotes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <InvoicePdfDialog
        open={!!pdfUuid}
        invoiceUuid={pdfUuid}
        onOpenChange={(open) => {
          if (!open) setPdfUuid(null);
        }}
        fetchUrl={fetchUrl}
      />
    </div>
  );
}
