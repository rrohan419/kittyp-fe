import { format, isValid, parseISO } from 'date-fns';
import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { calculatePetAgeForDisplay } from '@/services/UserService';
import type { PrescriptionPetDetails } from './prescriptionPet';
import type { PrescriptionHistoryItem } from './prescriptionsFromVisits';

function formatVisitDate(value: string | null): string {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, 'MMM d, yyyy · h:mm a') : value;
}

function petAge(dateOfBirth?: string | null): string {
  if (!dateOfBirth) return '—';
  return calculatePetAgeForDisplay(dateOfBirth) || '—';
}

function display(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2 rounded-xl border border-border bg-muted/40 p-3' : 'rounded-xl border border-border bg-muted/40 p-3'}>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground break-words">{value}</p>
    </div>
  );
}

export interface PrescriptionDocumentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet: PrescriptionPetDetails;
  record: PrescriptionHistoryItem | null;
}

export function PrescriptionDocument({ open, onOpenChange, pet, record }: PrescriptionDocumentProps) {
  const speciesBreed = [pet.species, pet.breed].filter(Boolean).join(' · ');
  const details = [speciesBreed || null, pet.weight ? String(pet.weight) : null].filter(Boolean).join(' · ');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background border-border p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border text-left space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-base">Prescription</DialogTitle>
              <DialogDescription className="text-xs truncate">
                {display(pet.name)}
                {pet.ownerName ? ` · ${pet.ownerName}` : ''}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {record ? (
          <article className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Field label="Pet name" value={display(pet.name)} wide />
              <Field label="Sex" value={display(pet.sex)} />
              <Field label="Age" value={petAge(pet.dateOfBirth)} />
              <Field label="Pet details" value={display(details)} wide />
              <Field label="Booking ID" value={display(record.bookingId)} wide />
              <Field label="Date" value={formatVisitDate(record.date)} />
              <Field label="Doctor" value={display(record.doctorName)} />
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Prescription</p>
                {record.plan.trim() ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Recorded
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed min-h-[3rem]">
                {record.plan.trim() || 'No prescription written yet.'}
              </p>
            </div>
          </article>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
