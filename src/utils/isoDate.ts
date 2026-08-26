import { format, isValid, parse, startOfDay } from 'date-fns';

/** Parse a `yyyy-MM-dd` string as a local calendar date (avoids UTC off-by-one). */
export function parseIsoDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const trimmed = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined;
  const parsed = parse(trimmed, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? startOfDay(parsed) : undefined;
}

export function formatIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function toDateBound(value?: string | Date | null): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return isValid(value) ? startOfDay(value) : undefined;
  return parseIsoDate(value);
}
