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
import { Loader2, Plus } from 'lucide-react';
import { VisitChartTabs } from '@/components/chart/VisitChartTabs';
import { chartSlicesFromVisit } from '@/components/chart/chartSlices';
import {
  EMPTY_NOTES,
  EMPTY_VITALS,
  type ChartNotesSlice,
  type ChartTabId,
  type ChartVitalsSlice,
} from '@/components/chart/chartTabs';
import {
  ClinicBookingModel,
  ClinicDoctorModel,
  ClinicVisitModel,
  fetchClinicDoctors,
} from '@/services/clinicService';
import { WalkInDialog } from '@/components/clinic/WalkInDialog';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { useAppSelector } from '@/module/store/hooks';
import {
  completeDoctorVisit,
  fetchMyDoctorBookings,
  fetchMyDoctorVisits,
  saveDoctorVisitChart,
  startDoctorBookingTreatment,
  startDoctorVisit,
} from '@/services/visitService';
import { DashboardAppointmentRow } from '@/components/schedule/DashboardAppointmentRow';
import { petNameWithType } from '@/utils/petType';
import { isUrgentVisit } from '@/utils/visitUrgency';
import { fetchMyDoctorProfile } from '@/services/doctorVerificationService';
import { resolveLockedDoctorUuid } from '@/utils/roles';
import { toast } from 'sonner';
import { parseApiErrorMessage } from '@/utils/validation';
import { canEditVisitChart } from '@/utils/visitChartLock';
import type { InvoiceFromVisitState } from '@/services/invoiceService';

type ApptRow =
  | { kind: 'booking'; booking: ClinicBookingModel; sortAt: number }
  | { kind: 'visit'; visit: ClinicVisitModel; sortAt: number };

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.authReducer.user);
  const { clinicUuid, clinic, isPersonalPractice } = useActiveClinic();
  const [visits, setVisits] = useState<ClinicVisitModel[]>([]);
  const [bookings, setBookings] = useState<ClinicBookingModel[]>([]);
  const [doctors, setDoctors] = useState<ClinicDoctorModel[]>([]);
  const [myDoctorUuid, setMyDoctorUuid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [chartVisit, setChartVisit] = useState<ClinicVisitModel | null>(null);
  const [chartTab, setChartTab] = useState<ChartTabId>('vitals');
  const [busy, setBusy] = useState(false);
  const [vitals, setVitals] = useState<ChartVitalsSlice>(EMPTY_VITALS);
  const [notes, setNotes] = useState<ChartNotesSlice>(EMPTY_NOTES);
  const [plan, setPlan] = useState('');

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

  const lockedDoctorUuid = resolveLockedDoctorUuid({
    isPersonalPractice,
    viewerUserUuid: user?.uuid,
    myDoctorUuid,
    doctors,
  });

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
      const slices = chartSlicesFromVisit(current);
      setVitals(slices.vitals);
      setNotes(slices.notes);
      setPlan(slices.plan);
      setChartTab('vitals');
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
      const slices = chartSlicesFromVisit(visit);
      setVitals(slices.vitals);
      setNotes(slices.notes);
      setPlan(slices.plan);
      setChartTab('vitals');
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
    if (!canEditVisitChart(chartVisit)) {
      toast.error('Prescription can no longer be edited. More than one hour has passed since checkout.');
      return;
    }
    if (andComplete && !notes.assessment.trim()) {
      toast.error('Add an assessment / diagnosis before completing');
      return;
    }
    setBusy(true);
    try {
      const vitalsPayload: Record<string, number> = {};
      if (vitals.weightKg) vitalsPayload.weightKg = Number(vitals.weightKg);
      if (vitals.temperatureC) vitalsPayload.temperatureC = Number(vitals.temperatureC);
      const saved = await saveDoctorVisitChart(chartVisit.uuid, {
        examinationNotes: notes.examinationNotes,
        assessment: notes.assessment,
        plan,
        nextVisitNotes: notes.nextVisitNotes,
        internalNotes: notes.internalNotes,
        vitals: Object.keys(vitalsPayload).length ? vitalsPayload : undefined,
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
            reason: completed.reasonForVisit || chartVisit.reasonForVisit || notes.examinationNotes || undefined,
            diagnosis: notes.assessment.trim() || completed.chart?.assessment || undefined,
            doctorNotes: plan || completed.chart?.plan || undefined,
            nextVisitNotes: notes.nextVisitNotes || completed.chart?.nextVisitNotes || undefined,
            petWeight: vitals.weightKg || undefined,
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
        <Button onClick={() => setAddOpen(true)} disabled={!clinicUuid || !lockedDoctorUuid}>
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
                <DashboardAppointmentRow
                  key={`booking-${b.uuid}`}
                  time={isValid(start) ? format(start, 'h:mm a') : '—'}
                  title={petNameWithType(b.petName, b.species)}
                  subtitle={[b.ownerName || 'Owner', b.notes, b.clinicName].filter(Boolean).join(' · ')}
                  status="Scheduled"
                  action={
                    <Button size="sm" onClick={() => void attendFromBooking(b.uuid)} disabled={busy}>
                      Attend
                    </Button>
                  }
                />
              );
            }
            const v = row.visit;
            const created = v.createdAt ? parseISO(v.createdAt) : null;
            return (
              <DashboardAppointmentRow
                key={`visit-${v.uuid}`}
                time={created && isValid(created) ? format(created, 'h:mm a') : '—'}
                title={petNameWithType(v.petName, v.species)}
                subtitle={[v.ownerName, v.ownerPhone, v.reasonForVisit].filter(Boolean).join(' · ')}
                urgent={isUrgentVisit(v.urgency)}
                status={v.status}
                onClick={() => void openChart(v)}
                action={
                  <Button size="sm" onClick={() => void openChart(v)} disabled={busy}>
                    {v.status === 'IN_PROGRESS' ? 'Open chart' : 'Attend'}
                  </Button>
                }
              />
            );
          })}

          {treated.map((v) => (
            <Card key={`treated-${v.uuid}`}>
              <CardContent className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {petNameWithType(v.petName, v.species)}
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
          lockedDoctorUuid={lockedDoctorUuid}
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
            <VisitChartTabs
              tab={chartTab}
              onTabChange={setChartTab}
              editable={canEditVisitChart(chartVisit)}
              vitals={vitals}
              onVitalsChange={setVitals}
              notes={notes}
              onNotesChange={setNotes}
              plan={plan}
              onPlanChange={setPlan}
              clinicUuid={chartVisit?.clinicUuid}
              petUuid={chartVisit?.petUuid}
              excludeVisitUuid={chartVisit?.uuid}
              pet={{
                name: chartVisit?.petName || 'Pet',
                species: chartVisit?.species,
                ownerName: chartVisit?.ownerName,
                weight: vitals.weightKg ? `${vitals.weightKg} kg` : undefined,
              }}
              thisVisit={
                chartVisit
                  ? {
                      uuid: chartVisit.uuid,
                      doctorName: chartVisit.doctorName,
                      date: chartVisit.startedAt || chartVisit.createdAt,
                    }
                  : null
              }
            />
          </div>
          <DialogFooter className="gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => void saveChart(false)}
              disabled={busy || !canEditVisitChart(chartVisit)}
            >
              Save
            </Button>
            <Button
              onClick={() => void saveChart(true)}
              disabled={busy || chartVisit?.status === 'CHECKING_OUT' || chartVisit?.status === 'COMPLETED'}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Finish treatment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
