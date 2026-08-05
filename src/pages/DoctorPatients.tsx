import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PawPrint, Mail } from 'lucide-react';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { ClinicPatientModel, fetchClinicPatients } from '@/services/clinicService';

export default function DoctorPatients() {
  const { clinicUuid, clinic } = useActiveClinic();
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<ClinicPatientModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicUuid) {
      setPatients([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setPatients([]);
    (async () => {
      setLoading(true);
      try {
        const data = await fetchClinicPatients(clinicUuid);
        if (!cancelled) setPatients(data);
      } catch {
        if (!cancelled) setPatients([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clinicUuid]);

  const filtered = useMemo(
    () =>
      patients.filter((p) =>
        `${p.petName} ${p.ownerName} ${p.ownerEmail ?? ''}`.toLowerCase().includes(search.toLowerCase())
      ),
    [patients, search]
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Patients</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {clinic ? `${clinic.name} — ` : ''}{patients.length} pets in clinic records
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
      ) : !clinicUuid ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center text-muted-foreground">
            Select or create a clinic to view patients.
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center text-muted-foreground">
            No patients found for this clinic.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Card key={p.petUuid} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                    <PawPrint className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{p.petName}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.ownerName}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs">
                  {p.ownerEmail && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{p.ownerEmail}</span>
                    </div>
                  )}
                  <p className="text-muted-foreground">
                    Last visit:{' '}
                    <span className="text-foreground">
                      {p.lastVisit ? format(parseISO(p.lastVisit), 'MMM d, yyyy') : '—'}
                    </span>
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                  <Link to={`/clinic/pets/${p.petUuid}`}>View dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
