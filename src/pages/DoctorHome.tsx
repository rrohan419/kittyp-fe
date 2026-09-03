import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  Calendar,
  Clock,
  Users,
  ArrowRight,
  BadgeCheck,
  UserPlus,
  Loader2,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Video,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  addDays,
  addMinutes,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isValid,
  parseISO,
  setHours,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import {
  DoctorVerificationModel,
  fetchMyDoctorProfile,
  isPracticeReady,
  statusLabel,
} from '@/services/doctorVerificationService';
import { formatPetDobWithAge } from '@/utils/petAge';
import {
  DoctorInviteModel,
  HealthEventModel,
  ClinicDoctorModel,
  ClinicPetListModel,
  acceptInvite,
  fetchClinicDoctors,
  fetchClinicPetMedicalProfile,
  fetchClinicPetVisits,
  fetchMyPendingInvites,
  isClinicActivated,
  CLINIC_NOT_ACTIVATED_MESSAGE,
  rejectInvite,
  switchClinic,
} from '@/services/clinicService';
import { setActiveClinic } from '@/module/slice/AuthSlice';
import { setPendingClinicPinned } from '@/utils/activeClinic';
import {
  ClinicBookingModel,
  ClinicVisitModel,
  completeDoctorVisit,
  fetchMyAttendedPatients,
  fetchMyDoctorBookings,
  fetchMyDoctorVisits,
  saveDoctorVisitChart,
  startDoctorBookingTreatment,
  startDoctorVisit,
} from '@/services/visitService';
import { useAppDispatch, useAppSelector } from '@/module/store/hooks';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { toast } from 'sonner';
import { notifyInviteAddressed } from '@/components/portal/PortalNotifications';
import { parseApiErrorMessage } from '@/utils/validation';
import { canEditVisitChart } from '@/utils/visitChartLock';
import { cn } from '@/lib/utils';
import { petNameWithType } from '@/utils/petType';
import { consultPath, isVideoConsult } from '@/utils/consult';
import { calendarBlockClass, isUrgentVisit } from '@/utils/visitUrgency';
import { filterUrgentAttentionQueue, isAttendedCalendarVisit } from '@/utils/visitStatus';
import { doctorAttendedCalendarBlockClass } from '@/components/schedule/doctorCalendarColor';
import { DashboardAppointmentRow } from '@/components/schedule/DashboardAppointmentRow';
import { WalkInDialog } from '@/components/clinic/WalkInDialog';
import { resolveLockedDoctorUuid } from '@/utils/roles';
import { hasAuthToken } from '@/utils/authStorage';
import { NowGutterMark, NowIndicator, useTickingNow } from '@/components/schedule/NowIndicator';
import { WeekCalendarSlotLayer } from '@/components/schedule/weekCalendarSlotLayer';
import {
  HOUR_PX,
  eventLayout,
  isFutureBookableSlot,
  nowLineOffsetPx,
  resolveEventDoctorUuid,
  filterPracticeWeekEvents,
  visitEventTime,
  visibleHourRange,
  weekHasFutureBookableSlots,
  withLanes,
} from '@/components/schedule/weekCalendarUtils';

type CalEvent = {
  id: string;
  kind: 'visit' | 'booking';
  title: string;
  subtitle: string;
  start: Date;
  end: Date;
  status: string;
  doctorUuid?: string | null;
  visit?: ClinicVisitModel;
  booking?: ClinicBookingModel;
};

type EventDetail = {
  kind: 'visit' | 'booking';
  visit?: ClinicVisitModel;
  booking?: ClinicBookingModel;
  pet?: ClinicPetListModel | null;
  history: ClinicVisitModel[];
  healthEvents: HealthEventModel[];
};

function chartFormFromVisit(visit: ClinicVisitModel, petWeight = '') {
  return {
    examinationNotes: visit.chart?.examinationNotes || '',
    assessment: visit.chart?.assessment || '',
    plan: visit.chart?.plan || '',
    nextVisitNotes: visit.chart?.nextVisitNotes || '',
    internalNotes: visit.chart?.internalNotes || '',
    weightKg: String((visit.chart?.vitals as { weightKg?: number })?.weightKg ?? petWeight),
    temperatureC: String((visit.chart?.vitals as { temperatureC?: number })?.temperatureC ?? ''),
  };
}

export default function DoctorHome() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.authReducer.user);
  const { clinicUuid, clinic, clinics, isPersonalPractice, refresh, loading: clinicLoading } = useActiveClinic();
  const scheduleSeq = useRef(0);
  const [profile, setProfile] = useState<DoctorVerificationModel | null>(null);
  const [invites, setInvites] = useState<DoctorInviteModel[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [acceptingUuid, setAcceptingUuid] = useState<string | null>(null);
  const [rejectingUuid, setRejectingUuid] = useState<string | null>(null);
  const [visits, setVisits] = useState<ClinicVisitModel[]>([]);
  const [bookings, setBookings] = useState<ClinicBookingModel[]>([]);
  const [patientCount, setPatientCount] = useState<number | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [weekAnchor, setWeekAnchor] = useState(() => startOfDay(new Date()));
  const [viewMode, setViewMode] = useState<'tiles' | 'list'>('tiles');
  const [chartVisit, setChartVisit] = useState<ClinicVisitModel | null>(null);
  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [doctors, setDoctors] = useState<ClinicDoctorModel[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addSlot, setAddSlot] = useState<Date | null>(null);
  const [form, setForm] = useState({
    examinationNotes: '',
    assessment: '',
    plan: '',
    nextVisitNotes: '',
    internalNotes: '',
    weightKg: '',
    temperatureC: '',
  });

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.firstName
    ? `Dr. ${[user.firstName, user.lastName].filter(Boolean).join(' ')}`
    : 'Doctor';
  const isVerified = profile?.status === 'VERIFIED' || profile?.status === 'PUBLISHED';
  const clinicActivated = isClinicActivated(clinic?.status);
  const practiceReady = isPracticeReady(profile?.status);
  const lockedDoctorUuid = resolveLockedDoctorUuid({
    isPersonalPractice,
    viewerUserUuid: user?.uuid,
    myDoctorUuid: profile?.uuid,
    doctors,
  });

  const bookCalendarSlot = (start: Date) => {
    if (!isFutureBookableSlot(start)) {
      toast.error('Cannot book a past time');
      return;
    }
    if (!clinicUuid || clinic?.status === 'SHUTDOWN') {
      toast.error('This practice cannot take new appointments');
      return;
    }
    if (!clinicActivated) {
      toast.error(CLINIC_NOT_ACTIVATED_MESSAGE);
      return;
    }
    if (!practiceReady || !lockedDoctorUuid) {
      toast.error('Certificates must be verified by admin before you can take appointments');
      return;
    }
    setAddSlot(start);
    setAddOpen(true);
  };

  const weekStart = useMemo(
    () => startOfWeek(weekAnchor, { weekStartsOn: 1 }),
    [weekAnchor]
  );
  const weekEnd = useMemo(() => endOfWeek(weekAnchor, { weekStartsOn: 1 }), [weekAnchor]);
  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );
  const now = useTickingNow();
  const today = useMemo(
    () => startOfDay(now),
    [now.getFullYear(), now.getMonth(), now.getDate()]
  );

  const loadSchedule = useCallback(async () => {
    if (!hasAuthToken() || clinicLoading) return;
    const seq = ++scheduleSeq.current;
    setScheduleLoading(true);
    try {
      const from = format(weekStart, 'yyyy-MM-dd');
      const to = format(weekEnd, 'yyyy-MM-dd');
      const params = { from, to, clinicUuid: clinicUuid || undefined };
      const [v, b, attended, docs] = await Promise.all([
        fetchMyDoctorVisits(params),
        fetchMyDoctorBookings(params).catch(() => [] as ClinicBookingModel[]),
        fetchMyAttendedPatients(clinicUuid || undefined, { pageNumber: 1, pageSize: 1 }).catch(
          () => ({ models: [], totalElements: 0 })
        ),
        clinicUuid
          ? fetchClinicDoctors(clinicUuid).catch(() => [] as ClinicDoctorModel[])
          : Promise.resolve([] as ClinicDoctorModel[]),
      ]);
      if (seq !== scheduleSeq.current) {
        return;
      }
      setVisits(v);
      setBookings(b);
      setPatientCount(attended.totalElements ?? 0);
      setDoctors(docs);
    } catch {
      setVisits([]);
      setBookings([]);
      setPatientCount(null);
      setDoctors([]);
      toast.error('Could not load schedule');
    } finally {
      setScheduleLoading(false);
    }
  }, [weekStart, weekEnd, clinicUuid, clinicLoading]);

  useEffect(() => {
    void fetchMyDoctorProfile()
      .then(setProfile)
      .catch(() => setProfile(null));

    void (async () => {
      setInvitesLoading(true);
      try {
        const list = await fetchMyPendingInvites();
        setInvites(list.filter((i) => i.status === 'PENDING'));
      } catch {
        setInvites([]);
      } finally {
        setInvitesLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    void loadSchedule();
    const t = setInterval(() => void loadSchedule(), 30000);
    return () => clearInterval(t);
  }, [loadSchedule]);

  const todayVisits = useMemo(
    () =>
      visits.filter((v) => {
        const { start } = visitEventTime(v);
        return isSameDay(start, today) || (v.createdAt ? isSameDay(parseISO(v.createdAt), today) : false);
      }),
    [visits, today]
  );

  /** Stats tiles follow the active practice; calendar keeps the full unfiltered list. */
  const practiceTodayVisits = useMemo(() => {
    if (!clinicUuid) return todayVisits;
    if (isPersonalPractice) {
      return todayVisits.filter((v) => !v.clinicUuid || v.clinicUuid === clinicUuid);
    }
    return todayVisits.filter((v) => v.clinicUuid === clinicUuid);
  }, [todayVisits, clinicUuid, isPersonalPractice]);

  const attending = useMemo(
    () => practiceTodayVisits.filter((v) => v.status === 'IN_PROGRESS'),
    [practiceTodayVisits]
  );
  const queue = useMemo(
    () => practiceTodayVisits.filter((v) => v.status === 'WAITLIST' || v.status === 'CHECKED_IN'),
    [practiceTodayVisits]
  );
  const treatedToday = useMemo(
    () => practiceTodayVisits.filter((v) => v.status === 'CHECKING_OUT' || v.status === 'COMPLETED'),
    [practiceTodayVisits]
  );
  const completedToday = useMemo(
    () => practiceTodayVisits.filter((v) => v.status === 'COMPLETED'),
    [practiceTodayVisits]
  );
  const todayBookings = useMemo(
    () =>
      bookings.filter((b) => {
        if (!b.slotStart) return false;
        if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes((b.status || '').toUpperCase())) return false;
        if (!isSameDay(parseISO(b.slotStart), today)) return false;
        if (!clinicUuid) return true;
        if (isPersonalPractice) {
          return !b.clinicUuid || b.clinicUuid === clinicUuid;
        }
        return b.clinicUuid === clinicUuid;
      }),
    [bookings, today, clinicUuid, isPersonalPractice]
  );
  const activeAppointments = attending.length + queue.length;
  const urgentToday = useMemo(
    () =>
      filterUrgentAttentionQueue(practiceTodayVisits).sort(
        (a, b) => visitEventTime(a).start.getTime() - visitEventTime(b).start.getTime()
      ),
    [practiceTodayVisits]
  );

  const clinicLabelByUuid = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of clinics) {
      if (c.uuid) map.set(c.uuid, c.personal ? `${c.name || 'Personal'} (personal)` : c.name || 'Clinic');
    }
    return map;
  }, [clinics]);

  const weekEvents = useMemo(() => {
    const events: CalEvent[] = [];
    for (const v of visits) {
      const { start, end } = visitEventTime(v);
      const place =
        v.clinicName ||
        (v.clinicUuid ? clinicLabelByUuid.get(v.clinicUuid) : undefined) ||
        '';
      events.push({
        id: `visit-${v.uuid}`,
        kind: 'visit',
        title: v.petName,
        subtitle: [v.ownerName || 'Owner', place, v.reasonForVisit].filter(Boolean).join(' · '),
        start,
        end,
        status: v.status,
        doctorUuid: v.doctorUuid,
        visit: v,
      });
    }
    for (const b of bookings) {
      if (!b.slotStart) continue;
      if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes((b.status || '').toUpperCase())) continue;
      const start = parseISO(b.slotStart);
      const end = b.slotEnd ? parseISO(b.slotEnd) : addMinutes(start, 30);
      const place =
        b.clinicName ||
        (b.clinicUuid ? clinicLabelByUuid.get(b.clinicUuid) : undefined) ||
        '';
      events.push({
        id: `booking-${b.uuid}`,
        kind: 'booking',
        title: b.petName,
        subtitle: [b.ownerName || 'Owner', place, b.notes].filter(Boolean).join(' · '),
        start,
        end,
        status: b.status,
        doctorUuid: b.doctorUuid,
        booking: b,
      });
    }
    const sorted = events.sort((a, b) => a.start.getTime() - b.start.getTime());
    const practiceFiltered = filterPracticeWeekEvents(sorted, clinicUuid, isPersonalPractice);
    return practiceFiltered;
  }, [visits, bookings, clinicLabelByUuid, clinicUuid, isPersonalPractice]);

  const todayInWeek = weekDays.some((d) => isSameDay(d, today));
  const hourRange = useMemo(
    () => visibleHourRange(weekEvents, todayInWeek ? now : undefined),
    [weekEvents, todayInWeek, now]
  );
  const weekHasBookableSlots = weekHasFutureBookableSlots(weekDays, hourRange, now);
  const nowTop = todayInWeek ? nowLineOffsetPx(now, hourRange) : null;
  const nextTodayStart = useMemo(
    () =>
      weekEvents
        .filter((e) => isSameDay(e.start, today) && e.start.getTime() > now.getTime())
        .sort((a, b) => a.start.getTime() - b.start.getTime())[0]?.start ?? null,
    [weekEvents, today, now]
  );
  const hours = useMemo(
    () => Array.from({ length: hourRange.endHour - hourRange.startHour }, (_, i) => hourRange.startHour + i),
    [hourRange]
  );

  const listEvents = useMemo(() => {
    return weekEvents
      .filter((e) => isSameDay(e.start, weekAnchor))
      .sort((a, b) => {
        const au = isUrgentVisit(a.visit?.urgency) ? 0 : 1;
        const bu = isUrgentVisit(b.visit?.urgency) ? 0 : 1;
        if (au !== bu) return au - bu;
        return a.start.getTime() - b.start.getTime();
      });
  }, [weekEvents, weekAnchor]);

  const todayEvents = useMemo(
    () => weekEvents.filter((e) => isSameDay(e.start, today)),
    [weekEvents, today]
  );

  const loadEventContext = async (clinicId: string | undefined, petUuid: string | undefined) => {
    if (!clinicId || !petUuid) {
      return { pet: null as ClinicPetListModel | null, history: [] as ClinicVisitModel[], healthEvents: [] as HealthEventModel[] };
    }
    const [profile, history] = await Promise.all([
      fetchClinicPetMedicalProfile(clinicId, petUuid).catch(() => null),
      fetchClinicPetVisits(clinicId, petUuid).catch(() => [] as ClinicVisitModel[]),
    ]);
    return {
      pet: profile?.pet ?? null,
      history,
      healthEvents: profile?.timeline ?? [],
    };
  };

  const openEvent = async (ev: CalEvent) => {
    setBusy(true);
    try {
      if (ev.kind === 'booking' && ev.booking) {
        const clinicId = ev.booking.clinicUuid || clinicUuid || undefined;
        const ctx = await loadEventContext(clinicId, ev.booking.petUuid);
        setEventDetail({
          kind: 'booking',
          booking: ev.booking,
          ...ctx,
        });
        return;
      }
      if (!ev.visit) return;
      const clinicId = ev.visit.clinicUuid || clinicUuid || undefined;
      const ctx = await loadEventContext(clinicId, ev.visit.petUuid);
      setEventDetail({
        kind: 'visit',
        visit: ev.visit,
        ...ctx,
      });
    } catch {
      toast.error('Could not load appointment details');
    } finally {
      setBusy(false);
    }
  };

  const startTreatment = async () => {
    if (!eventDetail) return;
    setBusy(true);
    try {
      if (eventDetail.kind === 'booking' && eventDetail.booking) {
        const visit = await startDoctorBookingTreatment(eventDetail.booking.uuid);
        toast.success('Treatment started');
        await loadSchedule();
        const weightFromPet = eventDetail.pet?.weight ? String(eventDetail.pet.weight) : '';
        setEventDetail(null);
        setChartVisit(visit);
        setForm(chartFormFromVisit(visit, weightFromPet));
        return;
      }
      if (!eventDetail.visit) return;
      let current = eventDetail.visit;
      if (current.status === 'WAITLIST' || current.status === 'CHECKED_IN') {
        current = await startDoctorVisit(current.uuid);
        await loadSchedule();
      }
      const weightFromPet = eventDetail.pet?.weight ? String(eventDetail.pet.weight) : '';
      setEventDetail(null);
      setChartVisit(current);
      setForm(chartFormFromVisit(current, weightFromPet));
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(ax.response?.data?.message || ax.message || 'Could not start treatment');
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
    if (andComplete && !form.assessment.trim()) {
      toast.error('Add an assessment / diagnosis before completing');
      return;
    }
    setBusy(true);
    try {
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
      if (andComplete) {
        const completed = await completeDoctorVisit(chartVisit.uuid);
        const visitClinic = completed.clinicUuid || chartVisit.clinicUuid;
        const billableOnDoctor = !visitClinic || visitClinic === clinicUuid;
        setChartVisit(null);
        await loadSchedule();
        // Organization clinics: reception bills from Checkout. Personal practice: doctor invoices.
        if (billableOnDoctor && isPersonalPractice) {
          const fromVisit = {
            visitUuid: completed.uuid || chartVisit.uuid,
            clinicUuid: visitClinic,
            petUuid: completed.petUuid || chartVisit.petUuid,
            petName: completed.petName || chartVisit.petName,
            ownerName: completed.ownerName || chartVisit.ownerName || undefined,
            ownerPhone: completed.ownerPhone || chartVisit.ownerPhone || undefined,
            ownerEmail: completed.ownerEmail || chartVisit.ownerEmail || undefined,
            reason: completed.reasonForVisit || chartVisit.reasonForVisit || undefined,
            diagnosis: form.assessment.trim() || completed.chart?.assessment || undefined,
            doctorNotes: form.plan || completed.chart?.plan || undefined,
            nextVisitNotes: form.nextVisitNotes || completed.chart?.nextVisitNotes || undefined,
            petWeight: form.weightKg || undefined,
          };
          toast.success('Treatment finished — ready to invoice');
          navigate(`/doctor/invoices?visit=${encodeURIComponent(fromVisit.visitUuid)}`, {
            state: { fromVisit },
          });
        } else {
          toast.success('Treatment finished — sent to reception Checkout for billing');
        }
        return;
      } else {
        toast.success('Chart saved');
      }
      await loadSchedule();
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

  const handleAccept = async (inv: DoctorInviteModel) => {
    if (!inv.token) {
      toast.error('Invite link is missing — ask the clinic to resend');
      return;
    }
    setAcceptingUuid(inv.uuid);
    try {
      const joined = await acceptInvite(inv.token);
      const clinicUuid = joined.clinicUuid || inv.clinicUuid;
      if (clinicUuid) {
        setPendingClinicPinned(false);
        await switchClinic(clinicUuid);
        dispatch(setActiveClinic(clinicUuid));
        await refresh();
      }
      toast.success(`Joined ${inv.clinicName}`);
      setInvites((prev) => prev.filter((i) => i.uuid !== inv.uuid));
      notifyInviteAddressed(inv.uuid);
    } catch (err: unknown) {
      toast.error(parseApiErrorMessage(String(err), 'Could not accept invite'));
    } finally {
      setAcceptingUuid(null);
    }
  };

  const handleReject = async (inv: DoctorInviteModel) => {
    if (!inv.token) return;
    setRejectingUuid(inv.uuid);
    try {
      await rejectInvite(inv.token);
      toast.message('Invite declined');
      setInvites((prev) => prev.filter((i) => i.uuid !== inv.uuid));
      notifyInviteAddressed(inv.uuid);
    } catch {
      toast.error('Could not decline invite');
    } finally {
      setRejectingUuid(null);
    }
  };

  const tileClass = 'border-0 shadow-sm hover:shadow-md transition-shadow h-full';

  const eventBlock = (ev: CalEvent & { lane: number; laneCount: number }, day: Date) => {
    const layout = eventLayout(ev, day, hourRange);
    if (!layout) return null;
    const urgent = isUrgentVisit(ev.visit?.urgency);
    const attended = isAttendedCalendarVisit(ev.status);
    const doctorUuid = resolveEventDoctorUuid(ev, lockedDoctorUuid);
    return (
      <button
        key={ev.id}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void openEvent(ev);
        }}
        className={cn(
          'absolute box-border rounded border px-1 py-0.5 text-[10px] leading-tight shadow-sm overflow-hidden text-left hover:brightness-110',
          attended
            ? doctorAttendedCalendarBlockClass(doctorUuid, urgent)
            : calendarBlockClass(urgent)
        )}
        style={{
          top: layout.top,
          height: layout.height,
          left: `calc(${layout.leftPct}% + 2px)`,
          width: `calc(${layout.widthPct}% - 4px)`,
          zIndex: 10 + ev.lane,
        }}
        title={`${urgent ? 'Urgent · ' : 'Routine · '}${ev.title} · ${format(ev.start, 'p')}`}
        aria-label={urgent ? `Urgent visit: ${ev.title}` : `Routine visit: ${ev.title}`}
      >
        <p className="font-semibold truncate">{urgent ? `Urgent · ${ev.title}` : ev.title}</p>
        <p className="opacity-90 truncate">{format(ev.start, 'h:mm a')}</p>
      </button>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {greeting}, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clinic?.personal
              ? "You're on Personal — online consults."
              : clinic?.name
                ? `You're at ${clinic.name} — clinic visits only.`
                : 'Your schedule'}
            {profile?.status ? ` · ${statusLabel(profile.status)}` : ''}
            {isVerified ? ' · Verified' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border p-0.5">
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'tiles' ? 'secondary' : 'ghost'}
              className="h-8 px-2"
              onClick={() => setViewMode('tiles')}
              aria-label="Tiles view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              className="h-8 px-2"
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/doctor/appointments">
              Queue <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {!invitesLoading && invites.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Clinic invites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invites.map((inv) => (
              <div key={inv.uuid} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {inv.clinicName} added you
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!!acceptingUuid || !isVerified}
                    onClick={() => void handleAccept(inv)}
                    title={
                      isVerified
                        ? undefined
                        : 'Certificates must be verified by admin before you can join a clinic'
                    }
                  >
                    {acceptingUuid === inv.uuid ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Accept'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!!rejectingUuid}
                    onClick={() => void handleReject(inv)}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
            {!isVerified ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Certificates must be verified by admin before you can join a clinic.
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}

      {urgentToday.length > 0 && (
        <Card className="relative border-rose-200 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-rose-800 dark:text-rose-200">
              Needs attention · {urgentToday.length} urgent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {urgentToday.map((v) => {
              const { start } = visitEventTime(v);
              const place =
                v.clinicName ||
                (v.clinicUuid ? clinicLabelByUuid.get(v.clinicUuid) : undefined) ||
                clinic?.name ||
                '';
              return (
                <DashboardAppointmentRow
                  key={v.uuid}
                  time={format(start, 'h:mm a')}
                  title={petNameWithType(v.petName, v.species)}
                  subtitle={[v.ownerName || 'Owner', place].filter(Boolean).join(' · ')}
                  urgent
                  status={v.status}
                  onClick={() =>
                    void openEvent({
                      id: v.uuid,
                      kind: 'visit',
                      title: v.petName,
                      subtitle: place,
                      start,
                      end: start,
                      status: v.status,
                      visit: v,
                    })
                  }
                />
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Link to="/doctor/appointments" className="block rounded-xl">
          <Card className={cn(tileClass, 'bg-gradient-to-br from-rose-500/10 to-rose-500/5')}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-rose-700 dark:text-rose-300 uppercase tracking-wide">Urgent today</p>
              <p className="text-3xl font-bold mt-2 text-rose-700 dark:text-rose-300">
                {scheduleLoading ? '—' : urgentToday.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Needs attention first</p>
            </CardContent>
          </Card>
        </Link>
          <Card className={cn(tileClass, 'bg-gradient-to-br from-primary/5 to-primary/10')}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active today</p>
              <p className="text-3xl font-bold mt-2">{scheduleLoading ? '—' : activeAppointments}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {queue.length} waiting · {attending.length} with you
                {todayBookings.length ? ` · ${todayBookings.length} scheduled` : ''}
                {' · '}
                {isPersonalPractice ? 'Personal' : clinic?.name || 'This clinic'}
              </p>
            </CardContent>
          </Card>
        <Card className={cn(tileClass, 'bg-gradient-to-br from-sky-500/5 to-sky-500/10')}>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Scheduled today</p>
            <p className="text-3xl font-bold mt-2">{scheduleLoading ? '—' : todayBookings.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Booked slots today</p>
          </CardContent>
        </Card>
        <Link to="/doctor/appointments" className="block rounded-xl">
          <Card className={cn(tileClass, 'bg-gradient-to-br from-emerald-500/5 to-emerald-500/10')}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Treated today</p>
              <p className="text-3xl font-bold mt-2">{scheduleLoading ? '—' : treatedToday.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {completedToday.length} completed
                {treatedToday.length - completedToday.length
                  ? ` · ${treatedToday.length - completedToday.length} checking out`
                  : ''}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/doctor/patients" className="block rounded-xl">
          <Card className={cn(tileClass, 'bg-gradient-to-br from-green-500/5 to-green-500/10')}>
            <CardContent className="p-5">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Patients</p>
                  <p className="text-3xl font-bold mt-2">{scheduleLoading ? '—' : patientCount ?? 0}</p>
                </div>
                <Users className="h-5 w-5 text-green-600 mt-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Week calendar */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Week calendar
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isPersonalPractice
                ? 'Personal practice only — clinic-branch visits stay on the clinic board'
                : clinic?.name
                  ? `${clinic.name} only`
                  : 'Active practice'}{' '}
              ·{' '}
              {viewMode === 'list'
                ? format(weekAnchor, 'EEE, MMM d')
                : (
                    <span className="font-bold text-foreground">
                      {format(weekStart, 'd MMM')} – {format(weekEnd, 'd MMM')}
                    </span>
                  )}
              {viewMode === 'tiles' && weekHasBookableSlots ? ' · Click an empty time to book' : ''}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
                <span className={cn('h-2.5 w-2.5 rounded-sm shrink-0 border', calendarBlockClass(false))} />
                Routine
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
                <span className={cn('h-2.5 w-2.5 rounded-sm shrink-0 border', calendarBlockClass(true))} />
                Urgent
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              title={viewMode === 'list' ? 'Previous day' : 'Previous week'}
              aria-label={viewMode === 'list' ? 'Previous day' : 'Previous week'}
              onClick={() => setWeekAnchor((d) => addDays(d, viewMode === 'list' ? -1 : -7))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={isSameDay(weekAnchor, today) ? 'secondary' : 'outline'}
              size="sm"
              className="h-8"
              title={viewMode === 'list' ? 'Jump to today' : 'Jump to this week'}
              onClick={() => setWeekAnchor(startOfDay(new Date()))}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              title={viewMode === 'list' ? 'Next day' : 'Next week'}
              aria-label={viewMode === 'list' ? 'Next day' : 'Next week'}
              onClick={() => setWeekAnchor((d) => addDays(d, viewMode === 'list' ? 1 : 7))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {scheduleLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {listEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  No appointments on {format(weekAnchor, 'EEE, MMM d')}.
                </p>
              ) : (
                listEvents.map((ev) => (
                  <DashboardAppointmentRow
                    key={ev.id}
                    time={format(ev.start, 'h:mm a')}
                    title={ev.title}
                    subtitle={`${format(ev.start, 'EEE MMM d')} · ${ev.subtitle}`}
                    urgent={isUrgentVisit(ev.visit?.urgency)}
                    status={ev.status}
                    onClick={() => void openEvent(ev)}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[720px] border border-border rounded-xl overflow-hidden">
                <div
                  className="grid border-b border-border bg-muted/40"
                  style={{ gridTemplateColumns: `56px repeat(7, minmax(0, 1fr))` }}
                >
                  <div className="border-r border-border" />
                  {weekDays.map((d) => (
                    <div
                      key={d.toISOString()}
                      className={cn(
                        'px-1 py-2 text-center border-r border-border last:border-r-0',
                        isSameDay(d, today) && 'bg-primary/10'
                      )}
                    >
                      <p className="text-[10px] uppercase text-muted-foreground">{format(d, 'EEE')}</p>
                      <p className={cn('text-sm font-semibold', isSameDay(d, today) && 'text-primary')}>
                        {format(d, 'd')}
                      </p>
                    </div>
                  ))}
                </div>
                <div
                  className="grid"
                  style={{ gridTemplateColumns: `56px repeat(7, minmax(0, 1fr))` }}
                >
                  <div className="relative border-r border-border bg-muted/20">
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="border-b border-border/60 text-[10px] text-muted-foreground pr-1 text-right pt-0.5"
                        style={{ height: HOUR_PX }}
                      >
                        {format(setHours(today, h), 'h a')}
                      </div>
                    ))}
                    {nowTop != null ? <NowGutterMark top={nowTop} now={now} /> : null}
                  </div>
                  {weekDays.map((d) => {
                    const dayEvs = withLanes(weekEvents.filter((e) => isSameDay(e.start, d)));
                    return (
                      <div
                        key={d.toISOString()}
                        className={cn(
                          'relative border-r border-border last:border-r-0',
                          isSameDay(d, today) && 'bg-primary/[0.03]'
                        )}
                        style={{ height: hours.length * HOUR_PX }}
                      >
                        <WeekCalendarSlotLayer
                          day={d}
                          hours={hours}
                          hourRange={hourRange}
                          now={now}
                          onSlotClick={bookCalendarSlot}
                        />
                        {nowTop != null && isSameDay(d, today) ? (
                          <NowIndicator top={nowTop} now={now} nextStartsAt={nextTodayStart} />
                        ) : null}
                        {dayEvs.map((ev) => eventBlock(ev, d))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {viewMode === 'tiles' && todayEvents.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Today at a glance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayEvents.map((ev) => (
              <DashboardAppointmentRow
                key={ev.id}
                time={format(ev.start, 'h:mm a')}
                title={ev.title}
                subtitle={ev.subtitle}
                urgent={isUrgentVisit(ev.visit?.urgency)}
                status={ev.status}
                onClick={() => void openEvent(ev)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Quick actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/doctor/appointments">
                <Stethoscope className="h-5 w-5 text-primary" />
                <span className="text-xs">Visit queue</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/doctor/availability">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-xs">Availability</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/doctor/patients">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-xs">Patients</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/doctor/settings">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <span className="text-xs">Profile</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!chartVisit} onOpenChange={(o) => !o && setChartVisit(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chart · {chartVisit?.petName}
              {chartVisit?.ownerName ? ` (${chartVisit.ownerName})` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Weight (kg)</Label>
                <Input value={form.weightKg} onChange={(e) => setForm((s) => ({ ...s, weightKg: e.target.value }))} />
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
                rows={3}
                value={form.examinationNotes}
                onChange={(e) => setForm((s) => ({ ...s, examinationNotes: e.target.value }))}
              />
            </div>
            <div>
              <Label>Assessment / diagnosis</Label>
              <Textarea
                rows={2}
                value={form.assessment}
                onChange={(e) => setForm((s) => ({ ...s, assessment: e.target.value }))}
              />
            </div>
            <div>
              <Label>Plan / prescription notes</Label>
              <Textarea
                rows={2}
                value={form.plan}
                onChange={(e) => setForm((s) => ({ ...s, plan: e.target.value }))}
                placeholder="Medications, home care, and follow-up — then finish to create the invoice"
                disabled={!canEditVisitChart(chartVisit)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {chartVisit?.status === 'CHECKING_OUT' || chartVisit?.status === 'COMPLETED'
                  ? 'Treatment finished. Prescription is editable for one hour after checkout.'
                  : isPersonalPractice
                    ? 'Last clinical step before billing. Finish treatment opens the invoice for this visit.'
                    : 'Last clinical step. Finish treatment sends the visit to reception Checkout for billing.'}
              </p>
            </div>
            <div>
              <Label>Next visit</Label>
              <Input
                value={form.nextVisitNotes}
                onChange={(e) => setForm((s) => ({ ...s, nextVisitNotes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => void saveChart(false)}
              disabled={busy || !canEditVisitChart(chartVisit)}
            >
              Save
            </Button>
            {chartVisit?.status !== 'CHECKING_OUT' ? (
              <Button onClick={() => void saveChart(true)} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Finish treatment
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!eventDetail} onOpenChange={(o) => !o && setEventDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {eventDetail?.kind === 'booking' ? 'Scheduled' : 'Visit'} ·{' '}
              {eventDetail?.booking?.petName || eventDetail?.visit?.petName || 'Patient'}
            </DialogTitle>
          </DialogHeader>
          {eventDetail && (
            <div className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <p>
                  <span className="text-muted-foreground">Owner:</span>{' '}
                  {eventDetail.booking?.ownerName ||
                    eventDetail.visit?.ownerName ||
                    eventDetail.pet?.ownerName ||
                    '—'}
                </p>
                {eventDetail.kind === 'booking' && eventDetail.booking?.slotStart ? (
                  <p>
                    <span className="text-muted-foreground">When:</span>{' '}
                    {format(parseISO(eventDetail.booking.slotStart), 'PPp')}
                  </p>
                ) : null}
                <p>
                  <span className="text-muted-foreground">Status:</span>{' '}
                  {eventDetail.booking?.status || eventDetail.visit?.status}
                </p>
                {(eventDetail.booking?.notes || eventDetail.visit?.reasonForVisit) && (
                  <p>
                    <span className="text-muted-foreground">Reason:</span>{' '}
                    {eventDetail.booking?.notes || eventDetail.visit?.reasonForVisit}
                  </p>
                )}
              </div>

              <div className="rounded-md border p-3 space-y-1">
                <p className="font-medium text-sm">Pet info</p>
                <p>
                  <span className="text-muted-foreground">Name:</span>{' '}
                  {eventDetail.pet?.name ||
                    eventDetail.booking?.petName ||
                    eventDetail.visit?.petName ||
                    '—'}
                </p>
                {eventDetail.pet?.species ? (
                  <p>
                    <span className="text-muted-foreground">Species:</span> {eventDetail.pet.species}
                    {eventDetail.pet.breed ? ` · ${eventDetail.pet.breed}` : ''}
                  </p>
                ) : null}
                {eventDetail.pet?.dateOfBirth ? (
                  <p>
                    <span className="text-muted-foreground">Date of birth:</span>{' '}
                    {formatPetDobWithAge(eventDetail.pet.dateOfBirth)}
                  </p>
                ) : null}
                {eventDetail.pet?.weight ? (
                  <p>
                    <span className="text-muted-foreground">Weight:</span> {eventDetail.pet.weight} kg
                  </p>
                ) : null}
                {eventDetail.pet?.gender ? (
                  <p>
                    <span className="text-muted-foreground">Gender:</span> {eventDetail.pet.gender}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <p className="font-medium text-sm">Previous history</p>
                {eventDetail.history.length === 0 && eventDetail.healthEvents.length === 0 ? (
                  <p className="text-muted-foreground text-xs">No prior visits on record.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
                    {eventDetail.history.slice(0, 8).map((h) => (
                      <div key={h.uuid} className="text-xs border-b border-border/60 pb-1.5 last:border-0">
                        <p className="font-medium">
                          {h.createdAt ? format(parseISO(h.createdAt), 'PP') : 'Visit'} · {h.status}
                        </p>
                        {h.chart?.assessment || h.reasonForVisit ? (
                          <p className="text-muted-foreground">
                            {h.chart?.assessment || h.reasonForVisit}
                          </p>
                        ) : null}
                      </div>
                    ))}
                    {eventDetail.healthEvents.slice(0, 5).map((he) => (
                      <div key={he.uuid} className="text-xs border-b border-border/60 pb-1.5 last:border-0">
                        <p className="font-medium">
                          {he.date} · {he.type}
                        </p>
                        <p className="text-muted-foreground">{he.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEventDetail(null)}>
              Close
            </Button>
            {eventDetail?.kind === 'booking' && isVideoConsult(eventDetail.booking?.mode) && eventDetail.booking?.uuid ? (
              <Button variant="outline" asChild>
                <Link to={consultPath(eventDetail.booking.uuid, 'doctor')}>
                  <Video className="h-4 w-4 mr-1" />
                  Join video
                </Link>
              </Button>
            ) : null}
            {eventDetail?.kind === 'visit' &&
            (eventDetail.visit?.status === 'IN_PROGRESS' || canEditVisitChart(eventDetail.visit)) ? (
              <Button
                onClick={() => {
                  const v = eventDetail.visit!;
                  const weightFromPet = eventDetail.pet?.weight ? String(eventDetail.pet.weight) : '';
                  setEventDetail(null);
                  setChartVisit(v);
                  setForm(chartFormFromVisit(v, weightFromPet));
                }}
                disabled={busy}
              >
                {eventDetail.visit?.status === 'CHECKING_OUT' ? 'Amend notes' : 'Open visit notes'}
              </Button>
            ) : eventDetail?.kind === 'visit' && eventDetail.visit?.status === 'COMPLETED' ? null : (
              <Button onClick={() => void startTreatment()} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Start treatment
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {clinicUuid && (
        <WalkInDialog
          open={addOpen}
          onOpenChange={(o) => {
            setAddOpen(o);
            if (!o) setAddSlot(null);
          }}
          clinicUuid={clinicUuid}
          doctors={doctors}
          lockedDoctorUuid={lockedDoctorUuid}
          initialSlotStart={addSlot}
          onCreated={loadSchedule}
        />
      )}
    </div>
  );
}
