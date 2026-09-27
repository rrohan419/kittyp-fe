import { useEffect, useMemo, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { fetchClinicPetMedicalProfile, fetchClinicPetVisits } from '@/services/clinicService';
import { PrescriptionDocument } from './PrescriptionDocument';
import type { PrescriptionPetDetails } from './prescriptionPet';
import {
  prescriptionsFromVisits,
  type PrescriptionHistoryItem,
} from './prescriptionsFromVisits';

const PREV_RX_PLACEHOLDER = '__none__';

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
  const [prevSelect, setPrevSelect] = useState(PREV_RX_PLACEHOLDER);

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

  const rows = preloaded ? (history ?? []) : fetched;

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

  const onPrevSelect = (visitUuid: string) => {
    if (visitUuid === PREV_RX_PLACEHOLDER) {
      setPrevSelect(PREV_RX_PLACEHOLDER);
      return;
    }
    const row = rows.find((r) => r.visitUuid === visitUuid);
    if (row) {
      setOpenRecord(row);
    }
    // Reset so nothing stays "shown" in the dropdown.
    setPrevSelect(PREV_RX_PLACEHOLDER);
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

      <div className="space-y-2">
        <Label htmlFor="prev-prescriptions">Previous prescriptions</Label>
        {loading ? (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : rows.length ? (
          <Select value={prevSelect} onValueChange={onPrevSelect}>
            <SelectTrigger id="prev-prescriptions">
              <SelectValue placeholder="Select to view…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PREV_RX_PLACEHOLDER} disabled>
                Select to view…
              </SelectItem>
              {rows.map((row) => (
                <SelectItem key={row.visitUuid} value={row.visitUuid}>
                  {formatVisitDate(row.date)}
                  {row.doctorName ? ` · ${row.doctorName}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-muted-foreground">
            {editable
              ? 'No earlier prescriptions. Use Preview to open this visit as a document.'
              : 'No prescriptions recorded yet.'}
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
