import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, format, parseISO, isValid, startOfDay } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PawPrint, Mail } from 'lucide-react';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { ClinicBookingModel, ClinicVisitModel } from '@/services/clinicService';
import {
  AttendedPatientModel,
  fetchMyAttendedPatients,
  fetchMyDoctorBookings,
  fetchMyDoctorVisits,
} from '@/services/visitService';

const OPEN_VISIT = new Set(['WAITLIST', 'CHECKED_IN', 'IN_PROGRESS']);

type ClientRow = {
  petUuid: string;
  petName: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  clinicName?: string | null;
  lastAssessment?: string | null;
  lastVisitAt?: string | null;
  nextSlot?: string | null;
  visitCount?: number;
};

export default function DoctorPatients() {
  const { clinicUuid, clinic } = useActiveClinic();
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<AttendedPatientModel[]>([]);
  const [bookings, setBookings] = useState<ClinicBookingModel[]>([]);
  const [visits, setVisits] = useState<ClinicVisitModel[]>([]);
  const [loading, setLoading] = useState(true);

  /** Scope patient roster to the active practice (personal vs clinic branch). */
  const practiceClinicUuid = clinicUuid || undefined;

  useEffect(() => {
    let cancelled = false;
    setPatients([]);
    setBookings([]);
    setVisits([]);
    (async () => {
      setLoading(true);
      try {
        const today = startOfDay(new Date());
        const from = format(today, 'yyyy-MM-dd');
        const to = format(addDays(today, 30), 'yyyy-MM-dd');
        const [attended, upcoming, mine] = await Promise.all([
          fetchMyAttendedPatients(practiceClinicUuid),
          fetchMyDoctorBookings({ from, to, clinicUuid: practiceClinicUuid }).catch(
            () => [] as ClinicBookingModel[]
          ),
          fetchMyDoctorVisits({ from, to: from, clinicUuid: practiceClinicUuid }).catch(
            () => [] as ClinicVisitModel[]
          ),
        ]);
        if (!cancelled) {
          setPatients(attended);
          setBookings(upcoming);
          setVisits(mine);
        }
      } catch {
        if (!cancelled) {
          setPatients([]);
          setBookings([]);
          setVisits([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [practiceClinicUuid]);

  const clients = useMemo(() => {
    const map = new Map<string, ClientRow>();
    const upsert = (row: ClientRow) => {
      if (!row.petUuid) return;
      const prev = map.get(row.petUuid);
      if (!prev) {
        map.set(row.petUuid, row);
        return;
      }
      map.set(row.petUuid, {
        ...prev,
        ...row,
        petName: row.petName || prev.petName,
        ownerName: row.ownerName || prev.ownerName,
        ownerEmail: row.ownerEmail || prev.ownerEmail,
        ownerPhone: row.ownerPhone || prev.ownerPhone,
        clinicName: row.clinicName || prev.clinicName,
        lastAssessment: row.lastAssessment || prev.lastAssessment,
        lastVisitAt: (() => {
          const a = row.lastVisitAt ? parseISO(row.lastVisitAt).getTime() : 0;
          const b = prev.lastVisitAt ? parseISO(prev.lastVisitAt).getTime() : 0;
          return a >= b ? row.lastVisitAt || prev.lastVisitAt : prev.lastVisitAt;
        })(),
        nextSlot: (() => {
          const a = row.nextSlot ? parseISO(row.nextSlot).getTime() : Number.POSITIVE_INFINITY;
          const b = prev.nextSlot ? parseISO(prev.nextSlot).getTime() : Number.POSITIVE_INFINITY;
          return a <= b ? row.nextSlot || prev.nextSlot : prev.nextSlot;
        })(),
        visitCount: Math.max(row.visitCount || 0, prev.visitCount || 0),
      });
    };

    for (const p of patients) {
      upsert({
        petUuid: p.petUuid,
        petName: p.petName,
        ownerName: p.ownerName,
        ownerEmail: p.ownerEmail,
        ownerPhone: p.ownerPhone,
        clinicName: p.clinicName,
        lastAssessment: p.lastAssessment,
        lastVisitAt: p.lastVisitAt,
        visitCount: p.visitCount,
      });
    }
    for (const v of visits) {
      if (!v.petUuid) continue;
      if (!OPEN_VISIT.has(v.status) && v.status !== 'CHECKING_OUT' && v.status !== 'COMPLETED') continue;
      upsert({
        petUuid: v.petUuid,
        petName: v.petName,
        ownerName: v.ownerName,
        ownerEmail: v.ownerEmail,
        ownerPhone: v.ownerPhone,
        clinicName: v.clinicName,
        lastAssessment: v.chart?.assessment,
        lastVisitAt: v.completedAt || v.startedAt || v.checkedInAt || v.createdAt,
      });
    }
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const b of bookings) {
      if (!b.petUuid || !b.slotStart) continue;
      const status = (b.status || '').toUpperCase();
      if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(status)) continue;
      const start = parseISO(b.slotStart);
      if (!isValid(start) || start.getTime() < cutoff) continue;
      upsert({
        petUuid: b.petUuid,
        petName: b.petName,
        ownerName: b.ownerName,
        clinicName: b.clinicName,
        nextSlot: b.slotStart,
      });
    }

    return [...map.values()].sort((a, b) => {
      const an = (a.petName || '').toLowerCase();
      const bn = (b.petName || '').toLowerCase();
      return an.localeCompare(bn);
    });
  }, [patients, visits, bookings]);

  const filtered = useMemo(
    () =>
      clients.filter((p) =>
        `${p.petName} ${p.ownerName ?? ''} ${p.ownerEmail ?? ''} ${p.ownerPhone ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [clients, search]
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Patients</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {clinic?.personal
            ? 'Patients enrolled on your personal practice, plus those you’ve treated.'
            : clinic
              ? `${clinic.name} — patients and clients`
              : 'Your patients and clients'}
          {!loading ? ` · ${filtered.length}` : ''}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by pet or owner…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading patients…</p>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center text-muted-foreground">
            {clinic?.personal
              ? 'No patients yet. They appear when a parent books your personal practice, or after you treat them.'
              : 'No patients yet. They appear when assigned, booked, or after you treat them.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const last = p.lastVisitAt ? parseISO(p.lastVisitAt) : null;
            const next = p.nextSlot ? parseISO(p.nextSlot) : null;
            return (
              <Card key={p.petUuid} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                      <PawPrint className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{p.petName}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.ownerName || 'Owner'}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs">
                    {p.ownerEmail && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{p.ownerEmail}</span>
                      </div>
                    )}
                    {p.ownerPhone && (
                      <p className="text-muted-foreground truncate">{p.ownerPhone}</p>
                    )}
                    {p.clinicName && (
                      <p className="text-muted-foreground truncate">{p.clinicName}</p>
                    )}
                    {p.lastAssessment && (
                      <p className="text-muted-foreground line-clamp-2">
                        Last Dx: <span className="text-foreground">{p.lastAssessment}</span>
                      </p>
                    )}
                    {next && isValid(next) && (
                      <p className="text-muted-foreground">
                        Next: <span className="text-foreground">{format(next, 'MMM d · p')}</span>
                      </p>
                    )}
                    {last && isValid(last) && (
                      <p className="text-muted-foreground">
                        Last visit: <span className="text-foreground">{format(last, 'MMM d, yyyy')}</span>
                        {p.visitCount && p.visitCount > 1 ? ` · ${p.visitCount} visits` : ''}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                    <Link to={`/clinic/pets/${p.petUuid}`}>View dashboard</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
