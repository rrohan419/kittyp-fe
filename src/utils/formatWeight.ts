/** Display pet weight without duplicating a trailing "kg" unit. */
export function formatWeightKg(weight: string | number | null | undefined, empty = '—'): string {
  if (weight == null || weight === '') return empty;
  const s = String(weight).trim();
  if (!s) return empty;
  if (/\bkg\b/i.test(s)) return s;
  return `${s} kg`;
}
