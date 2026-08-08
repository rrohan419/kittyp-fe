import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  PawPrint,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  addDays,
  addMinutes,
  differenceInMinutes,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  setHours,
  setMinutes,
  setSeconds,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import {
  DoctorVerificationModel,
  fetchMyDoctorProfile,
  statusLabel,
} from '@/services/doctorVerificationService';
import {
  DoctorInviteModel,
  HealthEventModel,
  ClinicPetListModel,
  acceptInvite,
  fetchClinicPetMedicalProfile,
  fetchClinicPetVisits,
  fetchMyPendingInvites,
  rejectInvite,
} from '@/services/clinicService';
import {
  ClinicBookingModel,
  ClinicVisitModel,
  completeDoctorVisit,
  fetchMyDoctorBookings,
  fetchMyDoctorVisits,
  saveDoctorVisitChart,
  startDoctorBookingTreatment,
  startDoctorVisit,
} from '@/services/visitService';
import { useAppSelector } from '@/module/store/hooks';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { toast } from 'sonner';
import { parseApiErrorMessage } from '@/utils/validation';
import { cn } from '@/lib/utils';

type CalEvent = {
  id: string;
  kind: 'visit' | 'booking';
  title: string;
  subtitle: string;
  start: Date;
  end: Date;
  status: string;
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

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const HOUR_PX = 48;

function visitEventTime(v: ClinicVisitModel): { start: Date; end: Date } {
  const raw =
    v.status === 'IN_PROGRESS' || v.status === 'CHECKING_OUT'
      ? v.startedAt || v.checkedInAt || v.createdAt
      : v.status === 'COMPLETED'
        ? v.completedAt || v.startedAt || v.createdAt
        : v.checkedInAt || v.createdAt;
  const start = raw ? parseISO(raw) : new Date();
  return { start, end: addMinutes(start, 30) };
}

function statusTone(status: string) {
  const s = status.toUpperCase();
  if (s === 'IN_PROGRESS' || s === 'CONFIRMED') return 'bg-sky-500/90 text-white border-sky-600';
  if (s === 'CHECKED_IN' || s === 'WAITLIST') return 'bg-amber-500/90 text-white border-amber-600';
  if (s === 'CHECKING_OUT' || s === 'COMPLETED' || s === 'DONE') {
    return 'bg-emerald-600/90 text-white border-emerald-700';
  }
  if (s === 'CANCELLED' || s === 'NO_SHOW') return 'bg-muted text-muted-foreground border-border';
  return 'bg-primary/85 text-primary-foreground border-primary';
}

function withLanes(events: CalEvent[]): Array<CalEvent & { lane: number; laneCount: number }> {
  const sorted = [...events].sort(
    (a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime()
  );
  const placed: { ev: CalEvent; lane: number }[] = [];
  for (const ev of sorted) {
    const used = new Set(
      placed.filter((p) => p.ev.start < ev.end && p.ev.end > ev.start).map((p) => p.lane)
    );
    let lane = 0;
    while (used.has(lane)) lane += 1;
    placed.push({ ev, lane });
  }
  return placed.map(({ ev, lane }) => {
    const overlapping = placed.filter((p) => p.ev.start < ev.end && p.ev.end > ev.start);
    const laneCount = Math.max(1, Math.max(...overlapping.map((p) => p.lane)) + 1);
    return { ...ev, lane, laneCount };
  });
}

export default function DoctorHome() {
  const user = useAppSelector((s) => s.authReducer.user);
  const { clinicUuid, clinic } = useActiveClinic();
  const [profile, setProfile] = useState<DoctorVerificationModel | null>(null);
  const [invites, setInvites] = useState<DoctorInviteModel[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [acceptingUuid, setAcceptingUuid] = useState<string | null>(null);
  const [rejectingUuid, setRejectingUuid] = useState<string | null>(null);
  const [visits, setVisits] = useState<ClinicVisitModel[]>([]);
  const [bookings, setBookings] = useState<ClinicBookingModel[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [weekAnchor, setWeekAnchor] = useState(() => startOfDay(new Date()));
  const [viewMode, setViewMode] = useState<'tiles' | 'list'>('tiles');
  const [chartVisit, setChartVisit] = useState<ClinicVisitModel | null>(null);
  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
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

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.firstName
    ? `Dr. ${[user.firstName, user.lastName].filter(Boolean).join(' ')}`
    : 'Doctor';
  const isVerified = profile?.status === 'VERIFIED' || profile?.status === 'PUBLISHED';

  const weekStart = useMemo(
    () => startOfWeek(weekAnchor, { weekStartsOn: 1 }),
    [weekAnchor]
  );
  const weekEnd = useMemo(() => endOfWeek(weekAnchor, { weekStartsOn: 1 }), [weekAnchor]);
  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );
  const today = useMemo(() => startOfDay(new Date()), []);
  const hours = useMemo(
    () => Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i),
    []
  );

  const loadSchedule = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const from = format(weekStart, 'yyyy-MM-dd');
      const to = format(weekEnd, 'yyyy-MM-dd');
      const params = { from, to, clinicUuid: clinicUuid || undefined };
      const [v, b] = await Promise.all([
        fetchMyDoctorVisits(params),
        fetchMyDoctorBookings(params).catch(() => [] as ClinicBookingModel[]),
      ]);
      setVisits(v);
      setBookings(b);
    } catch {
      setVisits([]);
      setBookings([]);
      toast.error('Could not load schedule');
    } finally {
      setScheduleLoading(false);
    }
  }, [weekStart, weekEnd, clinicUuid]);

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
  const attending = useMemo(() => todayVisits.filter((v) => v.status === 'IN_PROGRESS'), [todayVisits]);
  const queue = useMemo(
    () => todayVisits.filter((v) => v.status === 'WAITLIST' || v.status === 'CHECKED_IN'),
    [todayVisits]
  );
  const treatedToday = useMemo(
    () => todayVisits.filter((v) => v.status === 'CHECKING_OUT' || v.status === 'COMPLETED'),
    [todayVisits]
  );
  const completedToday = useMemo(() => todayVisits.filter((v) => v.status === 'COMPLETED'), [todayVisits]);
  const todayBookings = useMemo(
    () =>
      bookings.filter((b) => {
        if (!b.slotStart) return false;
        if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes((b.status || '').toUpperCase())) return false;
        return isSameDay(parseISO(b.slotStart), today);
      }),
    [bookings, today]
  );
  const activeAppointments = attending.length + queue.length;

  const weekEvents = useMemo(() => {
    const events: CalEvent[] = [];
    for (const v of visits) {
      const { start, end } = visitEventTime(v);
      events.push({
        id: `visit-${v.uuid}`,
        kind: 'visit',
        title: v.petName,
        subtitle: `${v.ownerName || 'Owner'}${v.reasonForVisit ? ` · ${v.reasonForVisit}` : ''}`,
        start,
        end,
        status: v.status,
        visit: v,
      });
    }
    for (const b of bookings) {
      if (!b.slotStart) continue;
      if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes((b.status || '').toUpperCase())) continue;
      const start = parseISO(b.slotStart);
      const end = b.slotEnd ? parseISO(b.slotEnd) : addMinutes(start, 30);
      events.push({
        id: `booking-${b.uuid}`,
        kind: 'booking',
        title: b.petName,
        subtitle: `${b.ownerName || 'Owner'}${b.notes ? ` · ${b.notes}` : ''}`,
        start,
        end,
        status: b.status,
        booking: b,
      });
    }
    return events.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [visits, bookings]);

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
        setForm({
          examinationNotes: visit.chart?.examinationNotes || '',
          assessment: visit.chart?.assessment || '',
          plan: visit.chart?.plan || '',
          nextVisitNotes: visit.chart?.nextVisitNotes || '',
          internalNotes: visit.chart?.internalNotes || '',
          weightKg: String((visit.chart?.vitals as { weightKg?: number })?.weightKg ?? weightFromPet),
          temperatureC: String((visit.chart?.vitals as { temperatureC?: number })?.temperatureC ?? ''),
        });
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
      setForm({
        examinationNotes: current.chart?.examinationNotes || '',
        assessment: current.chart?.assessment || '',
        plan: current.chart?.plan || '',
        nextVisitNotes: current.chart?.nextVisitNotes || '',
        internalNotes: current.chart?.internalNotes || '',
        weightKg: String((current.chart?.vitals as { weightKg?: number })?.weightKg ?? weightFromPet),
        temperatureC: String((current.chart?.vitals as { temperatureC?: number })?.temperatureC ?? ''),
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(ax.response?.data?.message || ax.message || 'Could not start treatment');
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
      await saveDoctorVisitChart(chartVisit.uuid, {
        examinationNotes: form.examinationNotes,
        assessment: form.assessment,
        plan: form.plan,
        nextVisitNotes: form.nextVisitNotes,
        internalNotes: form.internalNotes,
        vitals: Object.keys(vitals).length ? vitals : undefined,
      });
      if (andComplete) {
        await completeDoctorVisit(chartVisit.uuid);
        toast.success('Treatment finished');
        setChartVisit(null);
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
      await acceptInvite(inv.token);
      toast.success(`Joined ${inv.clinicName}`);
      setInvites((prev) => prev.filter((i) => i.uuid !== inv.uuid));
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
    } catch {
      toast.error('Could not decline invite');
    } finally {
      setRejectingUuid(null);
    }
  };

  const tileClass = 'border-0 shadow-sm hover:shadow-md transition-shadow h-full';

  const eventBlock = (ev: CalEvent & { lane: number; laneCount: number }, day: Date) => {
    const dayStart = setSeconds(setMinutes(setHours(day, DAY_START_HOUR), 0), 0);
    const dayEnd = setSeconds(setMinutes(setHours(day, DAY_END_HOUR), 0), 0);
    const clampedStart = ev.start < dayStart ? dayStart : ev.start;
    const clampedEnd =
      ev.end > dayEnd ? dayEnd : ev.end > clampedStart ? ev.end : addMinutes(clampedStart, 30);
    const topMins = differenceInMinutes(clampedStart, dayStart);
    const durMins = Math.max(30, differenceInMinutes(clampedEnd, clampedStart));
    if (topMins >= (DAY_END_HOUR - DAY_START_HOUR) * 60 || topMins + durMins <= 0) return null;
    const top = (Math.max(0, topMins) / 60) * HOUR_PX;
    const height = Math.max(28, (durMins / 60) * HOUR_PX - 2);
    const widthPct = 100 / ev.laneCount;
    const leftPct = widthPct * ev.lane;
    return (
      <button
        key={ev.id}
        type="button"
        onClick={() => void openEvent(ev)}
        className={cn(
          'absolute rounded border px-1 py-0.5 text-[10px] leading-tight shadow-sm overflow-hidden z-10 text-left hover:brightness-110',
          statusTone(ev.status)
        )}
        style={{
          top: top + 1,
          height,
          left: `calc(${leftPct}% + 2px)`,
          width: `calc(${widthPct}% - 4px)`,
        }}
        title={`${ev.title} · ${format(ev.start, 'p')}`}
      >
        <p className="font-semibold truncate">{ev.title}</p>
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
              ? 'Personal practice'
              : clinic?.name
                ? clinic.name
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
                  {inv.clinicName} · {inv.doctorName || 'Doctor'}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" disabled={!!acceptingUuid} onClick={() => void handleAccept(inv)}>
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
          </CardContent>
        </Card>
      )}

      {attending.length > 0 && (
        <Card className="border-sky-200 bg-sky-50/40 dark:bg-sky-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Currently with you</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {attending.map((v) => (
              <button
                key={v.uuid}
                type="button"
                className="w-full text-left flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 hover:bg-muted/40"
                onClick={() => void openEvent({ id: v.uuid, kind: 'visit', title: v.petName, subtitle: '', start: new Date(), end: new Date(), status: v.status, visit: v })}
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate flex items-center gap-2">
                    <PawPrint className="h-4 w-4 shrink-0" />
                    {v.petName}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{v.ownerName || 'Owner'}</p>
                </div>
                <Badge className="shrink-0 bg-sky-600">In progress</Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/doctor/appointments" className="block rounded-xl">
          <Card className={cn(tileClass, 'bg-gradient-to-br from-primary/5 to-primary/10')}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active today</p>
              <p className="text-3xl font-bold mt-2">{scheduleLoading ? '—' : activeAppointments}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {queue.length} waiting · {attending.length} with you
                {todayBookings.length ? ` · ${todayBookings.length} scheduled` : ''}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Card className={cn(tileClass, 'bg-gradient-to-br from-sky-500/5 to-sky-500/10')}>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Scheduled today</p>
            <p className="text-3xl font-bold mt-2">{scheduleLoading ? '—' : todayBookings.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Also listed on waitlist at the clinic</p>
          </CardContent>
        </Card>
        <Link to="/doctor/appointments" className="block rounded-xl">
          <Card className={cn(tileClass, 'bg-gradient-to-br from-emerald-500/5 to-emerald-500/10')}>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Treated today</p>
              <p className="text-3xl font-bold mt-2">{scheduleLoading ? '—' : treatedToday.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{completedToday.length} completed</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/doctor/patients" className="block rounded-xl">
          <Card className={cn(tileClass, 'bg-gradient-to-br from-green-500/5 to-green-500/10')}>
            <CardContent className="p-5">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Patients</p>
                  <p className="text-3xl font-bold mt-2">{scheduleLoading ? '—' : todayVisits.length}</p>
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
              Mon–Sun · click a visit for diagnosis / prescription · {format(weekStart, 'MMM d')} –{' '}
              {format(weekEnd, 'MMM d')}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekAnchor((d) => addDays(d, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => setWeekAnchor(startOfDay(new Date()))}>
              Today
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekAnchor((d) => addDays(d, 7))}>
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
              {weekEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No appointments this week.</p>
              ) : (
                weekEvents.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => void openEvent(ev)}
                    className="w-full text-left flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {ev.title}
                        <span className="text-muted-foreground font-normal"> · {ev.subtitle}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(ev.start, 'EEE MMM d · p')} · {ev.kind}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('shrink-0 text-[10px] border', statusTone(ev.status))}
                    >
                      {ev.status}
                    </Badge>
                  </button>
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
                  <div className="border-r border-border bg-muted/20">
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="border-b border-border/60 text-[10px] text-muted-foreground pr-1 text-right pt-0.5"
                        style={{ height: HOUR_PX }}
                      >
                        {format(setHours(today, h), 'h a')}
                      </div>
                    ))}
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
                        {hours.map((h) => (
                          <div
                            key={h}
                            className="absolute left-0 right-0 border-b border-border/50"
                            style={{ top: (h - DAY_START_HOUR) * HOUR_PX, height: HOUR_PX }}
                          />
                        ))}
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
          <CardContent className="flex flex-wrap gap-2">
            {todayEvents.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => void openEvent(ev)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:opacity-90',
                  statusTone(ev.status)
                )}
              >
                <span className="font-medium">{ev.title}</span>
                <span className="text-xs opacity-90">{format(ev.start, 'h:mm a')}</span>
              </button>
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
              <Textarea rows={2} value={form.plan} onChange={(e) => setForm((s) => ({ ...s, plan: e.target.value }))} />
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
            <Button variant="outline" onClick={() => void saveChart(false)} disabled={busy}>
              Save
            </Button>
            <Button onClick={() => void saveChart(true)} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Finish treatment
            </Button>
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
                    {eventDetail.pet.dateOfBirth}
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
            {eventDetail?.kind === 'visit' &&
            (eventDetail.visit?.status === 'IN_PROGRESS' ||
              eventDetail.visit?.status === 'CHECKING_OUT') ? (
              <Button
                onClick={() => {
                  const v = eventDetail.visit!;
                  const weightFromPet = eventDetail.pet?.weight ? String(eventDetail.pet.weight) : '';
                  setEventDetail(null);
                  setChartVisit(v);
                  setForm({
                    examinationNotes: v.chart?.examinationNotes || '',
                    assessment: v.chart?.assessment || '',
                    plan: v.chart?.plan || '',
                    nextVisitNotes: v.chart?.nextVisitNotes || '',
                    internalNotes: v.chart?.internalNotes || '',
                    weightKg: String((v.chart?.vitals as { weightKg?: number })?.weightKg ?? weightFromPet),
                    temperatureC: String((v.chart?.vitals as { temperatureC?: number })?.temperatureC ?? ''),
                  });
                }}
                disabled={busy}
              >
                Continue chart
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
    </div>
  );
}
