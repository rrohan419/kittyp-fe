import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar, Users, Stethoscope, ArrowRight, Bell, Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isToday, parseISO } from 'date-fns';
import { ClinicSwitcher } from '@/components/clinic/ClinicSwitcher';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import {
  ClinicBookingModel,
  ClinicDoctorModel,
  ClinicPatientModel,
  RetentionAlertModel,
  fetchClinicBookings,
  fetchClinicDoctors,
  fetchClinicPatients,
  fetchRetentionAlerts,
} from '@/services/clinicService';
import { mockAppointments, mockDoctors } from '@/data/mockClinic';

export default function ClinicHome() {
  const { clinic, clinicUuid, loading: clinicLoading } = useActiveClinic();
  const [doctors, setDoctors] = useState<ClinicDoctorModel[]>([]);
  const [patients, setPatients] = useState<ClinicPatientModel[]>([]);
  const [bookings, setBookings] = useState<ClinicBookingModel[]>([]);
  const [alerts, setAlerts] = useState<RetentionAlertModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    if (!clinicUuid) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [d, p, b, a] = await Promise.all([
          fetchClinicDoctors(clinicUuid),
          fetchClinicPatients(clinicUuid),
          fetchClinicBookings(clinicUuid),
          fetchRetentionAlerts(clinicUuid),
        ]);
        if (cancelled) return;
        setDoctors(d);
        setPatients(p);
        setBookings(b?.models ?? []);
        setAlerts(a);
        setUsingFallback(false);
      } catch {
        if (cancelled) return;
        setUsingFallback(true);
        setDoctors([]);
        setPatients([]);
        setBookings([]);
        setAlerts([]);
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
  const showMock = usingFallback || (!loading && !clinicLoading && !clinicUuid);

  const scheduleSource = showMock
    ? mockAppointments.filter((a) => a.date === 'Today').slice(0, 5)
    : todayBookings.slice(0, 5);

  const stats = [
    {
      label: "Today's Appointments",
      value: showMock ? mockAppointments.filter((a) => a.date === 'Today').length : todayBookings.length,
      sub: 'Scheduled visits',
      icon: Calendar,
      color: 'from-primary/5 to-primary/10',
      iconColor: 'bg-primary/10 text-primary',
    },
    {
      label: 'Doctors',
      value: showMock ? mockDoctors.length : doctors.length,
      sub: 'On roster',
      icon: Stethoscope,
      color: 'from-green-500/5 to-green-500/10',
      iconColor: 'bg-green-500/10 text-green-600',
    },
    {
      label: 'Patients',
      value: showMock ? 328 : patients.length,
      sub: 'Linked pets',
      icon: Users,
      color: 'from-violet-500/5 to-violet-500/10',
      iconColor: 'bg-violet-500/10 text-violet-600',
    },
    {
      label: 'Retention Alerts',
      value: showMock ? 3 : openAlerts,
      sub: 'Need follow-up',
      icon: Bell,
      color: 'from-amber-500/5 to-amber-500/10',
      iconColor: 'bg-amber-500/10 text-amber-600',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            {clinic?.name ?? 'Clinic Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} — Multi-clinic CRM overview
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ClinicSwitcher />
          <Button asChild size="sm">
            <Link to="/clinic/retention">
              <Bell className="h-4 w-4 mr-2" />
              Retention
            </Link>
          </Button>
        </div>
      </div>

      {showMock && (
        <div className="rounded-lg border border-dashed border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <Activity className="h-4 w-4 shrink-0" />
          Showing sample data until clinic records are available for this account.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`border-0 shadow-sm bg-gradient-to-br ${s.color}`}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                      {s.label}
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground mt-2">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{s.sub}</p>
                  </div>
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${s.iconColor} flex items-center justify-center shrink-0`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Today&apos;s Schedule</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/clinic/appointments" className="text-primary">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading schedule…</p>
            ) : scheduleSource.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments scheduled for today.</p>
            ) : showMock ? (
              (scheduleSource as typeof mockAppointments).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{apt.petName} · {apt.type}</p>
                    <p className="text-xs text-muted-foreground truncate">{apt.ownerName} → {apt.doctorName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">{apt.time}</p>
                    <Badge variant="secondary" className="text-[10px]">{apt.status}</Badge>
                  </div>
                </div>
              ))
            ) : (
              todayBookings.slice(0, 5).map((apt) => (
                <div key={apt.uuid} className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{apt.petName}</p>
                    <p className="text-xs text-muted-foreground truncate">{apt.ownerName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">
                      {format(parseISO(apt.slotStart), 'h:mm a')}
                    </p>
                    <Badge variant="secondary" className="text-[10px]">{apt.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Retention</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/clinic/retention" className="text-primary">Open</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {(showMock
              ? [
                  { id: '1', petName: 'Whiskers', message: 'Rabies booster due in 3 months' },
                  { id: '2', petName: 'Buddy', message: 'DHPP booster overdue' },
                ]
              : alerts.slice(0, 4)
            ).map((a) => (
              <div key={a.id} className="p-3 rounded-xl bg-muted/50">
                <p className="text-sm font-medium">{a.petName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {'message' in a ? a.message : ''}
                </p>
              </div>
            ))}
            {!showMock && alerts.length === 0 && (
              <p className="text-sm text-muted-foreground">No open retention alerts.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
