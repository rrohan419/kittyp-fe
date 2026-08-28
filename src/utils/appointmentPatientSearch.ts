/** Add-appointment search: email or generated IDs only (not name or phone). */
export const APPOINTMENT_SEARCH_MIN = 3;
const PUBLIC_ID = /^[A-Za-z0-9]{6}$/;

/** 6-character pet/owner IDs are stored uppercase. */
export function normalizeAppointmentSearchQuery(q: string): string {
  const t = q.trim();
  return PUBLIC_ID.test(t) ? t.toUpperCase() : t;
}

export function matchesEmailOrGeneratedId(
  query: string,
  ...ids: Array<string | null | undefined>
): boolean {
  const q = normalizeAppointmentSearchQuery(query).toLowerCase();
  if (q.length < APPOINTMENT_SEARCH_MIN) return false;
  return ids.some((v) => typeof v === 'string' && v.toLowerCase().includes(q));
}
