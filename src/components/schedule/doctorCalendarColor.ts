import { cn } from '@/lib/utils';

export type DoctorColorIdentity = {
  doctorUuid: string;
  name: string;
};

type PaletteEntry = {
  block: string;
  swatch: string;
};

/** Light fills, dark text. No sky/rose — those stay urgency. */
const DOCTOR_CALENDAR_PALETTE: PaletteEntry[] = [
  {
    block:
      'bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-950/40 dark:text-violet-200 dark:border-violet-800',
    swatch: 'bg-violet-100 border-violet-300 dark:bg-violet-950/40 dark:border-violet-800',
  },
  {
    block:
      'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800',
    swatch: 'bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800',
  },
  {
    block:
      'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800',
    swatch: 'bg-amber-100 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800',
  },
  {
    block:
      'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950/40 dark:text-teal-200 dark:border-teal-800',
    swatch: 'bg-teal-100 border-teal-300 dark:bg-teal-950/40 dark:border-teal-800',
  },
  {
    block:
      'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-800',
    swatch: 'bg-indigo-100 border-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-800',
  },
  {
    block:
      'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300 dark:bg-fuchsia-950/40 dark:text-fuchsia-200 dark:border-fuchsia-800',
    swatch: 'bg-fuchsia-100 border-fuchsia-300 dark:bg-fuchsia-950/40 dark:border-fuchsia-800',
  },
  {
    block:
      'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-800',
    swatch: 'bg-orange-100 border-orange-300 dark:bg-orange-950/40 dark:border-orange-800',
  },
  {
    block:
      'bg-lime-100 text-lime-900 border-lime-300 dark:bg-lime-950/40 dark:text-lime-200 dark:border-lime-800',
    swatch: 'bg-lime-100 border-lime-300 dark:bg-lime-950/40 dark:border-lime-800',
  },
  {
    block:
      'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-200 dark:border-cyan-800',
    swatch: 'bg-cyan-100 border-cyan-300 dark:bg-cyan-950/40 dark:border-cyan-800',
  },
  {
    block:
      'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-800',
    swatch: 'bg-purple-100 border-purple-300 dark:bg-purple-950/40 dark:border-purple-800',
  },
];

const UNASSIGNED: PaletteEntry = {
  block:
    'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-700',
  swatch: 'bg-slate-100 border-slate-300 dark:bg-slate-900/40 dark:border-slate-700',
};

export const doctorUrgentStripeClass = 'border-l-4 border-l-rose-600';

function hashUuid(uuid: string): number {
  let h = 2166136261;
  for (let i = 0; i < uuid.length; i++) {
    h ^= uuid.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % DOCTOR_CALENDAR_PALETTE.length;
}

function paletteEntry(doctorUuid?: string | null): PaletteEntry {
  if (!doctorUuid) return UNASSIGNED;
  return DOCTOR_CALENDAR_PALETTE[hashUuid(doctorUuid)];
}

export function doctorCalendarColorIndex(doctorUuid: string): number {
  return hashUuid(doctorUuid);
}

export function doctorCalendarBlockClass(doctorUuid?: string | null): string {
  return paletteEntry(doctorUuid).block;
}

export function doctorCalendarSwatchClass(doctorUuid?: string | null): string {
  return paletteEntry(doctorUuid).swatch;
}

/** Attended visit: doctor palette fill + outcome border (rose urgent, emerald routine). */
export function doctorAttendedCalendarBlockClass(
  doctorUuid: string | null | undefined,
  urgent: boolean
): string {
  return cn(
    doctorCalendarBlockClass(doctorUuid),
    urgent
      ? 'border-2 border-rose-600 dark:border-rose-500'
      : 'border-2 border-emerald-600 dark:border-emerald-500'
  );
}

function stripDrPrefix(name: string): string {
  return name.replace(/^Dr\.?\s*/i, '').trim();
}

export function doctorDisplayName(
  event: {
    doctorUuid?: string | null;
    visit?: { doctorName?: string | null };
    booking?: { doctorName?: string | null };
  },
  doctors?: DoctorColorIdentity[]
): string | null {
  const fromList = event.doctorUuid
    ? doctors?.find((d) => d.doctorUuid === event.doctorUuid)?.name
    : undefined;
  const raw = fromList || event.visit?.doctorName || event.booking?.doctorName;
  if (!raw?.trim()) return null;
  return stripDrPrefix(raw) || null;
}
