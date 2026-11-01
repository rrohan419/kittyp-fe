import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { addDays, format, startOfDay } from 'date-fns';
import { FileSpreadsheet, FileDown, ExternalLink, Send, Banknote, CheckCircle, Pencil } from 'lucide-react';
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
  InvoiceFromVisitState,
  TreatmentLineItem,
  createConsultationInvoice,
  draftFormFromInvoice,
  fetchInvoicePdfUrl,
  fetchMyInvoices,
  generateInvoicePdf,
  markInvoicePaid,
  sendInvoiceWhatsApp,
  updateConsultationInvoice,
  fetchDoctorWhatsAppSettings,
} from '@/services/invoiceService';
import { fetchClinicPetMedicalProfile } from '@/services/clinicService';
import { fetchMyDoctorVisits } from '@/services/visitService';
import { formatInr } from '@/services/availabilityService';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { collectInvoicePayment, isInvoiceUnpaid, SHOW_COLLECT_PAYMENT, toastInvoicePaymentError } from '@/utils/collectInvoicePayment';
import { formatPetWeight } from '@/utils/formatPetWeight';
import { InvoiceLineEditor, apiErrorMessage, prepareInventoryLines, useInventoryCatalog } from '@/components/invoice/InvoiceLineEditor';
import { MarkInvoicePaidDialog } from '@/components/invoice/MarkInvoicePaidDialog';
import { WhatsAppSendGate } from '@/components/invoice/WhatsAppSendGate';
import { InvoicePdfDialog } from '@/components/invoice/InvoicePdfDialog';
import { ListPager } from '@/components/ui/ListPager';

const emptyItem = (): TreatmentLineItem => ({
  itemType: 'CONSULTATION',
  description: 'Consultation',
  quantity: 1,
  unitPrice: 500,
});

const INVOICE_PAGE_SIZE = 10;

type LocationState = { fromVisit?: InvoiceFromVisitState } | null;

export default function DoctorInvoices() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hydratedRef = useRef<string | null>(null);
  const { clinic, clinicUuid, isPersonalPractice, loading: clinicLoading } = useActiveClinic();

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
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [invoicePages, setInvoicePages] = useState(0);
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const [busyUuid, setBusyUuid] = useState<string | null>(null);
  const [previewInvoiceUuid, setPreviewInvoiceUuid] = useState<string | null>(null);
  const fetchPreviewUrl = useCallback((uuid: string) => fetchInvoicePdfUrl(uuid), []);
  const [doctorWaConfigured, setDoctorWaConfigured] = useState<boolean | null>(null);
  const [markPaidInvoice, setMarkPaidInvoice] = useState<ConsultationInvoice | null>(null);
  const [hydrating, setHydrating] = useState(false);
  const [linkClinicUuid, setLinkClinicUuid] = useState<string | undefined>();
  const billingClinicUuid = linkClinicUuid || clinicUuid;
  const catalog = useInventoryCatalog(billingClinicUuid);
  const [linkPetUuid, setLinkPetUuid] = useState<string | undefined>();
  const [linkVisitUuid, setLinkVisitUuid] = useState<string | undefined>();
  const [petWeight, setPetWeight] = useState('');
  const [fromVisitBanner, setFromVisitBanner] = useState(false);
  const [editingInvoiceUuid, setEditingInvoiceUuid] = useState<string | null>(null);
  const [editingInvoiceNumber, setEditingInvoiceNumber] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

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
    if (from.petWeight) setPetWeight(formatPetWeight(from.petWeight));
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
      if (pet?.weight) setPetWeight((prev) => prev || formatPetWeight(pet.weight));
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
    if (!isPersonalPractice) return;
    let cancelled = false;
    setDoctorWaConfigured(null);
    void fetchDoctorWhatsAppSettings()
      .then((wa) => {
        if (!cancelled) setDoctorWaConfigured(!!wa.whatsappConfigured);
      })
      .catch(() => {
        if (!cancelled) setDoctorWaConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isPersonalPractice]);

  const whatsappConfigureTo = isPersonalPractice ? '/doctor/whatsapp' : undefined;
  const whatsappChecking = isPersonalPractice ? doctorWaConfigured === null : clinicLoading;
  const whatsappBlocked = isPersonalPractice ? doctorWaConfigured !== true : clinic?.whatsappConfigured !== true;

  useEffect(() => {
    const state = location.state as LocationState;
    const invoiceQ = searchParams.get('invoice');
    const visitQ = searchParams.get('visit') || undefined;
    if (invoiceQ) return;
    const key = state?.fromVisit?.visitUuid || visitQ;
    if (!key || hydratedRef.current === key) return;
    hydratedRef.current = key;

    void (async () => {
      setHydrating(true);
      try {
        let from = state?.fromVisit;
        if (!from && visitQ) {
          const today = startOfDay(new Date());
          const fromDate = format(addDays(today, -7), 'yyyy-MM-dd');
          const toDate = format(today, 'yyyy-MM-dd');
          const mine = await fetchMyDoctorVisits({ from: fromDate, to: toDate }).catch(() => []);
          const visit = mine.find((v) => v.uuid === visitQ);
          if (visit) {
            from = {
              visitUuid: visit.uuid,
              clinicUuid: visit.clinicUuid,
              petUuid: visit.petUuid,
              petName: visit.petName,
              ownerName: visit.ownerName || undefined,
              ownerPhone: visit.ownerPhone || undefined,
              ownerEmail: visit.ownerEmail || undefined,
              reason: visit.reasonForVisit || undefined,
              diagnosis: visit.chart?.assessment || undefined,
              doctorNotes: visit.chart?.plan || undefined,
              nextVisitNotes: visit.chart?.nextVisitNotes || undefined,
              petWeight: formatPetWeight(
                (visit.chart?.vitals as { weightKg?: number } | undefined)?.weightKg
              ) || undefined,
            };
          } else {
            setLinkVisitUuid(visitQ);
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
  }, [location.state, location.pathname, location.search, navigate, searchParams]);

  const load = async (page = invoicePage) => {
    if (clinicLoading) return;
    try {
      const result = await fetchMyInvoices(clinicUuid ?? undefined, page, INVOICE_PAGE_SIZE);
      setInvoices(result.models ?? []);
      setInvoiceTotal(result.totalElements ?? 0);
      setInvoicePages(result.totalPages ?? 0);
      setInvoicePage(result.pageNumber ?? page);
    } catch {
      setInvoices([]);
      setInvoiceTotal(0);
      setInvoicePages(0);
    }
  };

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicLoading, clinicUuid]);

  useEffect(() => {
    const invoiceQ = searchParams.get('invoice');
    if (!invoiceQ || hydratedRef.current === `invoice:${invoiceQ}`) return;
    if (clinicLoading) return;
    hydratedRef.current = `invoice:${invoiceQ}`;
    setPreviewInvoiceUuid(invoiceQ);
  }, [searchParams, clinicLoading]);

  const orderedInvoices = invoices;

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
    setEditingInvoiceUuid(null);
    setEditingInvoiceNumber(null);
    hydratedRef.current = null;
  };

  const beginEdit = (inv: ConsultationInvoice) => {
    const draft = draftFormFromInvoice(inv);
    setItems(draft.items.length ? draft.items : [emptyItem()]);
    setPetName(draft.petName);
    setPetBreed(draft.petBreed);
    setPetSpecies(draft.petSpecies);
    setPetWeight(draft.petWeight);
    setOwnerName(draft.ownerName);
    setOwnerPhone(draft.ownerPhone);
    setOwnerEmail(draft.ownerEmail);
    setReason(draft.reason);
    setDiagnosis(draft.diagnosis);
    setDoctorNotes(draft.doctorNotes);
    setNextVisitNotes(draft.nextVisitNotes);
    setDiscount(draft.discount);
    setCgst(draft.cgst);
    setSgst(draft.sgst);
    setPaidAmount(draft.paidAmount);
    setPaymentMode(draft.paymentMode);
    setLinkPetUuid(draft.petUuid);
    setLinkVisitUuid(draft.visitUuid);
    setFromVisitBanner(false);
    setEditingInvoiceUuid(inv.uuid);
    setEditingInvoiceNumber(inv.invoiceNumber || null);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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
    const prepared = prepareInventoryLines(items, catalog.items, billingClinicUuid);
    if (!prepared) return;
    await submitDraft(prepared, withWhatsApp);
  };

  const submitDraft = async (billedItems: TreatmentLineItem[], withWhatsApp: boolean) => {
    submittingRef.current = true;
    setLoading(true);
    try {
      const payload = {
        items: billedItems.map((item) => ({
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
        clinicUuid: linkClinicUuid || clinicUuid || undefined,
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
      };
      if (editingInvoiceUuid) {
        const updated = await updateConsultationInvoice(editingInvoiceUuid, payload);
        if (withWhatsApp) {
          try {
            await sendInvoiceWhatsApp(updated.uuid);
            toast.success(`Invoice ${updated.invoiceNumber || ''} sent on WhatsApp`);
          } catch (sendErr: unknown) {
            toast.warning(
              `Invoice ${updated.invoiceNumber || ''} updated. ${apiErrorMessage(sendErr, 'WhatsApp could not be sent.')}`
            );
          }
        } else {
          toast.success('Draft invoice updated');
        }
      } else {
        const result = await createConsultationInvoice(payload);
        const created = result.invoice;
        if (withWhatsApp && result.whatsappSent) {
          toast.success(`Invoice ${created.invoiceNumber || ''} sent on WhatsApp`);
        } else if (withWhatsApp) {
          toast.warning(
            `Invoice ${created.invoiceNumber || ''} saved. ${
              result.whatsappError || 'WhatsApp is not configured — use the WhatsApp button on the invoice row when ready.'
            }`
          );
        } else {
          toast.success('Draft invoice created');
        }
      }
      resetForm();
      catalog.reload();
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
        (withWhatsApp
          ? 'Failed to create invoice'
          : 'Failed to create invoice — ensure you are logged in as a doctor');
      toast.error(msg);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const onGeneratePdf = async (uuid: string) => {
    setBusyUuid(uuid);
    try {
      await generateInvoicePdf(uuid);
      toast.success('PDF ready');
      catalog.reload();
      await load();
      setPreviewInvoiceUuid(uuid);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not generate PDF'));
    } finally {
      setBusyUuid(null);
    }
  };

  const onViewPdf = (uuid: string) => {
    setPreviewInvoiceUuid(uuid);
  };

  const onSendWhatsApp = async (uuid: string) => {
    setBusyUuid(uuid);
    try {
      const sent = await sendInvoiceWhatsApp(uuid);
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
    if (!markPaidInvoice) {
      return;
    }
    setBusyUuid(markPaidInvoice.uuid);
    try {
      await markInvoicePaid(markPaidInvoice.uuid, { paymentMode, transactionId });
      toast.success('Marked as paid. PDF updated.');
      setMarkPaidInvoice(null);
      catalog.reload();
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
        <h1 className="text-2xl font-bold">Treatment Invoices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isPersonalPractice
            ? 'Personal practice invoices. Prefill from a finished visit, then Save and send WhatsApp to deliver the PDF. The invoice email goes out when it is paid.'
            : `Invoices for ${clinic?.name || 'this clinic'} — only visits you billed here. Switch clinics to see another branch.`}
        </p>
      </div>

      {(fromVisitBanner || hydrating) && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          {hydrating
            ? 'Loading patient details from the visit…'
            : 'Patient details prefilled from the visit. Add line items, then Save and send WhatsApp. The invoice email goes out when it is paid.'}
        </div>
      )}

      <Card ref={formRef} className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />{' '}
            {editingInvoiceUuid
              ? `Edit draft ${editingInvoiceNumber || ''}`.trim()
              : 'Create treatment invoice'}
          </CardTitle>
          <CardDescription>
            {editingInvoiceUuid
              ? 'Update this draft. The invoice number stays the same.'
              : 'Capture services, medicines, and visit details. Billing staff can generate the PDF after.'}
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

            <InvoiceLineEditor
              items={items}
              clinicUuid={billingClinicUuid}
              catalog={catalog.items}
              catalogLoading={catalog.loading}
              catalogError={catalog.error}
              onRetryCatalog={() => void catalog.reload()}
              onChange={setItems}
            />

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
                {loading ? 'Saving…' : editingInvoiceUuid ? 'Update draft' : 'Save draft'}
              </Button>
              <WhatsAppSendGate
                blocked={whatsappBlocked}
                checking={whatsappChecking}
                configureTo={whatsappConfigureTo}
              >
                <Button
                  type="button"
                  disabled={loading || hydrating || whatsappBlocked}
                  onClick={(e) => void createDraft(e, true)}
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  {loading ? 'Sending…' : editingInvoiceUuid ? 'Update and send WhatsApp' : 'Save and send WhatsApp'}
                </Button>
              </WhatsAppSendGate>
              {editingInvoiceUuid ? (
                <Button type="button" variant="ghost" disabled={loading} onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">
            Previous invoices
            {invoiceTotal ? (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {invoiceTotal} {invoiceTotal === 1 ? 'invoice' : 'invoices'}
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!orderedInvoices.length ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <>
            {orderedInvoices.map((inv) => (
              <div
                key={inv.uuid}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium flex items-center gap-2 min-w-0">
                    <span className="truncate">
                      {inv.invoiceNumber || inv.uuid.slice(0, 8)}
                      {inv.notes ? ` · ${inv.notes}` : ''}
                    </span>
                    {inv.status !== 'ISSUED' ? (
                      <Badge variant="secondary" className="shrink-0">
                        {inv.status}
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatInr(Number(inv.amount))} ·{' '}
                    {inv.paymentStatus || (inv.status === 'ISSUED' ? 'UNPAID' : inv.status)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {inv.status === 'DRAFT' ? (
                    <Button size="sm" variant="outline" onClick={() => beginEdit(inv)} aria-label="Edit draft">
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  ) : null}
                  {isInvoiceUnpaid(inv) && (
                    <>
                      {SHOW_COLLECT_PAYMENT ? (
                        <Button
                          size="sm"
                          disabled={busyUuid === inv.uuid}
                          onClick={() => void onCollectPayment(inv)}
                        >
                          <Banknote className="h-3.5 w-3.5 mr-1" /> Collect payment
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyUuid === inv.uuid}
                        onClick={() => setMarkPaidInvoice(inv)}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> PAID
                      </Button>
                    </>
                  )}
                  {inv.pdfUrl ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyUuid === inv.uuid}
                        onClick={() => onViewPdf(inv.uuid)}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" /> PDF
                      </Button>
                      <WhatsAppSendGate
                        blocked={whatsappBlocked}
                        checking={whatsappChecking}
                        configureTo={whatsappConfigureTo}
                      >
                        <Button
                          size="sm"
                          variant="secondary"
                          aria-label="Send invoice on WhatsApp"
                          disabled={busyUuid === inv.uuid || whatsappBlocked}
                          onClick={() => void onSendWhatsApp(inv.uuid)}
                        >
                          <Send className="h-3.5 w-3.5 mr-1" /> WhatsApp
                        </Button>
                      </WhatsAppSendGate>
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
            <ListPager
              page={invoicePage}
              totalPages={invoicePages}
              totalElements={invoiceTotal}
              noun={invoiceTotal === 1 ? 'invoice' : 'invoices'}
              onPageChange={(p) => void load(p)}
            />
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
      <InvoicePdfDialog
        open={Boolean(previewInvoiceUuid)}
        invoiceUuid={previewInvoiceUuid}
        onOpenChange={(open) => {
          if (!open) setPreviewInvoiceUuid(null);
        }}
        fetchUrl={fetchPreviewUrl}
      />
    </div>
  );
}
