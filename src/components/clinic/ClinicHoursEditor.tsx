import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  CLINIC_HOUR_DAYS,
  formatDayHours,
  type ClinicHourDay,
} from '@/utils/clinicHours';

type EditorProps = {
  value: ClinicHourDay[];
  onChange: (days: ClinicHourDay[]) => void;
  disabled?: boolean;
};

export function ClinicHoursEditor({ value, onChange, disabled }: EditorProps) {
  const patchDay = (dayOfWeek: number, patch: Partial<ClinicHourDay>) => {
    onChange(value.map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, ...patch } : row)));
  };

  const copyMondayToWeekdays = () => {
    const monday = value.find((d) => d.dayOfWeek === 1);
    if (!monday) return;
    onChange(
      value.map((row) =>
        row.dayOfWeek >= 1 && row.dayOfWeek <= 5
          ? {
              ...row,
              closed: monday.closed,
              startTime: monday.startTime,
              endTime: monday.endTime,
            }
          : row
      )
    );
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border divide-y overflow-hidden">
        {CLINIC_HOUR_DAYS.map((day) => {
          const row = value.find((d) => d.dayOfWeek === day.value) ?? {
            dayOfWeek: day.value,
            closed: false,
            startTime: '09:00',
            endTime: '18:00',
          };
          return (
            <div
              key={day.value}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-3 py-2.5"
            >
              <Label className="text-sm font-medium w-28 shrink-0">{day.label}</Label>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={!row.closed}
                  disabled={disabled}
                  onCheckedChange={(open) => patchDay(day.value, { closed: !open })}
                  aria-label={`${day.label} open`}
                />
                <span className="text-xs text-muted-foreground w-12">
                  {row.closed ? 'Closed' : 'Open'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Input
                  type="time"
                  value={row.startTime}
                  disabled={disabled || row.closed}
                  onChange={(e) => patchDay(day.value, { startTime: e.target.value })}
                  aria-label={`${day.label} start`}
                  className="h-9"
                />
                <span className="text-xs text-muted-foreground shrink-0">to</span>
                <Input
                  type="time"
                  value={row.endTime}
                  disabled={disabled || row.closed}
                  onChange={(e) => patchDay(day.value, { endTime: e.target.value })}
                  aria-label={`${day.label} end`}
                  className="h-9"
                />
              </div>
            </div>
          );
        })}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={copyMondayToWeekdays}
      >
        Copy Monday to weekdays
      </Button>
    </div>
  );
}

type DisplayProps = {
  days: ClinicHourDay[];
  legacyText?: string | null;
};

export function ClinicHoursDisplay({ days, legacyText }: DisplayProps) {
  if (!days.length) {
    if (legacyText) {
      return (
        <p className="text-sm text-muted-foreground rounded-lg border px-3 py-2.5">{legacyText}</p>
      );
    }
    return <p className="text-sm text-muted-foreground">Hours not set</p>;
  }

  return (
    <div className="rounded-lg border divide-y overflow-hidden">
      {CLINIC_HOUR_DAYS.map((day) => {
        const row = days.find((d) => d.dayOfWeek === day.value);
        const closed = !row || row.closed;
        return (
          <div key={day.value} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="text-sm font-medium w-28 shrink-0">{day.label}</span>
            {closed ? (
              <Badge variant="secondary">Closed</Badge>
            ) : (
              <span className="text-sm tabular-nums">{formatDayHours(row)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
