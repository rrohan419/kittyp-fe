/** Parse ISO date (`YYYY-MM-DD` or datetime) as local calendar date. */
export function parsePetDob(dobString: string): Date | null {
  if (!dobString) return null;
  const iso = dobString.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    const fallback = new Date(dobString);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day);
}

export function petAgeYearsMonths(
  dobString: string,
  now: Date = new Date()
): { years: number; months: number } | null {
  const dob = parsePetDob(dobString);
  if (!dob) return null;

  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  if (now.getDate() < dob.getDate()) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) {
    return { years: 0, months: 0 };
  }
  return { years, months };
}

/** Compact age: `2y3m`, `2y`, `3m`, or `<1m`. */
export function formatPetAgeCompact(dobString: string, now: Date = new Date()): string {
  const age = petAgeYearsMonths(dobString, now);
  if (!age) return '';
  if (age.years > 0 && age.months > 0) return `${age.years}y${age.months}m`;
  if (age.years > 0) return `${age.years}y`;
  if (age.months > 0) return `${age.months}m`;
  return '<1m';
}

export function formatPetDobDate(dobString: string): string {
  const dob = parsePetDob(dobString);
  if (!dob) return dobString;
  return dob.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** `12 May 2024 (2y3m)` */
export function formatPetDobWithAge(dobString: string, now: Date = new Date()): string {
  if (!dobString) return '';
  const compact = formatPetAgeCompact(dobString, now);
  const dateLabel = formatPetDobDate(dobString);
  return compact ? `${dateLabel} (${compact})` : dateLabel;
}
