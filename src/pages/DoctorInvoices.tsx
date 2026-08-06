import { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, Plus, Trash2, FileDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ConsultationInvoice,
  ITEM_TYPE_OPTIONS,
  TreatmentItemType,
  TreatmentLineItem,
  createConsultationInvoice,
  fetchInvoicePdfUrl,
  fetchMyInvoices,
  generateInvoicePdf,
} from '@/services/invoiceService';
import { formatInr } from '@/services/availabilityService';

const emptyItem = (): TreatmentLineItem => ({
  itemType: 'CONSULTATION',
  description: 'Consultation',
  quantity: 1,
  unitPrice: 500,
});

export default function DoctorInvoices() {
  const [items, setItems] = useState<TreatmentLineItem[]>([emptyItem()]);
  const [petName, setPetName] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [reason, setReason] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [nextVisitNotes, setNextVisitNotes] = useState('');
  const [discount, setDiscount] = useState('0');
  const [cgst, setCgst] = useState('0');
  const [sgst, setSgst] = useState('0');
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [invoices, setInvoices] = useState<ConsultationInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyUuid, setBusyUuid] = useState<string | null>(null);

  const load = async () => {
    try {
      setInvoices(await fetchMyInvoices());
    } catch {
      setInvoices([]);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0),
    [items]
  );
  const discountNum = Number(discount) || 0;
  const cgstNum = Number(cgst) || 0;
  const sgstNum = Number(sgst) || 0;
  const tax = cgstNum + sgstNum;
  const grandTotal = Math.max(0, subtotal - discountNum + tax);
  const paidNum = Number(paidAmount) || 0;
  const balance = Math.max(0, grandTotal - paidNum);

  const updateItem = (index: number, patch: Partial<TreatmentLineItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const createDraft = async (e: React.FormEvent, withPdf: boolean) => {
    e.preventDefault();
    if (!petName.trim()) {
      toast.error('Pet name is required');
      return;
    }
    if (!items.length || items.some((i) => !i.description.trim())) {
      toast.error('Add at least one line item with a description');
      return;
    }
    setLoading(true);
    try {
      const created = await createConsultationInvoice({
        items: items.map((item) => ({
          ...item,
          total: Number(item.quantity) * Number(item.unitPrice),
        })),
        amount: grandTotal,
        subtotal,
        discount: discountNum,
        tax,
        cgst: cgstNum,
        sgst: sgstNum,
        paidAmount: paidNum,
        currency: 'INR',
        petName: petName.trim(),
        petBreed: petBreed.trim() || undefined,
        ownerName: ownerName.trim() || undefined,
        ownerPhone: ownerPhone.trim() || undefined,
        reason: reason.trim() || undefined,
        diagnosis: diagnosis.trim() || undefined,
        doctorNotes: doctorNotes.trim() || undefined,
        nextVisitNotes: nextVisitNotes.trim() || undefined,
        paymentMode,
        paymentStatus: paidNum <= 0 ? 'UNPAID' : balance <= 0 ? 'PAID' : 'PARTIAL',
        generatePdf: withPdf,
      });
      toast.success(withPdf ? `Invoice ${created.invoiceNumber || ''} PDF generated` : 'Draft invoice created');
      setItems([emptyItem()]);
      setPetName('');
      setPetBreed('');
      setOwnerName('');
      setOwnerPhone('');
      setReason('');
      setDiagnosis('');
      setDoctorNotes('');
      setNextVisitNotes('');
      setDiscount('0');
      setCgst('0');
      setSgst('0');
      setPaidAmount('0');
      await load();
      if (withPdf && created.uuid) {
        try {
          const url = await fetchInvoicePdfUrl(created.uuid);
          window.open(url, '_blank');
        } catch {
          /* listed below; PDF may still be generating */
        }
      }
    } catch {
      toast.error('Failed to create invoice — ensure you are logged in as a doctor');
    } finally {
      setLoading(false);
    }
  };

  const onGeneratePdf = async (uuid: string) => {
    setBusyUuid(uuid);
    try {
      await generateInvoicePdf(uuid);
      const url = await fetchInvoicePdfUrl(uuid);
      window.open(url, '_blank');
      toast.success('PDF ready');
      await load();
    } catch {
      toast.error('Could not generate PDF');
    } finally {
      setBusyUuid(null);
    }
  };

  const onViewPdf = async (uuid: string) => {
    setBusyUuid(uuid);
    try {
      const url = await fetchInvoicePdfUrl(uuid);
      window.open(url, '_blank');
    } catch {
      toast.error('PDF not available yet — generate it first');
    } finally {
      setBusyUuid(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Treatment Invoices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tax / medical invoices in INR — generated with Thymeleaf PDF like product invoices.
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Create treatment invoice
          </CardTitle>
          <CardDescription>
            Capture services, medicines, and visit details. Billing staff can generate the PDF after.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={(e) => void createDraft(e, false)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pet name *</Label>
                <Input value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="Bruno" />
              </div>
              <div className="space-y-2">
                <Label>Breed</Label>
                <Input value={petBreed} onChange={(e) => setPetBreed(e.target.value)} placeholder="Golden Retriever" />
              </div>
              <div className="space-y-2">
                <Label>Owner name</Label>
                <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Owner phone</Label>
                <Input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Vomiting" />
              </div>
              <div className="space-y-2">
                <Label>Diagnosis</Label>
                <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Acute Gastritis" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Line items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setItems((prev) => [...prev, emptyItem()])}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add item
                </Button>
              </div>
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-lg border border-border"
                >
                  <div className="sm:col-span-3">
                    <Select
                      value={item.itemType}
                      onValueChange={(v) => updateItem(index, { itemType: v as TreatmentItemType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEM_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-4">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, { description: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Rate ₹"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-center justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={items.length === 1}
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label>Discount (₹)</Label>
                <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CGST (₹)</Label>
                <Input type="number" value={cgst} onChange={(e) => setCgst(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>SGST (₹)</Label>
                <Input type="number" value={sgst} onChange={(e) => setSgst(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Paid (₹)</Label>
                <Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['UPI', 'Cash', 'Card', 'NEFT', 'Other'].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatInr(subtotal)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>{formatInr(tax)}</span></div>
                <div className="flex justify-between font-semibold"><span>Grand total</span><span>{formatInr(grandTotal)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Balance</span><span>{formatInr(balance)}</span></div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Doctor notes</Label>
              <Textarea
                rows={2}
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Feed soft food. Review after 5 days…"
              />
            </div>
            <div className="space-y-2">
              <Label>Next visit</Label>
              <Textarea
                rows={2}
                value={nextVisitNotes}
                onChange={(e) => setNextVisitNotes(e.target.value)}
                placeholder="Review — 11 Aug&#10;Vaccination — 12 Sept"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading} variant="outline">
                {loading ? 'Saving…' : 'Save draft'}
              </Button>
              <Button type="button" disabled={loading} onClick={(e) => void createDraft(e, true)}>
                <FileDown className="h-4 w-4 mr-1.5" />
                {loading ? 'Generating…' : 'Save & generate PDF'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Recent invoices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!invoices.length ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            invoices.map((inv) => (
              <div
                key={inv.uuid}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {inv.invoiceNumber || inv.uuid.slice(0, 8)}
                    {inv.notes ? ` · ${inv.notes}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatInr(Number(inv.amount))} · {inv.paymentStatus || inv.status}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary">{inv.status}</Badge>
                  {inv.pdfUrl ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyUuid === inv.uuid}
                      onClick={() => void onViewPdf(inv.uuid)}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> PDF
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={busyUuid === inv.uuid}
                      onClick={() => void onGeneratePdf(inv.uuid)}
                    >
                      <FileDown className="h-3.5 w-3.5 mr-1" /> Generate PDF
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
