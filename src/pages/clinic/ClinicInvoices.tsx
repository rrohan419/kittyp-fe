import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { addDays, format, startOfDay } from 'date-fns';
import { FileSpreadsheet, Plus, Trash2, FileDown, ExternalLink, Send, Banknote, CheckCircle, ChevronDown } from 'lucide-react';
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
  InvoiceFromVisitState,
  TreatmentItemType,
  TreatmentLineItem,
  createClinicInvoice,
  fetchClinicInvoicePdfUrl,
  fetchClinicInvoices,
  generateClinicInvoicePdf,
  markClinicInvoicePaid,
  sendClinicInvoiceWhatsApp,
} from '@/services/invoiceService';
import { fetchClinicPetMedicalProfile, fetchClinicVisits } from '@/services/clinicService';
import { formatInr } from '@/services/availabilityService';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { collectInvoicePayment, isInvoiceUnpaid, toastInvoicePaymentError } from '@/utils/collectInvoicePayment';
import { MarkInvoicePaidDialog } from '@/components/invoice/MarkInvoicePaidDialog';

const emptyItem = (): TreatmentLineItem => ({
  itemType: 'CONSULTATION',
  description: 'Consultation',
  quantity: 1,
  unitPrice: 500,
});

const INITIAL_INVOICE_ROWS = 10;
const MORE_INVOICE_ROWS = 20;

type LocationState = { fromVisit?: InvoiceFromVisitState } | null;

export default function ClinicInvoices() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hydratedRef = useRef<string | null>(null);
  const { clinicUuid, clinic, loading: clinicLoading } = useActiveClinic();

  const [items, setItems] = useState<TreatmentLineItem[]>([emptyItem()]);
  const [petName, setPetName] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [petSpecies, setPetSpecies] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
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
  const [visibleCount, setVisibleCount] = useState(INITIAL_INVOICE_ROWS);
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const [busyUuid, setBusyUuid] = useState<string | null>(null);
  const [markPaidInvoice, setMarkPaidInvoice] = useState<ConsultationInvoice | null>(null);
  const [hydrating, setHydrating] = useState(false);
  const [linkClinicUuid, setLinkClinicUuid] = useState<string | undefined>();
  const [linkPetUuid, setLinkPetUuid] = useState<string | undefined>();
  const [linkVisitUuid, setLinkVisitUuid] = useState<string | undefined>();
  const [petWeight, setPetWeight] = useState('');
  const [fromVisitBanner, setFromVisitBanner] = useState(false);

  const applyFromVisit = (from: InvoiceFromVisitState) => {
    if (from.petName) setPetName(from.petName);
    if (from.petBreed) setPetBreed(from.petBreed);
    if (from.petSpecies) setPetSpecies(from.petSpecies);
    if (from.ownerName) setOwnerName(from.ownerName);
    if (from.ownerPhone) setOwnerPhone(from.ownerPhone);
    if (from.ownerEmail) setOwnerEmail(from.ownerEmail);
    if (from.reason) setReason(from.reason);
    if (from.diagnosis) setDiagnosis(from.diagnosis);
    if (from.doctorNotes) setDoctorNotes(from.doctorNotes);
    if (from.nextVisitNotes) setNextVisitNotes(from.nextVisitNotes);
    if (from.petWeight) setPetWeight(from.petWeight);
    if (from.clinicUuid) setLinkClinicUuid(from.clinicUuid);
    if (from.petUuid) setLinkPetUuid(from.petUuid);
    if (from.visitUuid) setLinkVisitUuid(from.visitUuid);
    setFromVisitBanner(true);
  };

  const enrichFromPetProfile = async (clinicUuid: string, petUuid: string) => {
    try {
      const profile = await fetchClinicPetMedicalProfile(clinicUuid, petUuid);
      const pet = profile?.pet;
      const owner = profile?.owner;
      if (pet?.name) setPetName((prev) => prev || pet.name);
      if (pet?.breed) setPetBreed((prev) => prev || pet.breed || '');
      if (pet?.species) setPetSpecies((prev) => prev || pet.species || '');
      if (pet?.weight) setPetWeight((prev) => prev || pet.weight || '');
      if (owner?.name) setOwnerName((prev) => prev || owner.name);
      if (owner?.phone) setOwnerPhone((prev) => prev || owner.phone || '');
      if (owner?.email) setOwnerEmail((prev) => prev || owner.email || '');
      if (pet?.ownerName) setOwnerName((prev) => prev || pet.ownerName);
      if (pet?.ownerPhone) setOwnerPhone((prev) => prev || pet.ownerPhone || '');
      if (pet?.ownerEmail) setOwnerEmail((prev) => prev || pet.ownerEmail || '');
    } catch {
      /* keep visit-provided fields */
    }
  };

  useEffect(() => {
    const state = location.state as LocationState;
    const visitQ = searchParams.get('visit') || undefined;
    const key = state?.fromVisit?.visitUuid || visitQ;
    if (!key || hydratedRef.current === key) return;
    hydratedRef.current = key;

    void (async () => {
      setHydrating(true);
      try {
        let from = state?.fromVisit;
        if (!from && visitQ && clinicUuid) {
          const today = startOfDay(new Date());
          const days = await Promise.all(
            [0, 1, 2, 3, 4, 5, 6].map((offset) =>
              fetchClinicVisits(clinicUuid, {
                date: format(addDays(today, -offset), 'yyyy-MM-dd'),
              }).catch(() => [])
            )
          );
          const visit = days.flat().find((v) => v.uuid === visitQ);
          if (visit) {
            from = {
              visitUuid: visit.uuid,
              clinicUuid: visit.clinicUuid || clinicUuid,
              petUuid: visit.petUuid,
              petName: visit.petName,
              ownerName: visit.ownerName || undefined,
              ownerPhone: visit.ownerPhone || undefined,
              ownerEmail: visit.ownerEmail || undefined,
              reason: visit.reasonForVisit || undefined,
              diagnosis: visit.chart?.assessment || undefined,
              doctorNotes: visit.chart?.plan || undefined,
              nextVisitNotes: visit.chart?.nextVisitNotes || undefined,
              petWeight: String(
                (visit.chart?.vitals as { weightKg?: number } | undefined)?.weightKg ?? ''
              ) || undefined,
            };
          } else {
            setLinkVisitUuid(visitQ);
            setLinkClinicUuid(clinicUuid);
          }
        }
        if (from) {
          applyFromVisit(from);
          if (from.clinicUuid && from.petUuid) {
            await enrichFromPetProfile(from.clinicUuid, from.petUuid);
          }
        }
        if (state?.fromVisit) {
          navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: {} });
        }
      } finally {
        setHydrating(false);
      }
    })();
  }, [location.state, location.pathname, location.search, navigate, searchParams, clinicUuid]);

  const load = async () => {
    if (!clinicUuid) {
      setInvoices([]);
      setVisibleCount(INITIAL_INVOICE_ROWS);
      return;
    }
    try {
      setInvoices(await fetchClinicInvoices(clinicUuid));
      setVisibleCount(INITIAL_INVOICE_ROWS);
    } catch {
      setInvoices([]);
      setVisibleCount(INITIAL_INVOICE_ROWS);
    }
  };

  useEffect(() => {
    void load();
  }, [clinicUuid]);

  const orderedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });
  }, [invoices]);
  const visibleInvoices = orderedInvoices.slice(0, visibleCount);
  const hiddenCount = Math.max(0, orderedInvoices.length - visibleCount);

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

  const resetForm = () => {
    setItems([emptyItem()]);
    setPetName('');
    setPetBreed('');
    setPetSpecies('');
    setOwnerName('');
    setOwnerPhone('');
    setOwnerEmail('');
    setReason('');
    setDiagnosis('');
    setDoctorNotes('');
    setNextVisitNotes('');
    setDiscount('0');
    setCgst('0');
    setSgst('0');
    setPaidAmount('0');
    setPetWeight('');
    setLinkClinicUuid(undefined);
    setLinkPetUuid(undefined);
    setLinkVisitUuid(undefined);
    setFromVisitBanner(false);
    hydratedRef.current = null;
  };

  const createDraft = async (e: React.FormEvent, withWhatsApp: boolean) => {
    e.preventDefault();
    if (loading || submittingRef.current) return;
    if (!petName.trim()) {
      toast.error('Pet name is required');
      return;
    }
    if (withWhatsApp && !ownerPhone.trim()) {
      toast.error('Owner phone is required to send on WhatsApp');
      return;
    }
    if (!items.length || items.some((i) => !i.description.trim())) {
      toast.error('Add at least one line item with a description');
      return;
    }
    if (!clinicUuid) {
      toast.error('Select a clinic first');
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    try {
      const result = await createClinicInvoice(clinicUuid, {
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
        clinicUuid,
        petUuid: linkPetUuid,
        visitUuid: linkVisitUuid,
        petName: petName.trim(),
        petBreed: petBreed.trim() || undefined,
        petSpecies: petSpecies.trim() || undefined,
        petWeight: petWeight.trim() || undefined,
        ownerName: ownerName.trim() || undefined,
        ownerPhone: ownerPhone.trim() || undefined,
        ownerEmail: ownerEmail.trim() || undefined,
        reason: reason.trim() || undefined,
        diagnosis: diagnosis.trim() || undefined,
        doctorNotes: doctorNotes.trim() || undefined,
        nextVisitNotes: nextVisitNotes.trim() || undefined,
        paymentMode,
        paymentStatus: paidNum <= 0 ? 'UNPAID' : balance <= 0 ? 'PAID' : 'PARTIAL',
        generatePdf: withWhatsApp,
        sendWhatsApp: withWhatsApp,
      });
      const created = result.invoice;
      if (withWhatsApp && result.whatsappSent) {
        toast.success(`Invoice ${created.invoiceNumber || ''} sent on WhatsApp`);
      } else if (withWhatsApp) {
        toast.warning(
          `Invoice ${created.invoiceNumber || ''} saved. ${
            result.whatsappError || 'WhatsApp is not configured — use Send on the invoice row when ready.'
          }`
        );
      } else {
        toast.success('Draft invoice created');
      }
      resetForm();
      await load();
    } catch (err: unknown) {
      const ax = err as {
        response?: { data?: { message?: string; detailMessage?: string; detailedMessage?: string } };
        message?: string;
      };
      const msg =
        ax.response?.data?.message ||
        ax.response?.data?.detailedMessage ||
        ax.response?.data?.detailMessage ||
        ax.message ||
        'Failed to create invoice';
      toast.error(msg);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const onGeneratePdf = async (uuid: string) => {
    if (!clinicUuid) return;
    setBusyUuid(uuid);
    try {
      await generateClinicInvoicePdf(clinicUuid, uuid);
      const url = await fetchClinicInvoicePdfUrl(clinicUuid, uuid);
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
    if (!clinicUuid) return;
    setBusyUuid(uuid);
    try {
      const url = await fetchClinicInvoicePdfUrl(clinicUuid, uuid);
      window.open(url, '_blank');
    } catch {
      toast.error('PDF not available yet — generate it first');
    } finally {
      setBusyUuid(null);
    }
  };

  const onSendWhatsApp = async (uuid: string) => {
    if (!clinicUuid) return;
    setBusyUuid(uuid);
    try {
      const sent = await sendClinicInvoiceWhatsApp(clinicUuid, uuid);
      toast.success(`Invoice ${sent.invoiceNumber || ''} sent on WhatsApp`);
      await load();
    } catch (err: unknown) {
      const ax = err as {
        response?: { data?: { message?: string; detailedMessage?: string } };
        message?: string;
      };
      toast.error(
        ax.response?.data?.message ||
          ax.response?.data?.detailedMessage ||
          ax.message ||
          'Failed to send on WhatsApp'
      );
    } finally {
      setBusyUuid(null);
    }
  };

  const onCollectPayment = async (inv: ConsultationInvoice) => {
    setBusyUuid(inv.uuid);
    try {
      await collectInvoicePayment(inv);
      toast.success('Payment collected');
      await load();
    } catch (error) {
      toastInvoicePaymentError(error);
    } finally {
      setBusyUuid(null);
    }
  };

  const onMarkPaid = async (paymentMode: string, transactionId?: string) => {
    if (!markPaidInvoice || !clinicUuid) {
      return;
    }
    setBusyUuid(markPaidInvoice.uuid);
    try {
      await markClinicInvoicePaid(clinicUuid, markPaidInvoice.uuid, { paymentMode, transactionId });
      toast.success('Marked as paid. PDF updated.');
      setMarkPaidInvoice(null);
      await load();
    } catch (error) {
      toastInvoicePaymentError(error);
    } finally {
      setBusyUuid(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clinic invoices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {clinic?.name ? `${clinic.name} · ` : ''}
          Create invoices for clinic visits and send on the clinic WhatsApp number.
        </p>
      </div>

      {(fromVisitBanner || hydrating) && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          {hydrating
            ? 'Loading patient details from the visit…'
            : 'Patient details prefilled from the visit. Add line items, then Save and Send on WhatsApp.'}
        </div>
      )}

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
                <Label>Species</Label>
                <Input value={petSpecies} onChange={(e) => setPetSpecies(e.target.value)} placeholder="Dog" />
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input value={petWeight} onChange={(e) => setPetWeight(e.target.value)} placeholder="12" />
              </div>
              <div className="space-y-2">
                <Label>Owner name</Label>
                <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Owner phone</Label>
                <Input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Owner email</Label>
                <Input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                />
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
              <Button type="submit" disabled={loading || hydrating} variant="outline">
                {loading ? 'Saving…' : 'Save draft'}
              </Button>
              <Button
                type="button"
                disabled={loading || hydrating}
                onClick={(e) => void createDraft(e, true)}
              >
                <Send className="h-4 w-4 mr-1.5" />
                {loading ? 'Sending…' : 'Save and Send'}
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
          {!orderedInvoices.length ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <>
            {visibleInvoices.map((inv) => (
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
                  {isInvoiceUnpaid(inv) && (
                    <>
                      <Button
                        size="sm"
                        disabled={busyUuid === inv.uuid}
                        onClick={() => void onCollectPayment(inv)}
                      >
                        <Banknote className="h-3.5 w-3.5 mr-1" /> Collect payment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyUuid === inv.uuid}
                        onClick={() => setMarkPaidInvoice(inv)}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Mark as paid
                      </Button>
                    </>
                  )}
                  {inv.pdfUrl ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyUuid === inv.uuid}
                        onClick={() => void onViewPdf(inv.uuid)}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" /> PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyUuid === inv.uuid}
                        onClick={() => void onSendWhatsApp(inv.uuid)}
                      >
                        <Send className="h-3.5 w-3.5 mr-1" /> WhatsApp
                      </Button>
                    </>
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
            ))}
            {hiddenCount > 0 && (
              <div className="flex justify-center pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setVisibleCount((n) => n + MORE_INVOICE_ROWS)}
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show {Math.min(MORE_INVOICE_ROWS, hiddenCount)} more
                </Button>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>
      <MarkInvoicePaidDialog
        invoice={markPaidInvoice}
        open={Boolean(markPaidInvoice)}
        busy={Boolean(markPaidInvoice && busyUuid === markPaidInvoice.uuid)}
        onOpenChange={(open) => {
          if (!open) {
            setMarkPaidInvoice(null);
          }
        }}
        onConfirm={(mode, txn) => void onMarkPaid(mode, txn)}
      />
    </div>
  );
}
