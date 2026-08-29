import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Stethoscope, Activity, AlertTriangle } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/module/store/store';
import { ROLES, hasRole } from '@/utils/roles';
import {
  addDays,
  format,
  parseISO,
  startOfDay,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  isSameDay,
} from 'date-fns';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import {
  ClinicBookingModel,
  ClinicDoctorModel,
  ClinicPatientModel,
  ClinicVisitModel,
  fetchClinicBookings,
  fetchClinicDoctors,
  fetchClinicPatients,
  fetchClinicStats,
  fetchClinicVisits,
  isClinicActivated,
  CLINIC_NOT_ACTIVATED_MESSAGE,
} from '@/services/clinicService';
import { WeekCalendar } from '@/components/schedule/WeekCalendar';
import { WeekCalEvent, buildWeekEvents, visitEventTime } from '@/components/schedule/weekCalendarUtils';
import { DashboardAppointmentRow } from '@/components/schedule/DashboardAppointmentRow';
import { cn } from '@/lib/utils';
import { petNameWithType } from '@/utils/petType';
import { isUrgentVisit } from '@/utils/visitUrgency';
import { WalkInDialog } from '@/components/clinic/WalkInDialog';
import { toast } from 'sonner';

export default function ClinicHome() {
  const { clinic, clinicUuid, loading: clinicLoading } = useActiveClinic();
  const [doctors, setDoctors] = useState<ClinicDoctorModel[]>([]);
  const [patients, setPatients] = useState<ClinicPatientModel[]>([]);
  const [bookings, setBookings] = useState<ClinicBookingModel[]>([]);
  const [visits, setVisits] = useState<ClinicVisitModel[]>([]);
  const [diagnosedCount, setDiagnosedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [weekAnchor, setWeekAnchor] = useState(() => startOfDay(new Date()));
  const [selected, setSelected] = useState<WeekCalEvent | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addSlot, setAddSlot] = useState<Date | null>(null);
  const clinicActivated = isClinicActivated(clinic?.status);

  const weekStart = useMemo(
    () => startOfWeek(weekAnchor, { weekStartsOn: 1 }),
    [weekAnchor]
  );
  const weekEnd = useMemo(() => endOfWeek(weekAnchor, { weekStartsOn: 1 }), [weekAnchor]);

  const load = useCallback(async () => {
    if (!clinicUuid) {
      setLoading(false);
      setDoctors([]);
      setPatients([]);
      setBookings([]);
      setVisits([]);
      setDiagnosedCount(0);
      return;
    }
    setLoading(true);
    try {
      const days = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'));
      const [docs, pats, bookingPage, stats, ...dayVisits] = await Promise.all([
        fetchClinicDoctors(clinicUuid),
        fetchClinicPatients(clinicUuid),
        fetchClinicBookings(clinicUuid, 0, 200),
        fetchClinicStats(clinicUuid),
        ...days.map((date) => fetchClinicVisits(clinicUuid, { date }).catch(() => [] as ClinicVisitModel[])),
      ]);
      const visitMap = new Map<string, ClinicVisitModel>();
      for (const list of dayVisits as ClinicVisitModel[][]) {
        for (const v of list) visitMap.set(v.uuid, v);
      }
      setDoctors(docs);
      setPatients(pats);
      setBookings(bookingPage?.models ?? []);
      setVisits([...visitMap.values()]);
      setDiagnosedCount(stats?.diagnosedPetCount ?? 0);
    } catch {
      setDoctors([]);
      setPatients([]);
      setBookings([]);
      setVisits([]);
      setDiagnosedCount(0);
    } finally {
      setLoading(false);
    }
  }, [clinicUuid, weekStart, weekEnd]);

  useEffect(() => {
    void load();
  }, [load]);

  const weekEvents = useMemo(() => {
    const range = { start: weekStart, end: weekEnd };
    const weekVisits = visits.filter((v) => {
      const raw = v.startedAt || v.checkedInAt || v.createdAt;
      if (!raw) return false;
      try {
        return isWithinInterval(parseISO(raw), range);
      } catch {
        return false;
      }
    });
    const weekBookings = bookings.filter((b) => {
      if (!b.slotStart) return false;
      try {
        return isWithinInterval(parseISO(b.slotStart), range);
      } catch {
        return false;
      }
    });
    return buildWeekEvents(weekVisits, weekBookings);
  }, [visits, bookings, weekStart, weekEnd]);

  const urgentToday = useMemo(() => {
    const today = startOfDay(new Date());
    return visits
      .filter((v) => {
        if (!isUrgentVisit(v.urgency)) return false;
        if (v.status === 'COMPLETED' || v.status === 'CANCELLED' || v.status === 'NO_SHOW') return false;
        return isSameDay(visitEventTime(v).start, today);
      })
      .sort((a, b) => visitEventTime(a).start.getTime() - visitEventTime(b).start.getTime());
  }, [visits]);

  const stats = [
    {
      label: 'Urgent today',
      value: urgentToday.length,
      sub: 'Needs attention first',
      icon: AlertTriangle,
      to: '/clinic/appointments',
      color: 'from-rose-500/10 to-rose-500/5',
      iconColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
    },
    {
      label: 'Profile',
      value: doctors.length,
      sub: 'Doctors on roster',
      icon: Stethoscope,
      to: '/clinic/doctors',
      color: 'from-primary/5 to-muted',
      iconColor: 'bg-primary/15 text-primary',
    },
    {
      label: 'Clients & Pets',
      value: patients.length,
      sub: 'This branch only',
      icon: Users,
      to: '/clinic/patients',
      color: 'from-accent to-primary/5',
      iconColor: 'bg-primary text-primary-foreground shadow-md shadow-primary/25',
    },
    {
      label: 'Diagnosed Pets',
      value: diagnosedCount,
      sub: 'With health records',
      icon: Activity,
      to: '/clinic/patients?tab=pets',
      color: 'from-muted to-accent',
      iconColor: 'bg-primary/15 text-primary',
    },
  ];

  return (
    <div className="relative px-4 pt-0 pb-4 sm:px-5 sm:pt-0 sm:pb-5 lg:px-6 lg:pt-1 lg:pb-6 max-w-7xl mx-auto space-y-3 lg:space-y-4 overflow-x-hidden">
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-16 w-56 h-56 rounded-full bg-accent blur-3xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground leading-tight">
            {clinic?.name ?? 'Clinic Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-0 text-sm">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
            {clinic?.name ? ` · Showing only ${clinic.name}` : ''}
          </p>
        </div>
        <Button asChild size="sm" className="shadow-md shadow-primary/20 shrink-0">
          <Link to="/clinic/appointments">
            <Calendar className="h-4 w-4 mr-2" />
            Appointments board
          </Link>
        </Button>
      </div>

      {clinic?.status === 'SHUTDOWN' && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-200">
          This clinic is shut down. You can view history but cannot add records or make changes.
        </div>
      )}

      {clinic && clinic.status !== 'SHUTDOWN' && clinic.status !== 'VERIFIED' && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50/50 px-4 py-3 text-sm text-amber-800">
          This clinic is {clinic.status === 'REJECTED' ? 'rejected' : 'pending admin verification'}.
          Appointments, bookings, and doctor invites stay locked until an admin verifies it.
        </div>
      )}

      {!clinicUuid && !clinicLoading && (
        <div className="rounded-xl border border-dashed border-amber-300/60 bg-amber-50/50 px-4 py-3 text-sm text-amber-800">
          Select or create a clinic branch to see live data.
        </div>
      )}

      <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              to={s.to}
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
            >
              <Card
                className={cn(
                  'border-0 shadow-sm bg-gradient-to-br overflow-hidden transition-all duration-300',
                  s.color,
                  'group-hover:shadow-md'
                )}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={cn('rounded-xl p-2.5', s.iconColor)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{loading ? '—' : s.value}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{s.sub}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

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
              return (
                <DashboardAppointmentRow
                  key={v.uuid}
                  time={format(start, 'h:mm a')}
                  title={petNameWithType(v.petName, v.species)}
                  subtitle={[v.ownerName || 'Owner', v.doctorName].filter(Boolean).join(' · ')}
                  urgent
                  status={v.status}
                  onClick={() =>
                    setSelected({
                      id: `visit-${v.uuid}`,
                      kind: 'visit',
                      title: v.petName,
                      subtitle: v.ownerName || 'Owner',
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

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Week calendar
          </CardTitle>
          {!clinic?.personal && (
            <p className="text-sm text-muted-foreground">
              Visits and scheduled appointments for this branch. Click an empty time to book, or a
              slot for details.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <WeekCalendar
            events={weekEvents}
            weekAnchor={weekAnchor}
            onWeekAnchorChange={setWeekAnchor}
            loading={loading}
            onEventClick={setSelected}
            onSlotClick={(start) => {
              if (!clinicUuid || clinic?.status === 'SHUTDOWN') {
                toast.error('This clinic cannot take new appointments');
                return;
              }
              if (!clinicActivated) {
                toast.error(CLINIC_NOT_ACTIVATED_MESSAGE);
                return;
              }
              setAddSlot(start);
              setAddOpen(true);
            }}
            emptyLabel="No visits or bookings this week — click an empty time to book."
            doctors={
              clinic?.personal
                ? undefined
                : doctors
                    .filter((d) => d.isActive !== false && d.doctorUuid)
                    .map((d) => ({ doctorUuid: d.doctorUuid, name: d.name || d.email || 'Doctor' }))
            }
          />
        </CardContent>
      </Card>

      {clinicUuid && (
        <WalkInDialog
          open={addOpen}
          onOpenChange={(o) => {
            setAddOpen(o);
            if (!o) setAddSlot(null);
          }}
          clinicUuid={clinicUuid}
          doctors={doctors}
          initialSlotStart={addSlot}
          onCreated={load}
        />
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selected?.kind === 'booking' ? 'Scheduled' : 'Visit'} · {selected?.title}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">When:</span> {format(selected.start, 'PPp')}
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span>{' '}
                <Badge variant="outline">{selected.status}</Badge>
              </p>
              <p>
                <span className="text-muted-foreground">Details:</span> {selected.subtitle}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button asChild>
              <Link to="/clinic/appointments">Open board</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ClinicPortalHome() {
  const { user } = useSelector((s: RootState) => s.authReducer);
  if (hasRole(user?.roles, ROLES.CLINIC_STAFF) && !hasRole(user?.roles, ROLES.CLINIC_ADMIN)) {
    return <Navigate to="/clinic/appointments" replace />;
  }
  return <ClinicHome />;
}
