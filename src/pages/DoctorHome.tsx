import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Users,
  Video,
  ArrowRight,
  BadgeCheck,
  UserPlus,
  Loader2,
  Stethoscope,
  PawPrint,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  addHours,
  differenceInMinutes,
  format,
  isSameDay,
  parseISO,
  setHours,
  setMinutes,
  setSeconds,
  startOfDay,
} from 'date-fns';
import {
  DoctorVerificationModel,
  fetchMyDoctorProfile,
  statusLabel,
} from '@/services/doctorVerificationService';
import { DoctorInviteModel, acceptInvite, fetchMyPendingInvites, rejectInvite } from '@/services/clinicService';
import {
  ClinicBookingModel,
  ClinicVisitModel,
  fetchMyDoctorBookings,
  fetchMyDoctorVisits,
} from '@/services/visitService';
import { useAppSelector } from '@/module/store/hooks';
import { toast } from 'sonner';
import { parseApiErrorMessage } from '@/utils/validation';
import { cn } from '@/lib/utils';

type DayEvent = {
  id: string;
  kind: 'visit' | 'booking';
  title: string;
  subtitle: string;
  start: Date;
  end: Date;
  status: string;
  href: string;
};

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const HOUR_PX = 64;

function visitEventTime(v: ClinicVisitModel): { start: Date; end: Date } {
  const raw =
    v.status === 'IN_PROGRESS' || v.status === 'CHECKING_OUT'
      ? v.startedAt || v.checkedInAt || v.createdAt
      : v.status === 'COMPLETED'
        ? v.completedAt || v.startedAt || v.createdAt
        : v.checkedInAt || v.createdAt;
  const start = raw ? parseISO(raw) : new Date();
  const end = addHours(start, 1);
  return { start, end };
}

function statusTone(status: string) {
  const s = status.toUpperCase();
  if (s === 'IN_PROGRESS' || s === 'CONFIRMED') {
    return 'bg-sky-500/90 text-white border-sky-600';
  }
  if (s === 'CHECKED_IN' || s === 'WAITLIST') {
    return 'bg-amber-500/90 text-white border-amber-600';
  }
  if (s === 'COMPLETED' || s === 'DONE') {
    return 'bg-emerald-600/90 text-white border-emerald-700';
  }
  if (s === 'CANCELLED' || s === 'NO_SHOW') {
    return 'bg-muted text-muted-foreground border-border';
  }
  return 'bg-primary/85 text-primary-foreground border-primary';
}

export default function DoctorHome() {
  const user = useAppSelector((s) => s.authReducer.user);
  const [profile, setProfile] = useState<DoctorVerificationModel | null>(null);
  const [invites, setInvites] = useState<DoctorInviteModel[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [acceptingUuid, setAcceptingUuid] = useState<string | null>(null);
  const [rejectingUuid, setRejectingUuid] = useState<string | null>(null);
  const [visits, setVisits] = useState<ClinicVisitModel[]>([]);
  const [bookings, setBookings] = useState<ClinicBookingModel[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.firstName
    ? `Dr. ${[user.firstName, user.lastName].filter(Boolean).join(' ')}`
    : 'Doctor';
  const isVerified = profile?.status === 'VERIFIED' || profile?.status === 'PUBLISHED';
  const today = useMemo(() => startOfDay(new Date()), []);
  const todayIso = format(today, 'yyyy-MM-dd');

  const loadSchedule = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const [v, b] = await Promise.all([
        fetchMyDoctorVisits(todayIso),
        fetchMyDoctorBookings(todayIso).catch(() => [] as ClinicBookingModel[]),
      ]);
      setVisits(v);
      setBookings(b);
    } catch {
      setVisits([]);
      setBookings([]);
      toast.error('Could not load today’s schedule');
    } finally {
      setScheduleLoading(false);
    }
  }, [todayIso]);

  useEffect(() => {
    void fetchMyDoctorProfile()
      .then(setProfile)
      .catch(() => setProfile(null));

    void (async () => {
      setInvitesLoading(true);
      try {
        const list = await fetchMyPendingInvites();
        setInvites(list.filter((i) => i.status === 'PENDING'));
      } catch (err) {
        console.error('Failed to load clinic invites', err);
        setInvites([]);
      } finally {
        setInvitesLoading(false);
      }
    })();

    void loadSchedule();
    const t = setInterval(() => void loadSchedule(), 30000);
    return () => clearInterval(t);
  }, [loadSchedule]);

  const attending = useMemo(
    () => visits.filter((v) => v.status === 'IN_PROGRESS'),
    [visits]
  );
  const queue = useMemo(
    () => visits.filter((v) => v.status === 'WAITLIST' || v.status === 'CHECKED_IN'),
    [visits]
  );
  const treatedToday = useMemo(
    () => visits.filter((v) => v.status === 'CHECKING_OUT' || v.status === 'COMPLETED'),
    [visits]
  );
  const completedToday = useMemo(() => visits.filter((v) => v.status === 'COMPLETED'), [visits]);
  const activeAppointments = attending.length + queue.length;
  const scheduledBookings = bookings.filter(
    (b) => !['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes((b.status || '').toUpperCase())
  );

  const dayEvents = useMemo(() => {
    const events: DayEvent[] = [];
    for (const v of visits) {
      const { start, end } = visitEventTime(v);
      if (!isSameDay(start, today) && v.createdAt && !isSameDay(parseISO(v.createdAt), today)) {
        // still show if created today
      }
      events.push({
        id: `visit-${v.uuid}`,
        kind: 'visit',
        title: v.petName,
        subtitle: `${v.ownerName || 'Owner'}${v.reasonForVisit ? ` · ${v.reasonForVisit}` : ''}`,
        start,
        end,
        status: v.status,
        href: '/doctor/appointments',
      });
    }
    for (const b of bookings) {
      if (!b.slotStart) continue;
      const start = parseISO(b.slotStart);
      const end = b.slotEnd ? parseISO(b.slotEnd) : addHours(start, 1);
      events.push({
        id: `booking-${b.uuid}`,
        kind: 'booking',
        title: b.petName,
        subtitle: `${b.ownerName || 'Owner'}${b.mode ? ` · ${b.mode}` : ''}`,
        start,
        end,
        status: b.status,
        href: '/doctor/appointments',
      });
    }
    return events.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [visits, bookings, today]);

  const hours = useMemo(
    () => Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i),
    []
  );

  const nowTop = useMemo(() => {
    const now = new Date();
    if (!isSameDay(now, today)) return null;
    const mins = differenceInMinutes(now, setSeconds(setMinutes(setHours(today, DAY_START_HOUR), 0), 0));
    if (mins < 0 || mins > (DAY_END_HOUR - DAY_START_HOUR) * 60) return null;
    return (mins / 60) * HOUR_PX;
  }, [today]);

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
      const ax = err as { response?: { data?: unknown }; message?: string };
      const raw =
        typeof ax.response?.data === 'string'
          ? ax.response.data
          : ax.response?.data
            ? JSON.stringify(ax.response.data)
            : ax.message || '';
      toast.error(parseApiErrorMessage(raw, 'Failed to accept invite'));
    } finally {
      setAcceptingUuid(null);
    }
  };

  const handleReject = async (inv: DoctorInviteModel) => {
    if (!inv.token) {
      toast.error('Invite link is missing — ask the clinic to resend');
      return;
    }
    setRejectingUuid(inv.uuid);
    try {
      await rejectInvite(inv.token);
      toast.success(`Declined invite from ${inv.clinicName}`);
      setInvites((prev) => prev.filter((i) => i.uuid !== inv.uuid));
    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown }; message?: string };
      const raw =
        typeof ax.response?.data === 'string'
          ? ax.response.data
          : ax.response?.data
            ? JSON.stringify(ax.response.data)
            : ax.message || '';
      toast.error(parseApiErrorMessage(raw, 'Failed to decline invite'));
    } finally {
      setRejectingUuid(null);
    }
  };

  const tileClass =
    'border-0 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex flex-wrap items-center gap-2">
            {greeting}, {displayName}
            {isVerified && (
              <Badge className="bg-emerald-600 hover:bg-emerald-600 gap-1 font-medium">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified
              </Badge>
            )}
            {profile && !isVerified && (
              <Badge variant="secondary" className="font-medium">
                {statusLabel(profile.status)}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} — live clinic visits and scheduled slots.
          </p>
        </div>
        <div className="flex gap-3">
          <Button size="sm" asChild>
            <Link to="/doctor/appointments">
              <Video className="h-4 w-4 mr-2" />
              Open visit queue
            </Link>
          </Button>
        </div>
      </div>

      {(invitesLoading || invites.length > 0) && (
        <Card className="border-primary/20 shadow-sm bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Clinic invitations
              {!invitesLoading && invites.length > 0 && (
                <Badge variant="secondary">{invites.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invitesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking for invites…
              </div>
            ) : (
              invites.map((inv) => (
                <div
                  key={inv.uuid}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{inv.clinicName}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited as {inv.doctorName || 'doctor'}
                      {inv.expiresAt ? ` · expires ${inv.expiresAt.slice(0, 10)}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {inv.token && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/clinic-invite/accept?token=${encodeURIComponent(inv.token)}`}>
                          Review
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={acceptingUuid === inv.uuid || rejectingUuid === inv.uuid || !inv.token}
                      onClick={() => void handleAccept(inv)}
                    >
                      {acceptingUuid === inv.uuid ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          Joining…
                        </>
                      ) : (
                        'Accept'
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={acceptingUuid === inv.uuid || rejectingUuid === inv.uuid || !inv.token}
                      onClick={() => void handleReject(inv)}
                    >
                      {rejectingUuid === inv.uuid ? 'Declining…' : 'Decline'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Currently attending */}
      <Card className="border-sky-500/30 shadow-sm bg-sky-500/5">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-sky-600" />
            Currently with you
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/doctor/appointments">
              Chart <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {scheduleLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : attending.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No patient in progress. When the clinic checks someone in for you, they appear here and on
              the calendar below.
            </p>
          ) : (
            <div className="space-y-2">
              {attending.map((v) => (
                <Link
                  key={v.uuid}
                  to="/doctor/appointments"
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate flex items-center gap-2">
                      <PawPrint className="h-4 w-4 shrink-0" />
                      {v.petName}
                      {v.urgency === 'URGENT' && <Badge variant="destructive">Urgent</Badge>}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {v.ownerName || 'Owner'}
                      {v.ownerPhone ? ` · ${v.ownerPhone}` : ''}
                      {v.reasonForVisit ? ` · ${v.reasonForVisit}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {v.clinicName ? `${v.clinicName} · ` : ''}
                      Started{' '}
                      {v.startedAt
                        ? format(parseISO(v.startedAt), 'p')
                        : v.checkedInAt
                          ? format(parseISO(v.checkedInAt), 'p')
                          : '—'}
                    </p>
                  </div>
                  <Badge className="shrink-0 bg-sky-600 hover:bg-sky-600">In progress</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clickable tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/doctor/appointments" className="block rounded-xl">
          <Card className={cn(tileClass, 'bg-gradient-to-br from-primary/5 to-primary/10')}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Active today
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {scheduleLoading ? '—' : activeAppointments}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {queue.length} waiting · {attending.length} with you
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/doctor/appointments" className="block rounded-xl">
          <Card className={cn(tileClass, 'bg-gradient-to-br from-sky-500/5 to-sky-500/10')}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Scheduled slots
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {scheduleLoading ? '—' : scheduledBookings.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Bookings on calendar</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-sky-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/doctor/appointments" className="block rounded-xl">
          <Card className={cn(tileClass, 'bg-gradient-to-br from-emerald-500/5 to-emerald-500/10')}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Treated today
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {scheduleLoading ? '—' : treatedToday.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {completedToday.length} checked out ·{' '}
                    {treatedToday.length - completedToday.length} at checkout
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/doctor/patients" className="block rounded-xl">
          <Card className={cn(tileClass, 'bg-gradient-to-br from-green-500/5 to-green-500/10')}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Patients
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {scheduleLoading ? '—' : visits.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Seen / queued today</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Appointment list chips */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg font-semibold">Today&apos;s appointments</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/doctor/appointments" className="text-primary">
              Queue <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {scheduleLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : dayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No visits or bookings assigned to you today.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dayEvents.map((ev) => (
                <Link
                  key={ev.id}
                  to={ev.href}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:opacity-90',
                    statusTone(ev.status)
                  )}
                >
                  <span className="font-medium">{ev.title}</span>
                  <span className="opacity-90 text-xs">{format(ev.start, 'h:mm a')}</span>
                  <Badge variant="secondary" className="text-[10px] bg-black/10 border-0 capitalize">
                    {ev.kind}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg font-semibold">Recently treated</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/doctor/appointments">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {scheduleLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : treatedToday.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              After you finish treatment, pet and owner appear here and on the clinic Checkout board.
            </p>
          ) : (
            treatedToday.slice(0, 8).map((v) => (
              <Link
                key={v.uuid}
                to="/doctor/appointments"
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {v.petName}
                    {v.ownerName ? ` · ${v.ownerName}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {v.ownerPhone ? `${v.ownerPhone} · ` : ''}
                    {v.chart?.assessment || v.reasonForVisit || 'Treated'}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {v.status === 'CHECKING_OUT' ? 'Checkout' : 'Done'}
                </Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {/* Outlook-style day calendar */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Day calendar · 1 hour slots
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {format(today, 'EEEE, MMM d')} — walk-ins and scheduled bookings placed by start time.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {scheduleLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="relative border border-border rounded-xl overflow-hidden bg-background">
              <div className="grid grid-cols-[72px_1fr]">
                <div className="border-r border-border bg-muted/30">
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="border-b border-border/60 text-xs text-muted-foreground pr-2 text-right pt-1"
                      style={{ height: HOUR_PX }}
                    >
                      {format(setHours(today, h), 'h a')}
                    </div>
                  ))}
                </div>
                <div className="relative" style={{ height: hours.length * HOUR_PX }}>
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-b border-border/60"
                      style={{ top: (h - DAY_START_HOUR) * HOUR_PX, height: HOUR_PX }}
                    />
                  ))}

                  {nowTop != null && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: nowTop }}
                    >
                      <div className="h-0.5 bg-destructive w-full relative">
                        <span className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full bg-destructive" />
                      </div>
                    </div>
                  )}

                  {dayEvents.map((ev, idx) => {
                    const dayStart = setSeconds(setMinutes(setHours(today, DAY_START_HOUR), 0), 0);
                    const dayEnd = setSeconds(setMinutes(setHours(today, DAY_END_HOUR), 0), 0);
                    const clampedStart = ev.start < dayStart ? dayStart : ev.start;
                    const clampedEnd = ev.end > dayEnd ? dayEnd : ev.end > clampedStart ? ev.end : addHours(clampedStart, 1);
                    const topMins = differenceInMinutes(clampedStart, dayStart);
                    const durMins = Math.max(30, differenceInMinutes(clampedEnd, clampedStart));
                    if (topMins >= (DAY_END_HOUR - DAY_START_HOUR) * 60 || topMins + durMins <= 0) {
                      return null;
                    }
                    const top = (Math.max(0, topMins) / 60) * HOUR_PX;
                    const height = Math.max(36, (durMins / 60) * HOUR_PX - 4);
                    const colOffset = (idx % 3) * 8;
                    return (
                      <Link
                        key={ev.id}
                        to={ev.href}
                        className={cn(
                          'absolute left-2 right-2 rounded-md border px-2 py-1 text-xs shadow-sm overflow-hidden z-10 hover:brightness-110',
                          statusTone(ev.status)
                        )}
                        style={{ top: top + 2, height, marginLeft: colOffset }}
                        title={`${ev.title} · ${format(ev.start, 'p')}`}
                      >
                        <p className="font-semibold truncate">{ev.title}</p>
                        <p className="opacity-90 truncate">
                          {format(ev.start, 'h:mm a')}
                          {ev.subtitle ? ` · ${ev.subtitle}` : ''}
                        </p>
                      </Link>
                    );
                  })}

                  {dayEvents.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                      Empty day — checked-in patients will land here by time.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
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
                <span className="text-xs">Set Availability</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/doctor/patients">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-xs">View Patients</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/doctor/settings">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <span className="text-xs">Edit Profile</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
