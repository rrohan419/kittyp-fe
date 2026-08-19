import { useEffect, useMemo, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { Eye, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fetchClinicPetMedicalProfile, fetchClinicPetVisits } from '@/services/clinicService';
import { PrescriptionDocument } from './PrescriptionDocument';
import type { PrescriptionPetDetails } from './prescriptionPet';
import {
  prescriptionsFromVisits,
  type PrescriptionHistoryItem,
} from './prescriptionsFromVisits';

function formatVisitDate(value: string | null): string {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, 'MMM d, yyyy · h:mm a') : value;
}

export type ThisVisitRef = {
  uuid: string;
  doctorName?: string | null;
  date?: string | null;
};

export interface PrescriptionsTabProps {
  editable: boolean;
  plan: string;
  onPlanChange?: (plan: string) => void;
  onSavePrescription?: () => void | Promise<void>;
  saving?: boolean;
  pet: PrescriptionPetDetails;
  thisVisit?: ThisVisitRef | null;
  /** Preloaded history. When defined, this tab does not fetch. */
  history?: PrescriptionHistoryItem[];
  clinicUuid?: string | null;
  petUuid?: string | null;
  excludeVisitUuid?: string | null;
}

function mergePet(base: PrescriptionPetDetails, extra: PrescriptionPetDetails | null): PrescriptionPetDetails {
  return {
    name: extra?.name || base.name,
    sex: extra?.sex || base.sex,
    dateOfBirth: extra?.dateOfBirth || base.dateOfBirth,
    species: extra?.species || base.species,
    breed: extra?.breed || base.breed,
    weight: extra?.weight || base.weight,
    ownerName: extra?.ownerName || base.ownerName,
  };
}

export function PrescriptionsTab({
  editable,
  plan,
  onPlanChange,
  onSavePrescription,
  saving = false,
  pet,
  thisVisit,
  history,
  clinicUuid,
  petUuid,
  excludeVisitUuid,
}: PrescriptionsTabProps) {
  const [fetched, setFetched] = useState<PrescriptionHistoryItem[]>([]);
  const [profilePet, setProfilePet] = useState<PrescriptionPetDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openRecord, setOpenRecord] = useState<PrescriptionHistoryItem | null>(null);

  const preloaded = history !== undefined;
  const resolvedPet = useMemo(() => mergePet(pet, profilePet), [pet, profilePet]);

  useEffect(() => {
    if (!clinicUuid || !petUuid) {
      setProfilePet(null);
      return;
    }
    let cancelled = false;
    fetchClinicPetMedicalProfile(clinicUuid, petUuid)
      .then((data) => {
        if (cancelled) return;
        const p = data.pet;
        setProfilePet({
          name: p.name,
          sex: p.gender,
          dateOfBirth: p.dateOfBirth,
          species: p.species,
          breed: p.breed,
          weight: p.weight,
          ownerName: p.ownerName,
        });
      })
      .catch(() => {
        if (!cancelled) setProfilePet(null);
      });
    return () => {
      cancelled = true;
    };
  }, [clinicUuid, petUuid]);

  useEffect(() => {
    if (preloaded) return;
    if (!clinicUuid || !petUuid) {
      setFetched([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchClinicPetVisits(clinicUuid, petUuid)
      .then((visits) => {
        if (cancelled) return;
        setFetched(prescriptionsFromVisits(visits, excludeVisitUuid));
      })
      .catch(() => {
        if (!cancelled) {
          setFetched([]);
          setError('Failed to load prescription history');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [preloaded, clinicUuid, petUuid, excludeVisitUuid]);

  const rows = preloaded ? history : fetched;

  const openThisVisit = () => {
    if (!thisVisit) return;
    setOpenRecord({
      visitUuid: thisVisit.uuid,
      bookingId: thisVisit.uuid,
      date: thisVisit.date || new Date().toISOString(),
      doctorName: thisVisit.doctorName ?? null,
      plan: plan.trim(),
    });
  };

  return (
    <div className="space-y-4">
      {editable ? (
        <div>
          <Label htmlFor="chart-prescription">Add Prescription</Label>
          <Textarea
            id="chart-prescription"
            value={plan}
            onChange={(e) => onPlanChange?.(e.target.value)}
            rows={4}
            placeholder="Medications, dose, duration, and home care"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {onSavePrescription ? (
              <Button
                size="sm"
                onClick={() => void onSavePrescription()}
                disabled={saving || !plan.trim()}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save prescription
              </Button>
            ) : null}
            {thisVisit ? (
              <Button type="button" size="sm" variant="outline" onClick={openThisVisit}>
                <Eye className="h-4 w-4 mr-1.5" />
                Preview
              </Button>
            ) : null}
          </div>
          {!onSavePrescription ? (
            <p className="text-xs text-muted-foreground mt-2">
              Last clinical step before billing. Finish treatment opens the invoice for this visit.
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <p className="text-sm font-medium mb-2">Prescriptions</p>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading prescriptions…
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{error}</p>
        ) : rows.length ? (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.visitUuid}>
                <button
                  type="button"
                  onClick={() => setOpenRecord(row)}
                  className="w-full text-left rounded-xl border border-border bg-card p-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{resolvedPet.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatVisitDate(row.date)}
                        {row.doctorName ? ` · ${row.doctorName}` : ''}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{row.plan}</p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {editable ? 'No earlier prescriptions. Use Preview to open this visit as a document.' : 'No prescriptions recorded yet.'}
          </p>
        )}
      </div>

      <PrescriptionDocument
        open={!!openRecord}
        onOpenChange={(open) => {
          if (!open) setOpenRecord(null);
        }}
        pet={resolvedPet}
        record={openRecord}
      />
    </div>
  );
}
