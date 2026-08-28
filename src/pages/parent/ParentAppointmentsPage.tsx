import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isValid, isFuture, isPast } from 'date-fns';
import { Calendar, Loader2, PawPrint, Star, Stethoscope, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ratingAdjective } from '@/components/schedule/weekCalendarUtils';
import { ClinicBookingModel, ClinicVisitModel, VisitStatus } from '@/services/clinicService';
import { fetchMyParentBookings, fetchMyParentVisits, rateParentVisit } from '@/services/visitService';
import { toast } from 'sonner';
import { petNameWithType } from '@/utils/petType';
import { specializationLabel } from '@/utils/specialization';
import { consultPath, isVideoConsult } from '@/utils/consult';

const ACTIVE: VisitStatus[] = ['WAITLIST', 'CHECKED_IN', 'IN_PROGRESS', 'CHECKING_OUT'];
const DONE: VisitStatus[] = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];

function visitWhen(v: ClinicVisitModel): Date | null {
  const raw = v.completedAt || v.startedAt || v.checkedInAt || v.createdAt;
  if (!raw) return null;
  const d = parseISO(raw);
  return isValid(d) ? d : null;
}

function statusLabel(status: string, source?: string): string {
  const st = (status || '').toUpperCase();
  // Walk-ins start in WAITLIST (= clinic queue). Not a declined/deferred booking.
  if (st === 'WAITLIST') {
    return source === 'WALK_IN' ? 'Waiting' : 'Waiting';
  }
  if (st === 'CHECKED_IN') return 'Checked in';
  if (st === 'IN_PROGRESS') return 'With doctor';
  if (st === 'CHECKING_OUT') return 'Checking out';
  return st.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function ProviderLines({
  clinicName,
  doctorName,
  specialization,
}: {
  clinicName?: string | null;
  doctorName?: string | null;
  specialization?: string | null;
}) {
  const doctor = doctorName
    ? `Dr. ${doctorName.replace(/^Dr\.?\s*/i, '')}`
    : null;
  const specialty = specializationLabel(specialization) || null;
  return (
    <div className="text-sm leading-snug">
      {clinicName ? (
        <div className="font-medium text-foreground">{clinicName}</div>
      ) : null}
      {doctor ? <div className="text-muted-foreground">{doctor}</div> : (
        <div className="text-muted-foreground">Doctor pending</div>
      )}
      {specialty ? <div className="text-xs text-muted-foreground">{specialty}</div> : null}
    </div>
  );
}

export default function ParentAppointmentsPage() {
  const [visits, setVisits] = useState<ClinicVisitModel[]>([]);
  const [bookings, setBookings] = useState<ClinicBookingModel[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState('current');

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

  useEffect(() => {
    if (loading) return;
    // Prefer History when there is past activity but nothing current.
    if (current.length === 0 && (history.length > 0 || pastBookings.length > 0)) {
      setTab('history');
    } else if (current.length > 0) {
      setTab('current');
    }
  }, [loading, current.length, history.length, pastBookings.length]);

  const onRated = useCallback((visitUuid: string, stars: number) => {
    setVisits((prev) => prev.map((v) => (v.uuid === visitUuid ? { ...v, parentRating: stars } : v)));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading appointments…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
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
        <Button asChild>
          <Link to="/app/book">Book appointment</Link>
        </Button>
      </div>

      {upcomingBookings.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming calendar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingBookings.slice(0, 8).map((b) => {
              const d = b.slotStart ? parseISO(b.slotStart) : null;
              return (
                <div key={b.uuid} className="flex items-start justify-between gap-3 text-sm border-b last:border-0 py-3">
                  <div className="min-w-0 space-y-1">
                    <div className="font-medium truncate">{petNameWithType(b.petName || 'Pet', b.species)}</div>
                    <ProviderLines
                      clinicName={b.clinicName || 'Clinic'}
                      doctorName={b.doctorName}
                      specialization={b.doctorSpecialization}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0 text-right">
                    {d && isValid(d) ? format(d, 'EEE d MMM · h:mm a') : '—'}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
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
            current.map((v) => <VisitCard key={v.uuid} visit={v} onRated={onRated} />)
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {upcomingBookings.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-10 text-center text-sm text-muted-foreground space-y-3">
                <p>No upcoming appointments.</p>
                <Button asChild size="sm">
                  <Link to="/app/book">Book an appointment</Link>
                </Button>
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
                <VisitCard key={v.uuid} visit={v} onRated={onRated} />
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

function VisitCard({
  visit: v,
  onRated,
}: {
  visit: ClinicVisitModel;
  onRated: (visitUuid: string, stars: number) => void;
}) {
  const when = visitWhen(v);
  const canRate = v.status === 'COMPLETED' && !!v.doctorUuid;
  const alreadyRated = v.parentRating != null && v.parentRating > 0;
  const [hover, setHover] = useState(0);
  const [picked, setPicked] = useState(v.parentRating ?? 0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPicked(v.parentRating ?? 0);
  }, [v.parentRating, v.uuid]);

  const submit = async (stars: number) => {
    if (!canRate || alreadyRated || submitting) return;
    setPicked(stars);
    setSubmitting(true);
    try {
      const result = await rateParentVisit(v.uuid, { stars });
      onRated(v.uuid, result.stars);
      toast.success(result.ratingLabel || 'Thanks for your feedback');
    } catch (err: unknown) {
      setPicked(v.parentRating ?? 0);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not submit rating';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const displayStars = alreadyRated ? picked : hover || picked;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 flex gap-3">
        <div className="mt-0.5 rounded-full bg-primary/10 p-2 h-fit">
          <Stethoscope className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="font-medium">
                {petNameWithType(v.petName, v.species)}
                {v.chart?.assessment ? ` · ${v.chart.assessment}` : v.reasonForVisit ? ` · ${v.reasonForVisit}` : ''}
              </p>
              <ProviderLines
                clinicName={v.clinicName}
                doctorName={v.doctorName}
                specialization={v.doctorSpecialization}
              />
              {v.status === 'WAITLIST' && (
                <p className="text-xs text-muted-foreground">
                  {v.source === 'WALK_IN'
                    ? 'In the clinic queue — staff will call you when ready.'
                    : 'Waiting to be seen at the clinic.'}
                </p>
              )}
            </div>
            <Badge variant="secondary">{statusLabel(v.status, v.source)}</Badge>
          </div>
          {v.chart?.examinationNotes && (
            <p className="text-xs text-muted-foreground line-clamp-3">
              Report: {v.chart.examinationNotes}
            </p>
          )}
          {v.chart?.plan && (
            <p className="text-xs text-muted-foreground line-clamp-2">Plan: {v.chart.plan}</p>
          )}
          {canRate && (
            <div className="rounded-lg bg-muted/40 px-3 py-2 space-y-1">
              <p className="text-xs font-medium text-foreground">
                {alreadyRated ? 'Your rating' : 'Rate this visit'}
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={alreadyRated || submitting}
                    className="p-0.5 disabled:cursor-default"
                    onMouseEnter={() => !alreadyRated && setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => void submit(n)}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  >
                    <Star
                      className={`h-5 w-5 ${
                        n <= displayStars
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/40'
                      }`}
                    />
                  </button>
                ))}
                {displayStars > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {ratingAdjective(displayStars)}
                  </span>
                )}
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-1" />}
              </div>
            </div>
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
            {petNameWithType(b.petName, b.species)}
          </span>
          <Badge variant="outline">{statusLabel(b.status || 'CONFIRMED')}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <p>
          {start && isValid(start) ? format(start, 'MMM d, yyyy · h:mm a') : 'Time TBD'}
          {b.mode ? ` · ${b.mode.replace(/_/g, ' ')}` : ''}
        </p>
        <ProviderLines
          clinicName={b.clinicName}
          doctorName={b.doctorName}
          specialization={b.doctorSpecialization}
        />
        {b.notes && <p className="text-xs">{b.notes}</p>}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {isVideoConsult(b.mode) && (
            <Button size="sm" asChild>
              <Link to={consultPath(b.uuid, 'parent')}>
                <Video className="h-4 w-4 mr-1" />
                Join video
              </Link>
            </Button>
          )}
          {b.petUuid && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
              <Link to={`/app/pets/${b.petUuid}`}>Open pet</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
