import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  adjustClinicInventoryStock,
  ClinicInventoryBatch,
  ClinicInventoryBatchRequest,
  ClinicInventoryItem,
  fetchClinicInventoryBatches,
  receiveClinicInventoryBatch,
  reviewClinicInventoryBatch,
} from '@/services/clinicService';

type Props = {
  clinicUuid: string;
  item: ClinicInventoryItem | null;
  open: boolean;
  canEdit: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
};

type BatchForm = {
  batchNumber: string;
  expiryDate: string;
  nonExpiring: boolean;
  quantity: number;
  unitCost: number;
  note: string;
};

const emptyForm: BatchForm = {
  batchNumber: '',
  expiryDate: '',
  nonExpiring: false,
  quantity: 1,
  unitCost: 0,
  note: '',
};

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function batchStatus(batch: ClinicInventoryBatch): string {
  if (batch.status) return batch.status;
  if (batch.reviewRequired || (!batch.expiryDate && !batch.nonExpiring)) return 'UNREVIEWED';
  if (batch.nonExpiring) return 'NON_EXPIRING';
  const today = localDateString(new Date());
  if (batch.expiryDate! < today) return 'EXPIRED';
  const expiry = new Date(`${batch.expiryDate}T00:00:00`);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000);
  return daysUntilExpiry <= 90 ? 'EXPIRING_SOON' : 'ELIGIBLE';
}

function statusLabel(status: string): string {
  switch (status) {
    case 'EXPIRED': return 'Expired';
    case 'EXPIRING_SOON': return 'Expires within 90 days';
    case 'UNREVIEWED': return 'Expiry review needed';
    case 'NON_EXPIRING': return 'Non-expiring';
    default: return 'In date';
  }
}

function statusStyle(status: string): string {
  if (status === 'EXPIRED' || status === 'UNREVIEWED') return 'border-red-300 bg-red-50 text-red-800';
  if (status === 'EXPIRING_SOON') return 'border-amber-300 bg-amber-50 text-amber-800';
  if (status === 'NON_EXPIRING') return 'border-slate-300 bg-slate-50 text-slate-700';
  return 'border-emerald-300 bg-emerald-50 text-emerald-800';
}

export default function InventoryBatchDialog({
  clinicUuid,
  item,
  open,
  canEdit,
  onOpenChange,
  onChanged,
}: Props) {
  const [batches, setBatches] = useState<ClinicInventoryBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BatchForm>(emptyForm);
  const [reviewBatch, setReviewBatch] = useState<ClinicInventoryBatch | null>(null);
  const [removeBatchUuid, setRemoveBatchUuid] = useState('');
  const [removeQuantity, setRemoveQuantity] = useState(1);
  const [removeNote, setRemoveNote] = useState('');

  const medication = item?.category?.toUpperCase() === 'MEDICATION';
  const needsExpiry = Boolean(medication);
  const unreviewed = useMemo(
    () => batches.filter((batch) => batchStatus(batch) === 'UNREVIEWED' && batch.quantityOnHand > 0),
    [batches],
  );
  const expiredQuantity = useMemo(
    () => batches.filter((batch) => batchStatus(batch) === 'EXPIRED').reduce((total, batch) => total + batch.quantityOnHand, 0),
    [batches],
  );
  const expiringSoonQuantity = useMemo(
    () => batches.filter((batch) => batchStatus(batch) === 'EXPIRING_SOON').reduce((total, batch) => total + batch.quantityOnHand, 0),
    [batches],
  );

  const loadBatches = useCallback(async () => {
    if (!item) return;
    setLoading(true);
    setError(null);
    try {
      const results = await fetchClinicInventoryBatches(clinicUuid, item.uuid);
      setBatches(results);
      setRemoveBatchUuid((current) => results.some((batch) => batch.uuid === current) ? current : '');
    } catch {
      setBatches([]);
      setError('Could not load inventory batches. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [clinicUuid, item]);

  useEffect(() => {
    if (!open || !item) return;
    setForm(emptyForm);
    setReviewBatch(null);
    setRemoveBatchUuid('');
    void loadBatches();
  }, [open, item, loadBatches]);

  const updateForm = (field: keyof BatchForm, value: string | number | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitBatch = async (event: FormEvent) => {
    event.preventDefault();
    if (!item) return;
    if (needsExpiry && !form.expiryDate) {
      toast.error('An expiry date is required for medication stock');
      return;
    }
    if (!form.expiryDate && !form.nonExpiring) {
      toast.error('Enter an expiry date or mark this stock as non-expiring');
      return;
    }
    setSaving(true);
    const payload: ClinicInventoryBatchRequest = {
      batchNumber: form.batchNumber.trim() || undefined,
      expiryDate: form.expiryDate || undefined,
      nonExpiring: form.nonExpiring,
      quantity: form.quantity,
      unitCost: form.unitCost,
      note: form.note.trim() || undefined,
    };
    try {
      if (reviewBatch) {
        await reviewClinicInventoryBatch(clinicUuid, item.uuid, reviewBatch.uuid, {
          batchNumber: payload.batchNumber,
          expiryDate: payload.expiryDate,
          nonExpiring: payload.nonExpiring,
          unitCost: payload.unitCost,
          note: payload.note,
        });
        toast.success('Legacy stock expiry reviewed');
      } else {
        await receiveClinicInventoryBatch(clinicUuid, item.uuid, payload);
        toast.success('Stock batch received');
      }
      setForm(emptyForm);
      setReviewBatch(null);
      await loadBatches();
      onChanged();
    } catch (requestError) {
      const message = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || (reviewBatch ? 'Could not review legacy stock' : 'Could not receive stock'));
    } finally {
      setSaving(false);
    }
  };

  const beginReview = (batch: ClinicInventoryBatch) => {
    setReviewBatch(batch);
    setForm({
      batchNumber: batch.batchNumber ?? '',
      expiryDate: batch.expiryDate ?? '',
      nonExpiring: batch.nonExpiring,
      quantity: batch.quantityOnHand,
      unitCost: batch.unitCost ?? 0,
      note: 'Expiry review',
    });
  };

  const submitRemoval = async (event: FormEvent) => {
    event.preventDefault();
    if (!item || !removeBatchUuid || removeQuantity < 1) return;
    const batch = batches.find((candidate) => candidate.uuid === removeBatchUuid);
    if (!batch || removeQuantity > batch.quantityOnHand) {
      toast.error('Removal quantity exceeds the selected batch balance');
      return;
    }
    setSaving(true);
    try {
      await adjustClinicInventoryStock(clinicUuid, item.uuid, {
        direction: 'REMOVE',
        quantity: removeQuantity,
        batchUuid: removeBatchUuid,
        note: removeNote.trim() || undefined,
      });
      toast.success('Stock removed from batch');
      setRemoveQuantity(1);
      setRemoveNote('');
      await loadBatches();
      onChanged();
    } catch (requestError) {
      const message = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Could not remove stock from this batch');
    } finally {
      setSaving(false);
    }
  };

  const cancelReview = () => {
    setReviewBatch(null);
    setForm(emptyForm);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage stock batches</DialogTitle>
          <DialogDescription>
            {item ? `${item.name} · ${item.quantity} ${item.unit} physical stock` : ''}
          </DialogDescription>
        </DialogHeader>

        {(expiredQuantity > 0 || expiringSoonQuantity > 0 || unreviewed.length > 0) ? (
          <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            <p className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4" />Expiry attention</p>
            {expiredQuantity > 0 ? <p>{expiredQuantity} {item?.unit} expired. This stock cannot be billed.</p> : null}
            {expiringSoonQuantity > 0 ? <p>{expiringSoonQuantity} {item?.unit} expires within 90 days.</p> : null}
            {unreviewed.length > 0 ? <p>{unreviewed.reduce((sum, batch) => sum + batch.quantityOnHand, 0)} {item?.unit} needs expiry review and is not billable.</p> : null}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            <p>{error}</p>
            <Button className="mt-2" size="sm" variant="outline" onClick={() => void loadBatches()}>Try again</Button>
          </div>
        ) : null}

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><CalendarClock className="h-4 w-4" />Batches</h3>
          {loading ? <p className="text-sm text-muted-foreground">Loading batches...</p> : null}
          {!loading && batches.length === 0 ? <p className="text-sm text-muted-foreground">No stock batches recorded.</p> : null}
          <div className="space-y-2">
            {batches.map((batch) => {
              const status = batchStatus(batch);
              return (
                <div key={batch.uuid} className="grid gap-2 rounded-md border p-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{batch.batchNumber || 'Unnumbered batch'}</span>
                      <Badge variant="outline" className={statusStyle(status)}>{statusLabel(status)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {batch.expiryDate ? `Expiry ${batch.expiryDate}` : batch.nonExpiring ? 'No expiry' : 'Expiry not reviewed'}
                      {' · '}On hand {batch.quantityOnHand} · Available {batch.availableQuantity ?? 0} · Reserved {batch.reserved ?? 0}
                      {' · '}Cost ₹{Number(batch.unitCost ?? 0).toFixed(2)}
                    </p>
                  </div>
                  {canEdit && status === 'UNREVIEWED' && batch.quantityOnHand > 0 ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => beginReview(batch)}>Review expiry</Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {canEdit && (
          <>
            <form onSubmit={submitBatch} className="space-y-3 rounded-md border p-4">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <PackagePlus className="h-4 w-4" />
                  {reviewBatch ? 'Review legacy stock' : 'Receive a batch'}
                </h3>
                {reviewBatch ? <p className="mt-1 text-xs text-muted-foreground">Assign expiry details to {reviewBatch.quantityOnHand} existing units; quantity will not change.</p> : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="batch-number">Batch number</Label>
                  <Input id="batch-number" value={form.batchNumber} onChange={(event) => updateForm('batchNumber', event.target.value)} maxLength={100} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="batch-expiry">Expiry date{needsExpiry ? ' (required)' : ''}</Label>
                  <Input id="batch-expiry" type="date" value={form.expiryDate} onChange={(event) => setForm((current) => ({ ...current, expiryDate: event.target.value, nonExpiring: false }))} required={needsExpiry || !form.nonExpiring} />
                </div>
                {!reviewBatch ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="batch-quantity">Quantity received</Label>
                    <Input id="batch-quantity" type="number" min="1" step="1" value={form.quantity} onChange={(event) => updateForm('quantity', Number(event.target.value))} required />
                  </div>
                ) : null}
                <div className="space-y-1.5">
                  <Label htmlFor="batch-unit-cost">Unit cost</Label>
                  <Input id="batch-unit-cost" type="number" min="0" step="0.01" value={form.unitCost} onChange={(event) => updateForm('unitCost', Number(event.target.value))} required />
                </div>
                {!reviewBatch ? (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="batch-note">Note</Label>
                    <Input id="batch-note" value={form.note} onChange={(event) => updateForm('note', event.target.value)} maxLength={200} />
                  </div>
                ) : null}
              </div>
              {!needsExpiry ? (
                <div className="flex items-center gap-2">
                  <Checkbox id="batch-non-expiring" checked={form.nonExpiring} onCheckedChange={(checked) => setForm((current) => ({ ...current, nonExpiring: checked === true, expiryDate: checked === true ? '' : current.expiryDate }))} />
                  <Label htmlFor="batch-non-expiring">This stock does not expire</Label>
                </div>
              ) : null}
              {reviewBatch ? (
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save review'}</Button>
                  <Button type="button" variant="outline" onClick={cancelReview}>Cancel review</Button>
                </div>
              ) : (
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Receive batch'}</Button>
              )}
            </form>

            <form onSubmit={submitRemoval} className="space-y-3 rounded-md border p-4">
              <div>
                <h3 className="text-sm font-semibold">Remove stock from a batch</h3>
                <p className="mt-1 text-xs text-muted-foreground">Select the batch being written off or removed. Expired and unreviewed batches may be removed, but cannot be billed.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="remove-batch">Batch</Label>
                  <select id="remove-batch" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={removeBatchUuid} onChange={(event) => setRemoveBatchUuid(event.target.value)} required>
                    <option value="">Select a batch</option>
                    {batches.filter((batch) => batch.quantityOnHand > 0).map((batch) => (
                      <option key={batch.uuid} value={batch.uuid}>
                        {batch.batchNumber || 'Unnumbered'} · {batchStatus(batch) === 'UNREVIEWED' ? 'Expiry review needed' : batchStatus(batch)} · {batch.quantityOnHand} {item?.unit}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="remove-quantity">Quantity</Label>
                  <Input id="remove-quantity" type="number" min="1" max={batches.find((batch) => batch.uuid === removeBatchUuid)?.quantityOnHand ?? undefined} step="1" value={removeQuantity} onChange={(event) => setRemoveQuantity(Number(event.target.value))} required />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="remove-note">Reason</Label>
                  <Input id="remove-note" value={removeNote} onChange={(event) => setRemoveNote(event.target.value)} maxLength={200} placeholder="Optional" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" variant="outline" disabled={saving || !removeBatchUuid}>{saving ? 'Saving...' : 'Remove stock'}</Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
