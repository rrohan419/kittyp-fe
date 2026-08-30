import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PawPrint, Mail } from 'lucide-react';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { AttendedPatientModel, fetchMyAttendedPatients } from '@/services/visitService';
import { Skeleton } from '@/components/ui/skeleton';
import { ListPager } from '@/components/ui/ListPager';

const PAGE_SIZE = 20;

export default function DoctorPatients() {
  const { clinicUuid, clinic } = useActiveClinic();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [patients, setPatients] = useState<AttendedPatientModel[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const practiceClinicUuid = clinicUuid || undefined;

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, practiceClinicUuid]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await fetchMyAttendedPatients(practiceClinicUuid, {
          q: debouncedSearch || undefined,
          pageNumber: page,
          pageSize: PAGE_SIZE,
        });
        if (!cancelled) {
          setPatients(result.models ?? []);
          setTotal(result.totalElements ?? 0);
          setTotalPages(result.totalPages ?? 0);
        }
      } catch {
        if (!cancelled) {
          setPatients([]);
          setTotal(0);
          setTotalPages(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [practiceClinicUuid, debouncedSearch, page]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Patients</h1>
        <p className="text-muted-foreground mt-1 text-sm">
            {clinic
              ? clinic.personal
                ? "You're on Personal — online consults."
                : `You're at ${clinic.name} — clinic visits only.`
              : 'Pets you treated, plus pets that visited a clinic you belong to'}
          <span className="inline-block min-w-[2.5rem]">
            {loading ? '' : ` · ${total}`}
          </span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : patients.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center text-muted-foreground">
            {clinic?.personal
              ? 'No patients yet. Pets appear after a parent books an online consult with you, or after you attend them.'
              : 'No patients yet. They appear after you treat them, or after they visit a clinic you belong to.'}
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.filter((p) => p.petUuid).map((p) => {
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
        <ListPager
          page={page}
          totalPages={totalPages}
          totalElements={total}
          noun={total === 1 ? 'patient' : 'patients'}
          onPageChange={setPage}
          disabled={loading}
        />
        </>
      )}
    </div>
  );
}
