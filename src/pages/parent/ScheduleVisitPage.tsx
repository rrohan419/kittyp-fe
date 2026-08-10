import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { format, parseISO, isValid } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Loader2,
  MapPin,
  Navigation,
  Search,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { RootState } from '@/module/store/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DiscoverClinicCard,
  DiscoverDoctorCard,
  createParentBooking,
  discoverClinics,
  discoverPersonalDoctors,
  fetchParentDoctorSlots,
} from '@/services/discoverService';
import { isAxiosError } from 'axios';

type Step = 'search' | 'book';

type NestedPractice = {
  key: string;
  clinicUuid: string;
  name: string;
  distanceKm?: number | null;
  personal: boolean;
  doctors: DiscoverDoctorCard[];
};

function apiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; detailMessage?: string; detailedMessage?: string; error?: string }
      | undefined;
    const msg =
      data?.detailedMessage ||
      data?.detailMessage ||
      data?.message ||
      data?.error ||
      err.message;
    if (msg && !/unexpected error occurred/i.test(msg)) {
      return msg;
    }
    if (err.response?.status === 404) {
      return 'Booking service is unavailable — restart the backend and try again';
    }
    return fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

function specialtyLabel(value?: string | null): string | null {
  if (!value) return null;
  return value.replace(/_/g, ' ');
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const r = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * r * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function ScheduleVisitPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((s: RootState) => s.authReducer);
  const pets = user?.ownerPets ?? [];

  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'pending' | 'ok' | 'denied'>('idle');
  const [loading, setLoading] = useState(false);
  const [clinics, setClinics] = useState<DiscoverClinicCard[]>([]);
  const [personalDoctors, setPersonalDoctors] = useState<DiscoverDoctorCard[]>([]);
  const [clinic, setClinic] = useState<DiscoverClinicCard | null>(null);
  const [doctor, setDoctor] = useState<DiscoverDoctorCard | null>(null);
  const [selectedDoctorKey, setSelectedDoctorKey] = useState<string | null>(null);
  const [petUuid, setPetUuid] = useState(searchParams.get('petId') || pets[0]?.uuid || '');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState<string[]>([]);
  const [slotStart, setSlotStart] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const coordsRef = useRef(coords);
  coordsRef.current = coords;

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const search = useCallback(async (opts?: { lat?: number; lng?: number; quiet?: boolean }) => {
    setLoading(true);
    const params = {
      lat: opts?.lat ?? coordsRef.current?.lat,
      lng: opts?.lng ?? coordsRef.current?.lng,
      q: debouncedQuery || undefined,
      radiusKm: 40,
    };
    try {
      const [clinicList, doctorList] = await Promise.all([
        discoverClinics(params),
        discoverPersonalDoctors(params).catch(() => [] as DiscoverDoctorCard[]),
      ]);
      setClinics(clinicList);
      setPersonalDoctors(doctorList);
      if (!opts?.quiet && !clinicList.length && !doctorList.length) {
        toast.message('No clinics or doctors found — try another name');
      }
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Could not load clinics'));
      setClinics([]);
      setPersonalDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery]);

  const searchRef = useRef(search);
  searchRef.current = search;

  const applyPosition = useCallback((lat: number, lng: number) => {
    const next = { lat, lng };
    const prev = lastCoordsRef.current;
    const moved = !prev || haversineMeters(prev, next) >= 100;
    if (!moved) {
      setGeoStatus('ok');
      return;
    }
    lastCoordsRef.current = next;
    setCoords(next);
    setGeoStatus('ok');
    void searchRef.current({ lat, lng, quiet: true });
  }, []);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      toast.message('Location unavailable on this device');
      return;
    }
    setGeoStatus('pending');
    stopWatch();
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        applyPosition(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setGeoStatus('denied');
        const denied = err.code === err.PERMISSION_DENIED;
        toast.message(
          denied
            ? 'Location blocked — enable it in browser settings, then tap the location icon'
            : 'Could not get location — you can still search by name'
        );
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    );
  }, [applyPosition, stopWatch]);

  // Initial load + watch while on search step
  useEffect(() => {
    if (step !== 'search') {
      stopWatch();
      return;
    }
    void search({ quiet: true });
    const perms = navigator.permissions;
    if (perms?.query) {
      perms
        .query({ name: 'geolocation' as PermissionName })
        .then((status) => {
          if (status.state === 'granted') {
            startWatch();
          } else if (status.state === 'denied') {
            setGeoStatus('denied');
          }
        })
        .catch(() => {
          /* ignore */
        });
    }
    return () => stopWatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount / step gated
  }, [step]);

  // Debounced query refresh
  useEffect(() => {
    if (step !== 'search') return;
    void search({ quiet: true });
  }, [debouncedQuery, search, step]);

  const practices = useMemo(() => {
    const branch: NestedPractice[] = clinics
      .filter((c) => !c.personal && (c.doctors?.length ?? 0) > 0)
      .map((c) => ({
        key: `clinic-${c.clinicUuid}`,
        clinicUuid: c.clinicUuid,
        name: c.name,
        distanceKm: c.distanceKm,
        personal: false,
        doctors: c.doctors ?? [],
      }));

    const personalByClinic = new Map<string, NestedPractice>();
    for (const d of personalDoctors) {
      const existing = personalByClinic.get(d.clinicUuid);
      if (existing) {
        existing.doctors.push(d);
        continue;
      }
      personalByClinic.set(d.clinicUuid, {
        key: `personal-${d.clinicUuid}`,
        clinicUuid: d.clinicUuid,
        name: d.clinicName || 'Personal practice',
        distanceKm: d.distanceKm,
        personal: true,
        doctors: [d],
      });
    }

    return [...personalByClinic.values(), ...branch]
      .filter((p) => p.doctors.length > 0)
      .sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return a.name.localeCompare(b.name);
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
  }, [clinics, personalDoctors]);

  const openDoctor = (practice: NestedPractice, d: DiscoverDoctorCard) => {
    setSelectedDoctorKey(`${practice.clinicUuid}:${d.doctorUuid}`);
    setClinic({
      clinicUuid: practice.clinicUuid,
      name: practice.name,
      personal: practice.personal,
      distanceKm: practice.distanceKm,
    });
    setDoctor(d);
    setSlotStart('');
    setStep('book');
  };

  useEffect(() => {
    if (step !== 'book' || !clinic || !doctor || !date) return;
    let cancelled = false;
    setLoadingSlots(true);
    fetchParentDoctorSlots(clinic.clinicUuid, doctor.doctorUuid, date)
      .then((s) => {
        if (!cancelled) {
          setSlots(s);
          setSlotStart('');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSlots([]);
          toast.error('Could not load available slots');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, clinic, doctor, date]);

  const slotLabels = useMemo(
    () =>
      slots.map((raw) => {
        const d = parseISO(raw);
        return { raw, label: isValid(d) ? format(d, 'h:mm a') : raw };
      }),
    [slots]
  );

  const confirm = async () => {
    if (!clinic || !doctor || !petUuid || !slotStart) {
      toast.error('Pick a pet and an available time');
      return;
    }
    setBooking(true);
    try {
      await createParentBooking({
        clinicUuid: clinic.clinicUuid,
        doctorUuid: doctor.doctorUuid,
        petUuid,
        slotStart,
        notes: notes.trim() || undefined,
        mode: 'IN_PERSON',
      });
      toast.success('Appointment booked');
      navigate('/app/appointments');
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Could not book this slot'));
      if (clinic && doctor) {
        try {
          setSlots(await fetchParentDoctorSlots(clinic.clinicUuid, doctor.doctorUuid, date));
        } catch {
          /* ignore */
        }
      }
    } finally {
      setBooking(false);
    }
  };

  const goBack = (e: React.MouseEvent) => {
    if (step === 'book') {
      e.preventDefault();
      setStep('search');
      setDoctor(null);
      setClinic(null);
      setSelectedDoctorKey(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-0.5">
          <Link to={step === 'search' ? '/app/appointments' : '#'} onClick={goBack}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Book appointment</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search a clinic or doctor, then pick a slot for your pet
          </p>
        </div>
      </div>

      {step === 'search' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clinics or doctors"
                className="pl-9 h-11"
                aria-label="Search clinics or doctors"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                'h-11 w-11 shrink-0',
                geoStatus === 'ok' && 'border-primary text-primary',
                geoStatus === 'denied' && 'text-muted-foreground'
              )}
              onClick={startWatch}
              disabled={geoStatus === 'pending'}
              title={
                geoStatus === 'ok'
                  ? 'Location on — tap to refresh'
                  : geoStatus === 'denied'
                    ? 'Location blocked — enable in browser settings'
                    : 'Use my location'
              }
              aria-label="Toggle location"
            >
              {geoStatus === 'pending' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : geoStatus === 'ok' ? (
                <Navigation className="h-4 w-4" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="rounded-xl border bg-card">
            {loading && (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Finding care near you…
              </div>
            )}

            {!loading && practices.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No clinics or doctors to show. Try another name
                {geoStatus !== 'ok' ? ', or enable location' : ''}.
              </div>
            )}

            {!loading &&
              practices.map((practice) => (
                <div key={practice.key} className="border-b last:border-b-0">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span
                      className="h-4 w-4 rounded-full border-2 border-muted-foreground/50 shrink-0"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground truncate">{practice.name}</div>
                      {practice.personal && (
                        <div className="text-xs text-muted-foreground">Personal practice</div>
                      )}
                    </div>
                    {practice.distanceKm != null && (
                      <Badge variant="secondary" className="shrink-0 tabular-nums">
                        {practice.distanceKm} km
                      </Badge>
                    )}
                  </div>

                  <div className="pb-2">
                    {practice.doctors.length === 0 ? (
                      <p className="pl-11 pr-4 pb-2 text-xs text-muted-foreground">No doctors listed</p>
                    ) : (
                      practice.doctors.map((d) => {
                        const key = `${practice.clinicUuid}:${d.doctorUuid}`;
                        const selected = selectedDoctorKey === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => openDoctor(practice, d)}
                            className={cn(
                              'w-full flex items-center gap-3 pl-11 pr-4 py-2.5 text-left hover:bg-muted/50 transition',
                              selected && 'bg-muted/40'
                            )}
                          >
                            <span
                              className={cn(
                                'h-4 w-4 rounded-full border-2 shrink-0',
                                selected
                                  ? 'border-primary bg-primary/20'
                                  : 'border-muted-foreground/50'
                              )}
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-foreground truncate">{d.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {[specialtyLabel(d.specialization), d.experienceYears != null ? `${d.experienceYears} yrs` : null]
                                  .filter(Boolean)
                                  .join(' · ') || 'Veterinarian'}
                              </div>
                            </div>
                            {d.rating != null && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                <Star className="h-3 w-3" />
                                {d.rating.toFixed(1)}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {step === 'book' && clinic && doctor && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Book with {doctor.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground pt-1">
              {[specialtyLabel(doctor.specialization), clinic.name, clinic.distanceKm != null ? `${clinic.distanceKm} km` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Pet</Label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={petUuid}
                onChange={(e) => setPetUuid(e.target.value)}
              >
                <option value="">Select pet</option>
                {pets.map((p) => (
                  <option key={p.uuid} value={p.uuid}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Available slots</Label>
              {loadingSlots ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : slotLabels.length ? (
                <div className="flex flex-wrap gap-2">
                  {slotLabels.map((s) => (
                    <Button
                      key={s.raw}
                      type="button"
                      size="sm"
                      variant={slotStart === s.raw ? 'default' : 'outline'}
                      onClick={() => setSlotStart(s.raw)}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No free slots this day — try another date.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for visit…"
              />
            </div>
            <Button className="w-full" disabled={booking || !slotStart || !petUuid} onClick={() => void confirm()}>
              {booking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm booking
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
