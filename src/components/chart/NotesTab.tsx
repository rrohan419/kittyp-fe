import { format, isValid, parseISO } from 'date-fns';
import { Label } from '@/components/ui/label';
import type { ChartNotesSlice } from './chartTabs';
import type { NoteHistoryItem } from './prescriptionsFromVisits';
import { SmartPhraseTextarea } from './SmartPhraseTextarea';
import type { DoctorSmartPhrase } from '@/services/doctorSmartPhraseService';

function formatVisitDate(value: string | null): string {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, 'MMM d, yyyy · h:mm a') : value;
}

export interface NotesTabProps {
  editable: boolean;
  notes: ChartNotesSlice;
  onNotesChange?: (next: ChartNotesSlice) => void;
  history?: NoteHistoryItem[];
  phrases?: DoctorSmartPhrase[];
}

export function NotesTab({
  editable,
  notes,
  onNotesChange,
  history = [],
  phrases = [],
}: NotesTabProps) {
  const set = (key: keyof ChartNotesSlice, value: string) => {
    onNotesChange?.({ ...notes, [key]: value });
  };

  if (editable) {
    const showRequired = !notes.assessment.trim();
    return (
      <div className="space-y-3">
        <div>
          <Label htmlFor="chart-exam">Examination / report</Label>
          <SmartPhraseTextarea
            id="chart-exam"
            value={notes.examinationNotes}
            onValueChange={(value) => set('examinationNotes', value)}
            phrases={phrases}
            rows={3}
            placeholder="Findings shared with the pet owner"
          />
        </div>
        <div>
          <Label htmlFor="chart-assessment">
            Assessment / diagnosis <span className="text-destructive">*</span>
          </Label>
          <SmartPhraseTextarea
            id="chart-assessment"
            value={notes.assessment}
            onValueChange={(value) => set('assessment', value)}
            phrases={phrases}
            rows={2}
            placeholder="Required to finish treatment"
            aria-required="true"
            className={showRequired ? 'border-destructive focus-visible:ring-destructive' : undefined}
          />
          {showRequired ? (
            <p className="mt-1 text-xs text-destructive">Required to finish treatment.</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="chart-next">Next visit notes</Label>
          <SmartPhraseTextarea
            id="chart-next"
            value={notes.nextVisitNotes}
            onValueChange={(value) => set('nextVisitNotes', value)}
            phrases={phrases}
            rows={1}
            className="min-h-10 py-2"
          />
        </div>
        <div>
          <Label htmlFor="chart-internal">Internal notes (clinic only)</Label>
          <SmartPhraseTextarea
            id="chart-internal"
            value={notes.internalNotes}
            onValueChange={(value) => set('internalNotes', value)}
            phrases={phrases}
            rows={2}
          />
        </div>
      </div>
    );
  }

  if (!history.length) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">No notes recorded yet.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {history.map((row) => (
        <li key={row.visitUuid} className="rounded-lg border border-border p-4 space-y-2">
          <p className="text-xs text-muted-foreground">
            {formatVisitDate(row.date)}
            {row.doctorName ? ` · ${row.doctorName}` : ''}
          </p>
          {row.assessment ? <p className="text-sm font-medium">{row.assessment}</p> : null}
          {row.examinationNotes ? (
            <p className="text-sm text-muted-foreground">{row.examinationNotes}</p>
          ) : null}
          {row.nextVisitNotes ? (
            <p className="text-xs text-muted-foreground">Next visit: {row.nextVisitNotes}</p>
          ) : null}
          {row.internalNotes ? (
            <p className="text-xs text-muted-foreground">Internal: {row.internalNotes}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
