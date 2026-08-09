import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { differenceInMonths, parseISO, isValid } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Stethoscope, Award, ChevronRight } from 'lucide-react';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import { ClinicDoctorModel, fetchClinicDoctors } from '@/services/clinicService';
import { toast } from 'sonner';

function tenureLabel(joinedAt?: string | null): string {
  if (!joinedAt) return 'Joined recently';
  const d = parseISO(joinedAt);
  if (!isValid(d)) return 'Joined recently';
  const months = Math.max(0, differenceInMonths(new Date(), d));
  if (months < 1) return 'Joined this month';
  if (months < 12) return `Since ${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `Since ${years} year${years === 1 ? '' : 's'}`;
  return `Since ${years}y ${rem}m`;
}

export default function ClinicStaff() {
  const { clinicUuid, clinic, loading: clinicLoading } = useActiveClinic();
  const [doctors, setDoctors] = useState<ClinicDoctorModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!clinicUuid) {
        setDoctors([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const list = await fetchClinicDoctors(clinicUuid);
        if (!cancelled) setDoctors(list.filter((d) => d.isActive !== false));
      } catch {
        if (!cancelled) {
          setDoctors([]);
          toast.error('Failed to load clinic doctors');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clinicUuid]);

  const sorted = useMemo(
    () =>
      [...doctors].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
      ),
    [doctors]
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Staff</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {clinicLoading || loading
            ? 'Loading…'
            : `${sorted.length} doctor${sorted.length === 1 ? '' : 's'}${
                clinic?.name ? ` at ${clinic.name}` : ''
              }`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading staff…
        </div>
      ) : sorted.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No doctors linked to this clinic yet. Invite doctors from Profile.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((d) => {
            const initials = (d.name || '?')
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return (
              <Link
                key={d.doctorUuid}
                to={`/clinic/doctors/${d.doctorUuid}`}
                className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{d.name}</p>
                        <p className="text-xs text-muted-foreground truncate inline-flex items-center gap-1">
                          <Stethoscope className="h-3 w-3 shrink-0" />
                          {(d.specialization || 'General').replace(/_/g, ' ')}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-[10px] border-0">
                        {tenureLabel(d.joinedAt)}
                      </Badge>
                      {d.role && (
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {d.role}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {d.registrationNumber && (
                        <p className="inline-flex items-center gap-1.5 truncate">
                          <Award className="h-3.5 w-3.5 shrink-0" />
                          Reg. {d.registrationNumber}
                        </p>
                      )}
                      {d.experienceYears != null && (
                        <p>
                          {d.experienceYears} year{d.experienceYears === 1 ? '' : 's'} experience
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
