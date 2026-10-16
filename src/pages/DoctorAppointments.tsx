import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addDays, format, isValid, parseISO, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Plus, Video } from 'lucide-react';
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
  isClinicActivated,
  CLINIC_NOT_ACTIVATED_MESSAGE,
  patchClinicBooking,
  patchClinicVisit,
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
import { consultPath, isVideoConsult } from '@/utils/consult';
import { hasAuthToken } from '@/utils/authStorage';
import { attendedVisitSurfaceClass, isUrgentVisit } from '@/utils/visitUrgency';
import { visitStatusLabel } from '@/utils/visitStatus';
import { cn } from '@/lib/utils';
import { fetchMyDoctorProfile, isPracticeReady, statusLabel } from '@/services/doctorVerificationService';
import { resolveLockedDoctorUuid } from '@/utils/roles';
import { toast } from 'sonner';
import { displayPhone, parseApiErrorMessage } from '@/utils/validation';
import { canEditVisitChart } from '@/utils/visitChartLock';
import type { InvoiceFromVisitState } from '@/services/invoiceService';
import { fetchInvoicePdfUrl } from '@/services/invoiceService';
import { InvoicePdfDialog } from '@/components/invoice/InvoicePdfDialog';

type ApptRow =
  | { kind: 'booking'; booking: ClinicBookingModel; sortAt: number }
  | { kind: 'visit'; visit: ClinicVisitModel; sortAt: number };

type ApptCategory = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
type ApptFilter = 'ALL' | 'ACTIVE' | 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';

const FILTER_OPTIONS: { value: ApptFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'IN_PROGRESS', label: 'In-Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'NO_SHOW', label: 'No show' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function rowCategory(row: ApptRow): ApptCategory {
  const status = ((row.kind === 'booking' ? row.booking.status : row.visit.status) || '').toUpperCase();
  if (status === 'CANCELLED') return 'CANCELLED';
  if (status === 'NO_SHOW') return 'NO_SHOW';
  if (status === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (status === 'COMPLETED' || status === 'CHECKING_OUT') return 'COMPLETED';
  return 'UPCOMING';
}

type ApptDetail =
  | { kind: 'booking'; booking: ClinicBookingModel }
  | { kind: 'visit'; visit: ClinicVisitModel };

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-words">{value}</span>
    </div>
  );
}

function fmtDateTime(raw?: string | null): string | null {
  if (!raw) return null;
  const d = parseISO(raw);
  return isValid(d) ? format(d, 'PPp') : null;
}

export default function DoctorAppointments() {
  const [detail, setDetail] = useState<ApptDetail | null>(null);
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.authReducer.user);
  const { clinicUuid, clinic, isPersonalPractice } = useActiveClinic();
  const clinicActivated = isClinicActivated(clinic?.status, clinic?.personal);
  const [visits, setVisits] = useState<ClinicVisitModel[]>([]);
  const [bookings, setBookings] = useState<ClinicBookingModel[]>([]);
  const [doctors, setDoctors] = useState<ClinicDoctorModel[]>([]);
  const [myDoctorUuid, setMyDoctorUuid] = useState<string | null>(null);
  const [practiceReady, setPracticeReady] = useState(true);
  const [doctorStatusLabel, setDoctorStatusLabel] = useState<string | null>(null);
  const [appointmentDate, setAppointmentDate] = useState(() =>
    format(startOfDay(new Date()), 'yyyy-MM-dd')
  );
  const [filter, setFilter] = useState<ApptFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [chartVisit, setChartVisit] = useState<ClinicVisitModel | null>(null);
  const [chartTab, setChartTab] = useState<ChartTabId>('vitals');
  const [busy, setBusy] = useState(false);
  const [vitals, setVitals] = useState<ChartVitalsSlice>(EMPTY_VITALS);
  const [notes, setNotes] = useState<ChartNotesSlice>(EMPTY_NOTES);
  const [plan, setPlan] = useState('');
  const [previewInvoiceUuid, setPreviewInvoiceUuid] = useState<string | null>(null);

  const fetchPreviewUrl = useCallback((uuid: string) => fetchInvoicePdfUrl(uuid), []);

  /** Scope to active practice — personal never mixes clinic-branch appointments. */
  const load = useCallback(async () => {
    if (!hasAuthToken()) {
      setVisits([]);
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const scope = { date: appointmentDate, clinicUuid: clinicUuid || undefined };
      const [v, b, docs] = await Promise.all([
        fetchMyDoctorVisits(scope),
        fetchMyDoctorBookings({
          ...scope,
        }).catch(() => [] as ClinicBookingModel[]),
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
  }, [appointmentDate, clinicUuid]);

  useEffect(() => {
    void fetchMyDoctorProfile()
      .then((p) => {
        if (p?.uuid) setMyDoctorUuid(p.uuid);
        setPracticeReady(isPracticeReady(p?.status));
        setDoctorStatusLabel(p?.status ? statusLabel(p.status) : null);
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
    const rows: ApptRow[] = [];
    const bookingsWithVisits = new Set(
      visits.map((visit) => visit.bookingUuid).filter((bookingUuid): bookingUuid is string => Boolean(bookingUuid))
    );
    for (const b of bookings) {
      if (bookingsWithVisits.has(b.uuid)) continue;
      if (!b.slotStart) continue;
      const status = (b.status || '').toUpperCase();
      if (status === 'COMPLETED') continue;
      const start = parseISO(b.slotStart);
      if (!isValid(start)) continue;
      rows.push({ kind: 'booking', booking: b, sortAt: start.getTime() });
    }
    for (const v of visits) {
      if (!['WAITLIST', 'CHECKED_IN', 'IN_PROGRESS', 'CANCELLED', 'NO_SHOW'].includes(v.status)) continue;
      const raw = v.startedAt || v.checkedInAt || v.createdAt;
      const t = raw && isValid(parseISO(raw)) ? parseISO(raw).getTime() : Date.now();
      rows.push({ kind: 'visit', visit: v, sortAt: t });
    }
    return rows.sort((a, b) => a.sortAt - b.sortAt);
  }, [bookings, visits]);

  const allTreated = useMemo(
    () => visits.filter((v) => v.status === 'CHECKING_OUT' || v.status === 'COMPLETED'),
    [visits]
  );

  const filterCounts = useMemo(() => {
    const counts: Record<ApptFilter, number> = {
      ALL: 0, ACTIVE: 0, UPCOMING: 0, IN_PROGRESS: 0, COMPLETED: 0, NO_SHOW: 0, CANCELLED: 0,
    };
    const add = (cat: ApptCategory) => {
      counts.ALL += 1;
      counts[cat] += 1;
      if (cat === 'UPCOMING' || cat === 'IN_PROGRESS') counts.ACTIVE += 1;
    };
    appointments.forEach((r) => add(rowCategory(r)));
    allTreated.forEach(() => add('COMPLETED'));
    return counts;
  }, [appointments, allTreated]);

  const matchesFilter = useCallback(
    (cat: ApptCategory) =>
      filter === 'ALL' ||
      filter === cat ||
      (filter === 'ACTIVE' && (cat === 'UPCOMING' || cat === 'IN_PROGRESS')),
    [filter]
  );

  const visibleAppointments = useMemo(
    () => appointments.filter((r) => matchesFilter(rowCategory(r))),
    [appointments, matchesFilter]
  );
  const treated = useMemo(
    () => (matchesFilter('COMPLETED') ? allTreated : []),
    [allTreated, matchesFilter]
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

  const closePastBooking = async (bookingUuid: string, status: 'CANCELLED' | 'NO_SHOW') => {
    if (!clinicUuid) return;
    setBusy(true);
    try {
      await patchClinicBooking(clinicUuid, bookingUuid, { status });
      toast.success(status === 'NO_SHOW' ? 'Appointment marked no-show' : 'Appointment cancelled');
      await load();
    } catch (err: unknown) {
      toast.error(parseApiErrorMessage(
        JSON.stringify((err as { response?: { data?: unknown } }).response?.data ?? ''),
        'Could not update appointment'
      ));
    } finally {
      setBusy(false);
    }
  };

  const closePastVisit = async (visitUuid: string, status: 'CANCELLED' | 'NO_SHOW') => {
    if (!clinicUuid) return;
    setBusy(true);
    try {
      await patchClinicVisit(clinicUuid, visitUuid, { status });
      toast.success(status === 'NO_SHOW' ? 'Visit marked no-show' : 'Visit cancelled');
      await load();
    } catch (err: unknown) {
      toast.error(parseApiErrorMessage(
        JSON.stringify((err as { response?: { data?: unknown } }).response?.data ?? ''),
        'Could not update visit'
      ));
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
        const billableOnDoctor = !visitClinic || visitClinic === clinicUuid;
        setChartVisit(null);
        await load();
        if (billableOnDoctor && isPersonalPractice) {
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
          toast.success('Treatment finished — ready to invoice');
          navigate(`/doctor/invoices?visit=${encodeURIComponent(fromVisit.visitUuid)}`, {
            state: { fromVisit },
          });
        } else {
          toast.success('Treatment finished — sent to reception Checkout for billing');
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
              ? "You're on Personal — online consults."
              : clinic?.name
                ? `You're at ${clinic.name} — clinic visits only.`
                : 'Your assigned appointments.'}{' '}
            Attend a patient, finish treatment, then invoice.
          </p>
          {!practiceReady ? (
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
              Certificates must be verified by admin before you can take appointments
              {doctorStatusLabel ? ` (current: ${doctorStatusLabel})` : ''}.
            </p>
          ) : null}
          {clinic && !clinicActivated ? (
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
              {CLINIC_NOT_ACTIVATED_MESSAGE}
              {clinic.status ? ` (current: ${clinic.status})` : ''}.
            </p>
          ) : null}
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          disabled={!clinicUuid || !lockedDoctorUuid || !practiceReady || !clinicActivated}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="doctor-appointment-date" className="text-sm text-muted-foreground">
          Appointment date
        </label>
        <Input
          id="doctor-appointment-date"
          type="date"
          className="w-[170px]"
          value={appointmentDate}
          onChange={(event) => setAppointmentDate(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            size="sm"
            variant={filter === opt.value ? 'default' : 'outline'}
            onClick={() => setFilter(opt.value)}
          >
            {opt.label} ({filterCounts[opt.value]})
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : visibleAppointments.length === 0 && treated.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {filter === 'ALL'
              ? 'No appointments right now. Use + to add a walk-in or schedule.'
              : 'No appointments match this filter.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {visibleAppointments.map((row) => {
            if (row.kind === 'booking') {
              const b = row.booking;
              const start = parseISO(b.slotStart);
              const isPastDate =
                isValid(start) &&
                startOfDay(start).getTime() < startOfDay(new Date()).getTime();
              const isOpenBooking = ['PENDING', 'CONFIRMED'].includes((b.status || '').toUpperCase());
              return (
                <DashboardAppointmentRow
                  key={`booking-${b.uuid}`}
                  time={isValid(start) ? format(start, 'h:mm a') : '—'}
                  title={petNameWithType(b.petName, b.species)}
                  subtitle={[b.ownerName || 'Owner', b.notes, b.clinicName].filter(Boolean).join(' · ')}
                  urgent={isUrgentVisit(b.urgency)}
                  status={isOpenBooking ? (isPastDate || start.getTime() < Date.now() ? 'Overdue' : 'Scheduled') : b.status}
                  onClick={() => setDetail({ kind: 'booking', booking: b })}
                  action={
                    <div className="flex flex-wrap items-center gap-2">
                      {isOpenBooking ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void closePastBooking(b.uuid, 'NO_SHOW')}
                            disabled={busy}
                          >
                            No show
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void closePastBooking(b.uuid, 'CANCELLED')}
                            disabled={busy}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : null}
                      {!isPastDate && isVideoConsult(b.mode) && (
                        <Button size="sm" variant="outline" asChild>
                          <Link to={consultPath(b.uuid, 'doctor')}>
                            <Video className="h-4 w-4 mr-1" />
                            Join video
                          </Link>
                        </Button>
                      )}
                      {!isPastDate && isOpenBooking ? <Button
                        size="sm"
                        onClick={() => void attendFromBooking(b.uuid)}
                        disabled={busy || !practiceReady || !clinicActivated}
                      >
                        Attend
                      </Button> : null}
                    </div>
                  }
                />
              );
            }
            const v = row.visit;
            const created = v.createdAt ? parseISO(v.createdAt) : null;
            const isPastVisit =
              Boolean(created && isValid(created)) &&
              startOfDay(created as Date).getTime() < startOfDay(new Date()).getTime();
            const isOpenVisit = ['WAITLIST', 'CHECKED_IN'].includes(v.status);
            return (
              <DashboardAppointmentRow
                key={`visit-${v.uuid}`}
                time={created && isValid(created) ? format(created, 'h:mm a') : '—'}
                title={petNameWithType(v.petName, v.species)}
                subtitle={[v.ownerName, displayPhone(v.ownerPhone), v.reasonForVisit].filter(Boolean).join(' · ')}
                urgent={isUrgentVisit(v.urgency)}
                status={v.status}
                onClick={() => setDetail({ kind: 'visit', visit: v })}
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    {isOpenVisit ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void closePastVisit(v.uuid, 'NO_SHOW')}
                          disabled={busy}
                        >
                          No show
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void closePastVisit(v.uuid, 'CANCELLED')}
                          disabled={busy}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : null}
                    {!isPastVisit || v.status === 'IN_PROGRESS' ? (
                      <Button
                        size="sm"
                        onClick={() => void openChart(v)}
                        disabled={busy || ((!practiceReady || !clinicActivated) && v.status !== 'IN_PROGRESS')}
                      >
                        {v.status === 'IN_PROGRESS' ? 'Open chart' : 'Attend'}
                      </Button>
                    ) : null}
                  </div>
                }
              />
            );
          })}

          {treated.map((v) => (
            <Card key={`treated-${v.uuid}`} className={cn('border', attendedVisitSurfaceClass)}>
              <CardContent className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetail({ kind: 'visit', visit: v })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setDetail({ kind: 'visit', visit: v });
                  }}
                >
                  <p className="text-sm font-medium truncate">
                    {petNameWithType(v.petName, v.species)}
                    {v.ownerName ? ` · ${v.ownerName}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {displayPhone(v.ownerPhone) ? `${displayPhone(v.ownerPhone)} · ` : ''}
                    {v.chart?.assessment || v.reasonForVisit || 'Visit'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="text-[10px]">
                    {visitStatusLabel(v.status)}
                  </Badge>
                  {(!v.clinicUuid || v.clinicUuid === clinicUuid) &&
                    (v.invoiceUuid ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewInvoiceUuid(v.invoiceUuid as string)}
                      >
                        View invoice
                      </Button>
                    ) : (
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
                        Create invoice
                      </Button>
                    ))}
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

      <InvoicePdfDialog
        open={Boolean(previewInvoiceUuid)}
        invoiceUuid={previewInvoiceUuid}
        onOpenChange={(open) => {
          if (!open) setPreviewInvoiceUuid(null);
        }}
        fetchUrl={fetchPreviewUrl}
      />

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appointment details</DialogTitle>
          </DialogHeader>
          {detail?.kind === 'booking' ? (
            <div className="space-y-2">
              <DetailField label="Status" value={visitStatusLabel(detail.booking.status)} />
              <DetailField label="Pet" value={petNameWithType(detail.booking.petName, detail.booking.species)} />
              <DetailField label="Owner" value={detail.booking.ownerName} />
              <DetailField label="Doctor" value={detail.booking.doctorName} />
              <DetailField label="Specialization" value={detail.booking.doctorSpecialization} />
              <DetailField label="Clinic" value={detail.booking.clinicName} />
              <DetailField label="Scheduled" value={fmtDateTime(detail.booking.slotStart)} />
              <DetailField label="Ends" value={fmtDateTime(detail.booking.slotEnd)} />
              <DetailField label="Mode" value={detail.booking.mode?.replace(/_/g, ' ')} />
              <DetailField label="Urgency" value={detail.booking.urgency} />
              <DetailField label="Notes" value={detail.booking.notes} />
            </div>
          ) : detail?.kind === 'visit' ? (
            <div className="space-y-2">
              <DetailField label="Status" value={visitStatusLabel(detail.visit.status)} />
              <DetailField label="Pet" value={petNameWithType(detail.visit.petName, detail.visit.species)} />
              <DetailField label="Owner" value={detail.visit.ownerName} />
              <DetailField label="Phone" value={displayPhone(detail.visit.ownerPhone)} />
              <DetailField label="Email" value={detail.visit.ownerEmail} />
              <DetailField label="Doctor" value={detail.visit.doctorName} />
              <DetailField label="Clinic" value={detail.visit.clinicName} />
              <DetailField label="Source" value={detail.visit.source?.replace(/_/g, ' ')} />
              <DetailField label="Channel" value={detail.visit.channel?.replace(/_/g, ' ')} />
              <DetailField label="Urgency" value={detail.visit.urgency} />
              <DetailField label="Reason" value={detail.visit.reasonForVisit} />
              <DetailField label="Created" value={fmtDateTime(detail.visit.createdAt)} />
              <DetailField label="Checked in" value={fmtDateTime(detail.visit.checkedInAt)} />
              <DetailField label="Started" value={fmtDateTime(detail.visit.startedAt)} />
              <DetailField label="Completed" value={fmtDateTime(detail.visit.completedAt)} />
              <DetailField label="Assessment" value={detail.visit.chart?.assessment} />
              <DetailField label="Exam notes" value={detail.visit.chart?.examinationNotes} />
              <DetailField label="Plan" value={detail.visit.chart?.plan} />
              <DetailField label="Weight" value={detail.visit.chart?.vitals?.weightKg ? `${detail.visit.chart.vitals.weightKg} kg` : null} />
              <DetailField label="Temperature" value={detail.visit.chart?.vitals?.temperatureC ? `${detail.visit.chart.vitals.temperatureC} °C` : null} />
            </div>
          ) : null}
          <DialogFooter className="gap-2 flex-wrap">
            {detail?.kind === 'visit' &&
            (detail.visit.status === 'WAITLIST' ||
              detail.visit.status === 'CHECKED_IN' ||
              detail.visit.status === 'IN_PROGRESS') ? (
              <Button
                disabled={
                  busy || ((!practiceReady || !clinicActivated) && detail.visit.status !== 'IN_PROGRESS')
                }
                onClick={() => {
                  const v = detail.visit;
                  setDetail(null);
                  void openChart(v);
                }}
              >
                {detail.visit.status === 'IN_PROGRESS' ? 'Open chart' : 'Attend'}
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setDetail(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
