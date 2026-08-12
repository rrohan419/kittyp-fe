import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format, isValid, parseISO, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarClock, Loader2, Plus, Stethoscope } from 'lucide-react';
import {
  ClinicBookingModel,
  ClinicDoctorModel,
  ClinicVisitModel,
  fetchClinicDoctors,
} from '@/services/clinicService';
import { WalkInDialog } from '@/components/clinic/WalkInDialog';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import {
  completeDoctorVisit,
  fetchMyDoctorBookings,
  fetchMyDoctorVisits,
  returnDoctorVisitToReception,
  saveDoctorVisitChart,
  startDoctorBookingTreatment,
  startDoctorVisit,
} from '@/services/visitService';
import { fetchMyDoctorProfile } from '@/services/doctorVerificationService';
import { toast } from 'sonner';
import { parseApiErrorMessage } from '@/utils/validation';
import type { InvoiceFromVisitState } from '@/services/invoiceService';

type ApptRow =
  | { kind: 'booking'; booking: ClinicBookingModel; sortAt: number }
  | { kind: 'visit'; visit: ClinicVisitModel; sortAt: number };

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const { clinicUuid, clinic, isPersonalPractice } = useActiveClinic();
  const [visits, setVisits] = useState<ClinicVisitModel[]>([]);
  const [bookings, setBookings] = useState<ClinicBookingModel[]>([]);
  const [doctors, setDoctors] = useState<ClinicDoctorModel[]>([]);
  const [myDoctorUuid, setMyDoctorUuid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [chartVisit, setChartVisit] = useState<ClinicVisitModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    examinationNotes: '',
    assessment: '',
    plan: '',
    nextVisitNotes: '',
    internalNotes: '',
    weightKg: '',
    temperatureC: '',
  });

  /** Scope to active practice — personal never mixes clinic-branch appointments. */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = startOfDay(new Date());
      const from = format(today, 'yyyy-MM-dd');
      const to = format(addDays(today, 14), 'yyyy-MM-dd');
      const scope = { clinicUuid: clinicUuid || undefined };
      const [v, b, docs] = await Promise.all([
        fetchMyDoctorVisits(scope),
        fetchMyDoctorBookings({ from, to, ...scope }).catch(() => [] as ClinicBookingModel[]),
        clinicUuid
          ? fetchClinicDoctors(clinicUuid).catch(() => [] as ClinicDoctorModel[])
          : Promise.resolve([] as ClinicDoctorModel[]),
      ]);
      setVisits(v);
      setBookings(b);
      setDoctors(docs);
    } catch {
      setVisits([]);
      setBookings([]);
      toast.error('Failed to load your appointments');
    } finally {
      setLoading(false);
    }
  }, [clinicUuid]);

  useEffect(() => {
    void fetchMyDoctorProfile()
      .then((p) => {
        if (p?.uuid) setMyDoctorUuid(p.uuid);
      })
      .catch(() => {
        /* keep last known uuid */
      });
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 20000);
    return () => clearInterval(t);
  }, [load]);

  const appointments = useMemo(() => {
    const cutoff = Date.now() - 60 * 60 * 1000;
    const rows: ApptRow[] = [];
    for (const b of bookings) {
      if (!b.slotStart) continue;
      const status = (b.status || '').toUpperCase();
      if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(status)) continue;
      const start = parseISO(b.slotStart);
      if (!isValid(start) || start.getTime() < cutoff) continue;
      rows.push({ kind: 'booking', booking: b, sortAt: start.getTime() });
    }
    for (const v of visits) {
      if (!['WAITLIST', 'CHECKED_IN', 'IN_PROGRESS'].includes(v.status)) continue;
      const raw = v.startedAt || v.checkedInAt || v.createdAt;
      const t = raw && isValid(parseISO(raw)) ? parseISO(raw).getTime() : Date.now();
      rows.push({ kind: 'visit', visit: v, sortAt: t });
    }
    return rows.sort((a, b) => a.sortAt - b.sortAt);
  }, [bookings, visits]);

  const treated = useMemo(
    () => visits.filter((v) => v.status === 'CHECKING_OUT' || v.status === 'COMPLETED'),
    [visits]
  );

  const openChart = async (visit: ClinicVisitModel) => {
    setBusy(true);
    try {
      let current = visit;
      if (visit.status === 'WAITLIST' || visit.status === 'CHECKED_IN') {
        current = await startDoctorVisit(visit.uuid);
        await load();
      }
      setChartVisit(current);
      setForm({
        examinationNotes: current.chart?.examinationNotes || '',
        assessment: current.chart?.assessment || '',
        plan: current.chart?.plan || '',
        nextVisitNotes: current.chart?.nextVisitNotes || '',
        internalNotes: current.chart?.internalNotes || '',
        weightKg: String((current.chart?.vitals as { weightKg?: number })?.weightKg ?? ''),
        temperatureC: String((current.chart?.vitals as { temperatureC?: number })?.temperatureC ?? ''),
      });
    } catch {
      toast.error('Could not attend visit');
    } finally {
      setBusy(false);
    }
  };

  const attendFromBooking = async (bookingUuid: string) => {
    setBusy(true);
    try {
      const visit = await startDoctorBookingTreatment(bookingUuid);
      toast.success('Attending visit');
      await load();
      setChartVisit(visit);
      setForm({
        examinationNotes: visit.chart?.examinationNotes || '',
        assessment: visit.chart?.assessment || '',
        plan: visit.chart?.plan || '',
        nextVisitNotes: visit.chart?.nextVisitNotes || '',
        internalNotes: visit.chart?.internalNotes || '',
        weightKg: String((visit.chart?.vitals as { weightKg?: number })?.weightKg ?? ''),
        temperatureC: String((visit.chart?.vitals as { temperatureC?: number })?.temperatureC ?? ''),
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown }; message?: string };
      const raw =
        typeof ax.response?.data === 'string'
          ? ax.response.data
          : ax.response?.data
            ? JSON.stringify(ax.response.data)
            : ax.message || '';
      toast.error(parseApiErrorMessage(raw, 'Could not attend booking'));
    } finally {
      setBusy(false);
    }
  };

  const saveChart = async (andComplete: boolean) => {
    if (!chartVisit) return;
    if (andComplete && !form.assessment.trim()) {
      toast.error('Add an assessment / diagnosis before completing');
      return;
    }
    setBusy(true);
    try {
      const vitals: Record<string, number> = {};
      if (form.weightKg) vitals.weightKg = Number(form.weightKg);
      if (form.temperatureC) vitals.temperatureC = Number(form.temperatureC);
      const saved = await saveDoctorVisitChart(chartVisit.uuid, {
        examinationNotes: form.examinationNotes,
        assessment: form.assessment,
        plan: form.plan,
        nextVisitNotes: form.nextVisitNotes,
        internalNotes: form.internalNotes,
        vitals: Object.keys(vitals).length ? vitals : undefined,
      });
      if (andComplete) {
        const completed = await completeDoctorVisit(chartVisit.uuid);
        const visitClinic = completed.clinicUuid || chartVisit.clinicUuid;
        const billableOnDoctor =
          isPersonalPractice && (!visitClinic || visitClinic === clinicUuid);
        setChartVisit(null);
        await load();
        if (billableOnDoctor) {
          const fromVisit: InvoiceFromVisitState = {
            visitUuid: completed.uuid || chartVisit.uuid,
            clinicUuid: visitClinic,
            petUuid: completed.petUuid || chartVisit.petUuid,
            petName: completed.petName || chartVisit.petName,
            ownerName: completed.ownerName || chartVisit.ownerName || undefined,
            ownerPhone: completed.ownerPhone || chartVisit.ownerPhone || undefined,
            ownerEmail: completed.ownerEmail || chartVisit.ownerEmail || undefined,
            reason: completed.reasonForVisit || chartVisit.reasonForVisit || form.examinationNotes || undefined,
            diagnosis: form.assessment.trim() || completed.chart?.assessment || undefined,
            doctorNotes: form.plan || completed.chart?.plan || undefined,
            nextVisitNotes: form.nextVisitNotes || completed.chart?.nextVisitNotes || undefined,
            petWeight: form.weightKg || undefined,
          };
          toast.success('Treatment finished — create invoice');
          navigate(`/doctor/invoices?visit=${encodeURIComponent(fromVisit.visitUuid)}`, {
            state: { fromVisit },
          });
        } else {
          toast.success(
            isPersonalPractice
              ? 'Treatment finished — clinic staff can create the invoice from Clinic → Appointments'
              : 'Treatment finished — create the invoice from Clinic → Appointments on this branch'
          );
        }
        return;
      }
      setChartVisit(saved);
      toast.success('Chart saved');
      await load();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown }; message?: string };
      const raw =
        typeof ax.response?.data === 'string'
          ? ax.response.data
          : ax.response?.data
            ? JSON.stringify(ax.response.data)
            : ax.message || '';
      toast.error(parseApiErrorMessage(raw, 'Failed to save chart'));
    } finally {
      setBusy(false);
    }
  };

  const sendBack = async () => {
    if (!chartVisit) return;
    setBusy(true);
    try {
      if (form.examinationNotes || form.assessment || form.plan) {
        const vitals: Record<string, number> = {};
        if (form.weightKg) vitals.weightKg = Number(form.weightKg);
        if (form.temperatureC) vitals.temperatureC = Number(form.temperatureC);
        await saveDoctorVisitChart(chartVisit.uuid, {
          examinationNotes: form.examinationNotes,
          assessment: form.assessment,
          plan: form.plan,
          nextVisitNotes: form.nextVisitNotes,
          internalNotes: form.internalNotes,
          vitals: Object.keys(vitals).length ? vitals : undefined,
        });
      }
      await returnDoctorVisitToReception(chartVisit.uuid);
      toast.success('Sent back to reception (Checked in)');
      setChartVisit(null);
      await load();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown }; message?: string };
      const raw =
        typeof ax.response?.data === 'string'
          ? ax.response.data
          : ax.response?.data
            ? JSON.stringify(ax.response.data)
            : ax.message || '';
      toast.error(parseApiErrorMessage(raw, 'Could not send back to reception'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-sm text-muted-foreground">
            {clinic?.personal
              ? 'Your bookings and visits across clinics.'
              : clinic?.name
                ? `Appointments for ${clinic.name}.`
                : 'Your assigned appointments.'}{' '}
            Attend a patient, finish treatment, then invoice.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} disabled={!clinicUuid || !myDoctorUuid}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : appointments.length === 0 && treated.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No appointments right now. Use + to add a walk-in or schedule.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {appointments.map((row) => {
            if (row.kind === 'booking') {
              const b = row.booking;
              const start = parseISO(b.slotStart);
              return (
                <Card key={`booking-${b.uuid}`}>
                  <CardContent className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <CalendarClock className="h-4 w-4" />
                        {b.petName}
                        <Badge variant="secondary" className="text-[10px]">
                          Scheduled
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {b.ownerName || 'Owner'}
                        {b.notes ? ` · ${b.notes}` : ''}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {isValid(start) ? format(start, 'EEE, MMM d · p') : b.slotStart}
                        {b.mode ? ` · ${b.mode.replace('_', ' ')}` : ''}
                        {b.clinicName ? ` · ${b.clinicName}` : ''}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => void attendFromBooking(b.uuid)} disabled={busy}>
                      Attend
                    </Button>
                  </CardContent>
                </Card>
              );
            }
            const v = row.visit;
            return (
              <Card key={`visit-${v.uuid}`}>
                <CardContent className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      {v.petName}
                      {v.urgency === 'URGENT' && <Badge variant="destructive">Urgent</Badge>}
                      <Badge variant="secondary" className="text-[10px]">
                        {v.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {v.ownerName}
                      {v.ownerPhone ? ` · ${v.ownerPhone}` : ''}
                      {v.reasonForVisit ? ` · ${v.reasonForVisit}` : ''}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {v.clinicName ? `${v.clinicName} · ` : ''}
                      {v.createdAt ? `since ${format(parseISO(v.createdAt), 'p')}` : ''}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => void openChart(v)} disabled={busy}>
                    {v.status === 'IN_PROGRESS' ? 'Open chart' : 'Attend'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          {treated.map((v) => (
            <Card key={`treated-${v.uuid}`}>
              <CardContent className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {v.petName}
                    {v.ownerName ? ` · ${v.ownerName}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {v.ownerPhone ? `${v.ownerPhone} · ` : ''}
                    {v.chart?.assessment || v.reasonForVisit || 'Visit'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="text-[10px]">
                    {v.status === 'CHECKING_OUT' ? 'Checkout' : 'Completed'}
                  </Badge>
                  {isPersonalPractice &&
                    (!v.clinicUuid || v.clinicUuid === clinicUuid) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const fromVisit: InvoiceFromVisitState = {
                        visitUuid: v.uuid,
                        clinicUuid: v.clinicUuid,
                        petUuid: v.petUuid,
                        petName: v.petName,
                        ownerName: v.ownerName || undefined,
                        ownerPhone: v.ownerPhone || undefined,
                        ownerEmail: v.ownerEmail || undefined,
                        reason: v.reasonForVisit || undefined,
                        diagnosis: v.chart?.assessment || undefined,
                        doctorNotes: v.chart?.plan || undefined,
                        nextVisitNotes: v.chart?.nextVisitNotes || undefined,
                      };
                      navigate(`/doctor/invoices?visit=${encodeURIComponent(v.uuid)}`, {
                        state: { fromVisit },
                      });
                    }}
                  >
                    Invoice
                  </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {clinicUuid && (
        <WalkInDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          clinicUuid={clinicUuid}
          doctors={doctors}
          lockedDoctorUuid={myDoctorUuid || undefined}
          onCreated={load}
        />
      )}

      <Dialog open={!!chartVisit} onOpenChange={(o) => !o && setChartVisit(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chart · {chartVisit?.petName}
              {chartVisit?.ownerName ? ` (${chartVisit.ownerName})` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {chartVisit?.reasonForVisit && (
              <p className="text-sm text-muted-foreground">Reason: {chartVisit.reasonForVisit}</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Weight (kg)</Label>
                <Input
                  value={form.weightKg}
                  onChange={(e) => setForm((s) => ({ ...s, weightKg: e.target.value }))}
                />
              </div>
              <div>
                <Label>Temp (°C)</Label>
                <Input
                  value={form.temperatureC}
                  onChange={(e) => setForm((s) => ({ ...s, temperatureC: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Examination / report</Label>
              <Textarea
                value={form.examinationNotes}
                onChange={(e) => setForm((s) => ({ ...s, examinationNotes: e.target.value }))}
                rows={3}
                placeholder="Findings shared with the pet owner"
              />
            </div>
            <div>
              <Label>Assessment / diagnosis</Label>
              <Textarea
                value={form.assessment}
                onChange={(e) => setForm((s) => ({ ...s, assessment: e.target.value }))}
                rows={2}
                placeholder="Required to complete"
              />
            </div>
            <div>
              <Label>Plan / prescription notes</Label>
              <Textarea
                value={form.plan}
                onChange={(e) => setForm((s) => ({ ...s, plan: e.target.value }))}
                rows={2}
                placeholder="Medications, home care, and follow-up — then finish to create the invoice"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Last clinical step before billing. Finish treatment opens the invoice for this visit.
              </p>
            </div>
            <div>
              <Label>Next visit notes</Label>
              <Input
                value={form.nextVisitNotes}
                onChange={(e) => setForm((s) => ({ ...s, nextVisitNotes: e.target.value }))}
              />
            </div>
            <div>
              <Label>Internal notes (clinic only)</Label>
              <Textarea
                value={form.internalNotes}
                onChange={(e) => setForm((s) => ({ ...s, internalNotes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={() => void saveChart(false)} disabled={busy}>
              Save
            </Button>
            <Button variant="secondary" onClick={() => void sendBack()} disabled={busy}>
              Send to reception
            </Button>
            <Button onClick={() => void saveChart(true)} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Finish treatment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
