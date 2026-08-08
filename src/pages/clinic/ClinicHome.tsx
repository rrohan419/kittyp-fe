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
import { Calendar, Users, Stethoscope, Activity, Sparkles, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  addDays,
  format,
  parseISO,
  startOfDay,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
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
} from '@/services/clinicService';
import { WeekCalendar } from '@/components/schedule/WeekCalendar';
import {
  WeekCalEvent,
  buildWeekEvents,
  ratingAdjective,
} from '@/components/schedule/weekCalendarUtils';
import { cn } from '@/lib/utils';

export default function ClinicHome() {
  const { clinic, clinicUuid, loading: clinicLoading } = useActiveClinic();
  const [doctors, setDoctors] = useState<ClinicDoctorModel[]>([]);
  const [patients, setPatients] = useState<ClinicPatientModel[]>([]);
  const [bookings, setBookings] = useState<ClinicBookingModel[]>([]);
  const [visits, setVisits] = useState<ClinicVisitModel[]>([]);
  const [diagnosedCount, setDiagnosedCount] = useState(0);
  const [clinicRating, setClinicRating] = useState<number | null>(null);
  const [clinicReviewsCount, setClinicReviewsCount] = useState(0);
  const [clinicRatingLabel, setClinicRatingLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekAnchor, setWeekAnchor] = useState(() => startOfDay(new Date()));
  const [selected, setSelected] = useState<WeekCalEvent | null>(null);

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
      setClinicRating(null);
      setClinicReviewsCount(0);
      setClinicRatingLabel(null);
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
      setClinicRating(stats?.clinicRating ?? null);
      setClinicReviewsCount(stats?.clinicReviewsCount ?? 0);
      setClinicRatingLabel(stats?.clinicRatingLabel ?? null);
    } catch {
      setDoctors([]);
      setPatients([]);
      setBookings([]);
      setVisits([]);
      setDiagnosedCount(0);
      setClinicRating(null);
      setClinicReviewsCount(0);
      setClinicRatingLabel(null);
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

  const ratingLabel = clinicRatingLabel || ratingAdjective(clinicRating);
  const stats = [
    {
      label: 'Clinic rating',
      value:
        clinicRating != null && clinicReviewsCount > 0 ? clinicRating.toFixed(1) : '—',
      sub: clinicReviewsCount > 0 ? `${ratingLabel} · ${clinicReviewsCount} reviews` : 'Not rated yet',
      icon: Star,
      to: '/clinic/doctors',
      color: 'from-amber-500/10 to-accent',
      iconColor: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
    },
    {
      label: 'Doctors',
      value: doctors.length,
      sub: 'On roster',
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
    <div className="relative p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-16 w-56 h-56 rounded-full bg-accent blur-3xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary mb-2 px-2.5 py-1 rounded-full bg-primary/10">
            <Sparkles className="h-3.5 w-3.5" />
            Live branch dashboard
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            {clinic?.name ?? 'Clinic Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
            {clinic?.name ? ` · Showing only ${clinic.name}` : ''}
          </p>
        </div>
        <Button asChild size="sm" className="shadow-md shadow-primary/20">
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

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Week calendar
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Visits and scheduled appointments for this branch. Click a slot for details.
          </p>
        </CardHeader>
        <CardContent>
          <WeekCalendar
            events={weekEvents}
            weekAnchor={weekAnchor}
            onWeekAnchorChange={setWeekAnchor}
            loading={loading}
            onEventClick={setSelected}
            emptyLabel="No visits or bookings this week — use Appointments to add one."
            doctors={doctors
              .filter((d) => d.isActive !== false && d.doctorUuid)
              .map((d) => ({ doctorUuid: d.doctorUuid, name: d.name || d.email || 'Doctor' }))}
          />
        </CardContent>
      </Card>

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
