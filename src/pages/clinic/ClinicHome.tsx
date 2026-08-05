import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar, Users, Stethoscope, ArrowRight, Bell, Activity, Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isToday, parseISO } from 'date-fns';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import {
  ClinicBookingModel,
  ClinicDoctorModel,
  ClinicPatientModel,
  RetentionAlertModel,
  fetchClinicBookings,
  fetchClinicDoctors,
  fetchClinicPatients,
  fetchClinicStats,
  fetchRetentionAlerts,
} from '@/services/clinicService';
import { cn } from '@/lib/utils';

export default function ClinicHome() {
  const { clinic, clinicUuid, loading: clinicLoading } = useActiveClinic();
  const [doctors, setDoctors] = useState<ClinicDoctorModel[]>([]);
  const [patients, setPatients] = useState<ClinicPatientModel[]>([]);
  const [bookings, setBookings] = useState<ClinicBookingModel[]>([]);
  const [alerts, setAlerts] = useState<RetentionAlertModel[]>([]);
  const [diagnosedCount, setDiagnosedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicUuid) {
      setLoading(false);
      setDoctors([]);
      setPatients([]);
      setBookings([]);
      setAlerts([]);
      setDiagnosedCount(0);
      return;
    }
    let cancelled = false;
    setDoctors([]);
    setPatients([]);
    setBookings([]);
    setAlerts([]);
    setDiagnosedCount(0);
    (async () => {
      setLoading(true);
      try {
        const [d, p, b, a, stats] = await Promise.all([
          fetchClinicDoctors(clinicUuid),
          fetchClinicPatients(clinicUuid),
          fetchClinicBookings(clinicUuid),
          fetchRetentionAlerts(clinicUuid),
          fetchClinicStats(clinicUuid),
        ]);
        if (cancelled) return;
        setDoctors(d);
        setPatients(p);
        setBookings(b?.models ?? []);
        setAlerts(a);
        setDiagnosedCount(stats?.diagnosedPetCount ?? 0);
      } catch {
        if (cancelled) return;
        setDoctors([]);
        setPatients([]);
        setBookings([]);
        setAlerts([]);
        setDiagnosedCount(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clinicUuid]);

  const todayBookings = bookings.filter((b) => {
    try {
      return isToday(parseISO(b.slotStart));
    } catch {
      return false;
    }
  });

  const openAlerts = alerts.filter((a) => a.status === 'OPEN' || a.status === 'open').length;

  const stats = [
    {
      label: "Today's Appointments",
      value: todayBookings.length,
      sub: 'Scheduled visits',
      icon: Calendar,
      to: '/clinic/appointments',
      color: 'from-primary/10 to-accent',
      iconColor: 'bg-primary text-primary-foreground shadow-md shadow-primary/25',
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
    {
      label: 'Retention Alerts',
      value: openAlerts,
      sub: 'Need follow-up',
      icon: Bell,
      to: '/clinic/retention',
      color: 'from-destructive/10 to-accent',
      iconColor: 'bg-destructive/15 text-destructive',
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
          <Link to="/clinic/retention">
            <Bell className="h-4 w-4 mr-2" />
            Retention
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

      <div className="relative grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} to={s.to} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
              <Card
                className={cn(
                  'border-0 shadow-sm bg-gradient-to-br overflow-hidden transition-all duration-300',
                  'group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-primary/10',
                  s.color
                )}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                        {s.label}
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-foreground mt-2 tabular-nums">
                        {loading ? '—' : s.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
                        {s.sub}
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </p>
                    </div>
                    <div
                      className={cn(
                        'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110',
                        s.iconColor
                      )}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Today&apos;s Schedule</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/clinic/appointments" className="text-primary">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading || clinicLoading ? (
              <p className="text-sm text-muted-foreground">Loading schedule…</p>
            ) : todayBookings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">No appointments scheduled for today at this branch.</p>
                <Button variant="link" asChild className="mt-1">
                  <Link to="/clinic/appointments">Open appointments</Link>
                </Button>
              </div>
            ) : (
              todayBookings.slice(0, 5).map((apt) => (
                <div
                  key={apt.uuid}
                  className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{apt.petName}</p>
                    <p className="text-xs text-muted-foreground truncate">{apt.ownerName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">{format(parseISO(apt.slotStart), 'h:mm a')}</p>
                    <Badge variant="secondary" className="text-[10px]">{apt.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-b from-accent to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Retention</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/clinic/retention" className="text-primary">
                Open
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.slice(0, 4).map((a) => (
              <Link
                key={a.id}
                to="/clinic/retention"
                className="block p-3 rounded-xl bg-background/80 border border-border hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <p className="text-sm font-medium">{a.petName}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.message}</p>
              </Link>
            ))}
            {!loading && alerts.length === 0 && (
              <p className="text-sm text-muted-foreground">No open retention alerts for this branch.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
