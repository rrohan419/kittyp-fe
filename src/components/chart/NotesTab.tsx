import { format, isValid, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ChartNotesSlice } from './chartTabs';
import type { NoteHistoryItem } from './prescriptionsFromVisits';

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
}

export function NotesTab({ editable, notes, onNotesChange, history = [] }: NotesTabProps) {
  const set = (key: keyof ChartNotesSlice, value: string) => {
    onNotesChange?.({ ...notes, [key]: value });
  };

  if (editable) {
    return (
      <div className="space-y-3">
        <div>
          <Label htmlFor="chart-exam">Examination / report</Label>
          <Textarea
            id="chart-exam"
            value={notes.examinationNotes}
            onChange={(e) => set('examinationNotes', e.target.value)}
            rows={3}
            placeholder="Findings shared with the pet owner"
          />
        </div>
        <div>
          <Label htmlFor="chart-assessment">Assessment / diagnosis</Label>
          <Textarea
            id="chart-assessment"
            value={notes.assessment}
            onChange={(e) => set('assessment', e.target.value)}
            rows={2}
            placeholder="Required to complete"
          />
        </div>
        <div>
          <Label htmlFor="chart-next">Next visit notes</Label>
          <Input
            id="chart-next"
            value={notes.nextVisitNotes}
            onChange={(e) => set('nextVisitNotes', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="chart-internal">Internal notes (clinic only)</Label>
          <Textarea
            id="chart-internal"
            value={notes.internalNotes}
            onChange={(e) => set('internalNotes', e.target.value)}
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
