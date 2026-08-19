import { format, isValid, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ChartVitalsSlice } from './chartTabs';
import type { VitalHistoryItem } from './prescriptionsFromVisits';

function formatVisitDate(value: string | null): string {
  if (!value) return '—';
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, 'MMM d, yyyy · h:mm a') : value;
}

export interface VitalsTabProps {
  editable: boolean;
  vitals: ChartVitalsSlice;
  onVitalsChange?: (next: ChartVitalsSlice) => void;
  history?: VitalHistoryItem[];
}

export function VitalsTab({ editable, vitals, onVitalsChange, history = [] }: VitalsTabProps) {
  const set = (key: keyof ChartVitalsSlice, value: string) => {
    onVitalsChange?.({ ...vitals, [key]: value });
  };

  if (editable) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="chart-weight">Weight (kg)</Label>
          <Input
            id="chart-weight"
            value={vitals.weightKg}
            onChange={(e) => set('weightKg', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="chart-temp">Temp (°C)</Label>
          <Input
            id="chart-temp"
            value={vitals.temperatureC}
            onChange={(e) => set('temperatureC', e.target.value)}
          />
        </div>
      </div>
    );
  }

  if (!history.length) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">No vitals recorded yet.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {history.map((row) => (
        <li key={row.visitUuid} className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">
            {formatVisitDate(row.date)}
            {row.doctorName ? ` · ${row.doctorName}` : ''}
          </p>
          <p className="text-sm font-medium mt-1">
            {[
              row.weightKg ? `${row.weightKg} kg` : null,
              row.temperatureC ? `${row.temperatureC} °C` : null,
            ]
              .filter(Boolean)
              .join(' · ') || '—'}
          </p>
        </li>
      ))}
    </ul>
  );
}
