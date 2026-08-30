/** Doctor color key from visit, booking, or event envelope. */
export function resolveEventDoctorUuid(
  ev: {
    doctorUuid?: string | null;
    visit?: { doctorUuid?: string | null };
    booking?: { doctorUuid?: string | null };
  },
  fallback?: string | null
): string | null | undefined {
  return ev.doctorUuid ?? ev.visit?.doctorUuid ?? ev.booking?.doctorUuid ?? fallback;
}

type PracticeScopedEvent = {
  visit?: { clinicUuid?: string | null };
  booking?: { clinicUuid?: string | null };
};

/** Keep only events for the active practice on doctor calendar. */
export function filterPracticeWeekEvents<T extends PracticeScopedEvent>(
  events: T[],
  clinicUuid: string | null | undefined,
  isPersonalPractice: boolean
): T[] {
  if (!clinicUuid) return events;
  return events.filter((e) => {
    const cid = e.visit?.clinicUuid ?? e.booking?.clinicUuid;
    if (isPersonalPractice) return !cid || cid === clinicUuid;
    return cid === clinicUuid;
  });
}
