import { subMonths, format as fnsFormat } from 'date-fns';

/** Convert a whole number of months into a YYYY-MM-DD DOB string. */
export function ageInMonthsToDob(months: number): string {
  if (months <= 0) return '';
  return fnsFormat(subMonths(new Date(), months), 'yyyy-MM-dd');
}

/** Calculate approximate total months from a DOB string. */
export function dobToTotalMonths(dobString: string, now: Date = new Date()): number | null {
  if (!dobString) return null;
  const iso = dobString.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  let dob: Date;
  if (match) {
    dob = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  } else {
    dob = new Date(dobString);
    if (Number.isNaN(dob.getTime())) return null;
  }
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  if (now.getDate() < dob.getDate()) {
    months -= 1;
  }
  const total = years * 12 + months;
  return total >= 0 ? total : 0;
}

