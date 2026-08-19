import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ConsultationInvoice } from '@/services/invoiceService';
import { formatInr } from '@/services/availabilityService';
import { recordedPaymentMode } from '@/utils/invoicePaymentState';

const MODES = [
  { value: 'UPI', label: 'UPI' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'NEFT', label: 'Bank transfer' },
  { value: 'OTHER', label: 'Other' },
] as const;

interface MarkInvoicePaidDialogProps {
  invoice: ConsultationInvoice | null;
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (paymentMode: string, transactionId?: string) => void;
}

export function MarkInvoicePaidDialog({
  invoice,
  open,
  busy,
  onOpenChange,
  onConfirm,
}: MarkInvoicePaidDialogProps) {
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (!open || !invoice) {
      return;
    }
    setPaymentMode(recordedPaymentMode(invoice.paymentMode));
    setTransactionId(invoice.transactionId || '');
  }, [open, invoice]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as paid</DialogTitle>
          <DialogDescription>
            Record cash, UPI, card, or bank payment. Invoice PDF updates with this mode and reference.
          </DialogDescription>
        </DialogHeader>
        {invoice && (
          <p className="text-sm text-muted-foreground">
            {invoice.invoiceNumber || invoice.uuid.slice(0, 8)} · {formatInr(Number(invoice.amount))}
          </p>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mark-paid-mode">Payment mode</Label>
            <Select value={paymentMode} onValueChange={setPaymentMode} disabled={busy}>
              <SelectTrigger id="mark-paid-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mark-paid-txn">Transaction / reference (optional)</Label>
            <Input
              id="mark-paid-txn"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="UPI ref, cheque no, last 4"
              disabled={busy}
              maxLength={120}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={busy || !invoice}
            onClick={() => onConfirm(paymentMode, transactionId.trim() || undefined)}
          >
            Mark as paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
