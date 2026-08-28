export type ClinicHourDay = {
  dayOfWeek: number;
  closed: boolean;
  startTime: string;
  endTime: string;
};

export const CLINIC_HOUR_DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const;

export function defaultClinicHours(): ClinicHourDay[] {
  return CLINIC_HOUR_DAYS.map((d) => ({
    dayOfWeek: d.value,
    closed: d.value === 0,
    startTime: '09:00',
    endTime: '18:00',
  }));
}

function isHourDay(value: unknown): value is ClinicHourDay {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.dayOfWeek === 'number';
}

export function parseOperatingHours(raw?: string | null): {
  days: ClinicHourDay[];
  legacyText: string | null;
} {
  if (!raw || !raw.trim()) {
    return { days: [], legacyText: null };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    const arr = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray((parsed as { days?: unknown }).days)
        ? (parsed as { days: unknown[] }).days
        : null;
    if (arr && arr.some(isHourDay)) {
      const byDay = new Map<number, ClinicHourDay>();
      for (const item of arr) {
        if (!isHourDay(item)) continue;
        byDay.set(item.dayOfWeek, {
          dayOfWeek: item.dayOfWeek,
          closed: Boolean(item.closed),
          startTime: item.startTime || '09:00',
          endTime: item.endTime || '18:00',
        });
      }
      return {
        days: defaultClinicHours().map((def) => byDay.get(def.dayOfWeek) ?? def),
        legacyText: null,
      };
    }
  } catch {
    /* not JSON — keep as free-text until first save */
  }
  return { days: [], legacyText: raw };
}

export function serializeOperatingHours(days: ClinicHourDay[]): string {
  return JSON.stringify(days);
}

export function formatTime12h(hhmm: string): string {
  const [hStr, mStr = '00'] = hhmm.split(':');
  const hour24 = Number(hStr);
  const minute = Number(mStr);
  if (!Number.isFinite(hour24) || !Number.isFinite(minute)) return hhmm;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour = hour24 % 12 || 12;
  return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function formatDayHours(day: ClinicHourDay): string {
  if (day.closed) return 'Closed';
  return `${formatTime12h(day.startTime)} – ${formatTime12h(day.endTime)}`;
}

export function formatClinicHours(days: ClinicHourDay[]): string {
  return days
    .map((d) => {
      const label = CLINIC_HOUR_DAYS.find((row) => row.value === d.dayOfWeek)?.label ?? `Day ${d.dayOfWeek}`;
      return `${label}: ${formatDayHours(d)}`;
    })
    .join('\n');
}
