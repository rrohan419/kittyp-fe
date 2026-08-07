import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isValid, isFuture, isPast } from 'date-fns';
import { Calendar, Loader2, PawPrint, Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClinicBookingModel, ClinicVisitModel, VisitStatus } from '@/services/clinicService';
import { fetchMyParentBookings, fetchMyParentVisits } from '@/services/visitService';
import { toast } from 'sonner';

const ACTIVE: VisitStatus[] = ['WAITLIST', 'CHECKED_IN', 'IN_PROGRESS', 'CHECKING_OUT'];
const DONE: VisitStatus[] = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];

function visitWhen(v: ClinicVisitModel): Date | null {
  const raw = v.completedAt || v.startedAt || v.checkedInAt || v.createdAt;
  if (!raw) return null;
  const d = parseISO(raw);
  return isValid(d) ? d : null;
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ParentAppointmentsPage() {
  const [visits, setVisits] = useState<ClinicVisitModel[]>([]);
  const [bookings, setBookings] = useState<ClinicBookingModel[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [v, b] = await Promise.all([
        fetchMyParentVisits(),
        fetchMyParentBookings().catch(() => [] as ClinicBookingModel[]),
      ]);
      setVisits(v);
      setBookings(b);
    } catch {
      if (!quiet) {
        setVisits([]);
        setBookings([]);
        toast.error('Could not load appointments');
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
    const t = setInterval(() => void load(true), 15000);
    const onFocus = () => void load(true);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  const current = useMemo(() => visits.filter((v) => ACTIVE.includes(v.status)), [visits]);
  const history = useMemo(() => visits.filter((v) => DONE.includes(v.status)), [visits]);
  const upcomingBookings = useMemo(
    () =>
      bookings.filter((b) => {
        if (!b.slotStart) return false;
        const st = (b.status || '').toUpperCase();
        if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(st)) return false;
        const d = parseISO(b.slotStart);
        return isValid(d) && (isFuture(d) || !isPast(d));
      }),
    [bookings]
  );
  const pastBookings = useMemo(
    () =>
      bookings.filter((b) => {
        if (!b.slotStart) return true;
        const st = (b.status || '').toUpperCase();
        if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(st)) return true;
        const d = parseISO(b.slotStart);
        return isValid(d) && isPast(d);
      }),
    [bookings]
  );

  if (loading) {
    return (
      <div className="p-8 flex justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading appointments…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          Appointments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Current clinic visits, upcoming bookings, and past reports — updates live when the clinic
          or doctor changes status.
        </p>
      </div>

      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Current ({current.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
          <TabsTrigger value="history">History ({history.length + pastBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4 space-y-3">
          {current.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No active visits. When you walk in or check in, the visit appears here.
              </CardContent>
            </Card>
          ) : (
            current.map((v) => <VisitCard key={v.uuid} visit={v} />)
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {upcomingBookings.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-10 text-center text-sm text-muted-foreground space-y-3">
                <p>No upcoming scheduled bookings.</p>
                <p className="text-xs">Walk-in visits show under Current once you arrive at the clinic.</p>
              </CardContent>
            </Card>
          ) : (
            upcomingBookings.map((b) => <BookingCard key={b.uuid} booking={b} />)
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-3">
          {history.length === 0 && pastBookings.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No past appointments yet. Completed visits include diagnosis and report.
              </CardContent>
            </Card>
          ) : (
            <>
              {history.map((v) => (
                <VisitCard key={v.uuid} visit={v} />
              ))}
              {pastBookings.map((b) => (
                <BookingCard key={b.uuid} booking={b} />
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VisitCard({ visit: v }: { visit: ClinicVisitModel }) {
  const when = visitWhen(v);
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 flex gap-3">
        <div className="mt-0.5 rounded-full bg-primary/10 p-2 h-fit">
          <Stethoscope className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">
                {v.petName}
                {v.chart?.assessment ? ` · ${v.chart.assessment}` : v.reasonForVisit ? ` · ${v.reasonForVisit}` : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                {v.doctorName
                  ? `Dr. ${v.doctorName.replace(/^Dr\.?\s*/i, '')}`
                  : 'Doctor pending'}
                {v.clinicName ? ` · ${v.clinicName}` : ''}
              </p>
            </div>
            <Badge variant="secondary">{statusLabel(v.status)}</Badge>
          </div>
          {v.chart?.examinationNotes && (
            <p className="text-xs text-muted-foreground line-clamp-3">
              Report: {v.chart.examinationNotes}
            </p>
          )}
          {v.chart?.plan && (
            <p className="text-xs text-muted-foreground line-clamp-2">Plan: {v.chart.plan}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {when ? format(when, 'MMM d, yyyy · h:mm a') : '—'}
            </span>
            {v.source === 'WALK_IN' && <span>· Walk-in</span>}
            {v.petUuid && (
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                <Link to={`/app/pets/${v.petUuid}`}>Pet history</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingCard({ booking: b }: { booking: ClinicBookingModel }) {
  const start = b.slotStart ? parseISO(b.slotStart) : null;
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 truncate">
            <PawPrint className="h-4 w-4 text-primary shrink-0" />
            {b.petName}
          </span>
          <Badge variant="outline">{statusLabel(b.status || 'SCHEDULED')}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-1">
        <p>
          {start && isValid(start) ? format(start, 'MMM d, yyyy · h:mm a') : 'Time TBD'}
          {b.mode ? ` · ${b.mode}` : ''}
        </p>
        {b.notes && <p className="text-xs">{b.notes}</p>}
        {b.petUuid && (
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
            <Link to={`/app/pets/${b.petUuid}`}>Open pet</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
