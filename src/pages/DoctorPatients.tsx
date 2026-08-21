import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PawPrint, Mail } from 'lucide-react';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { AttendedPatientModel, fetchMyAttendedPatients } from '@/services/visitService';
import { matchesQuery } from '@/utils/search';

type ClientRow = {
  petUuid: string;
  petName: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  clinicName?: string | null;
  lastAssessment?: string | null;
  lastVisitAt?: string | null;
  visitCount?: number;
};

export default function DoctorPatients() {
  const { clinicUuid, clinic } = useActiveClinic();
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<AttendedPatientModel[]>([]);
  const [loading, setLoading] = useState(true);

  /** Scope patient roster to the active practice (personal vs clinic branch). */
  const practiceClinicUuid = clinicUuid || undefined;

  useEffect(() => {
    let cancelled = false;
    setPatients([]);
    (async () => {
      setLoading(true);
      try {
        const attended = await fetchMyAttendedPatients(practiceClinicUuid);
        if (!cancelled) {
          setPatients(attended);
        }
      } catch {
        if (!cancelled) {
          setPatients([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [practiceClinicUuid]);

  const clients = useMemo<ClientRow[]>(() => {
    return patients
      .filter((p) => p.petUuid)
      .map((p) => ({
        petUuid: p.petUuid,
        petName: p.petName,
        ownerName: p.ownerName,
        ownerEmail: p.ownerEmail,
        ownerPhone: p.ownerPhone,
        clinicName: p.clinicName,
        lastAssessment: p.lastAssessment,
        lastVisitAt: p.lastVisitAt,
        visitCount: p.visitCount,
      }))
      .sort((a, b) => (a.petName || '').toLowerCase().localeCompare((b.petName || '').toLowerCase()));
  }, [patients]);

  const filtered = useMemo(
    () =>
      clients.filter((p) =>
        matchesQuery(search, p.petName, p.ownerName, p.ownerEmail, p.ownerPhone, p.clinicName)
      ),
    [clients, search]
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Patients</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {clinic?.personal
            ? 'Pets you treated on your personal practice.'
            : clinic
              ? `${clinic.name} — pets you treated, plus pets that already visited this clinic`
              : 'Pets you treated, plus pets that visited a clinic you belong to'}
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
              ? 'No patients yet. They appear after you treat them.'
              : 'No patients yet. They appear after you treat them, or after they visit a clinic you belong to.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const last = p.lastVisitAt ? parseISO(p.lastVisitAt) : null;
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
                    {last && isValid(last) && (
                      <p className="text-muted-foreground">
                        Last visit: <span className="text-foreground">{format(last, 'MMM d, yyyy')}</span>
                        {p.visitCount && p.visitCount > 1 ? ` · ${p.visitCount} visits` : ''}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                    <Link to={`/doctor/patients/${p.petUuid}`}>View dashboard</Link>
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
