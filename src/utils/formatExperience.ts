/** Display years of experience, or null when missing. */
export function formatExperienceYears(value?: number | string | null): string | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const years = Math.trunc(n);
  if (years < 0) return null;
  return `Experience - ${years} yr${years === 1 ? '' : 's'}`;
}
