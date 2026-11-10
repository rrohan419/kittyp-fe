import { Card } from '@/components/ui/card';
import type { WeightLog } from '@/types/nutrition';

export function WeightHistory({ entries }: { entries: WeightLog[] }) {
  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold mb-4">Weight history</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No weight measurements recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {[...entries].reverse().map((entry, index) => (
            <li key={entry.id ?? `${entry.date}-${index}`} className="text-sm border-b pb-3 last:border-0">
              <p className="font-medium">{entry.weight} kg · {new Date(entry.date).toLocaleString()}</p>
              <p className="text-muted-foreground">
                {entry.recordedBy ? `Recorded by ${entry.recordedBy}` : 'Recorder not available'}
                {' · '}{entry.visitUuid ? 'Doctor visit' : entry.recordedBy ? 'Manual entry' : 'Source not available'}
                {entry.note ? ` · ${entry.note}` : ''}
              </p>
              {entry.correctedBy && (
                <p className="text-muted-foreground">
                  Corrected by {entry.correctedBy}{entry.correctedAt ? ` · ${new Date(entry.correctedAt).toLocaleString()}` : ''}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
