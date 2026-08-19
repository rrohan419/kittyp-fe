export type VisitPrescriptionSource = {
  uuid: string;
  completedAt?: string | null;
  startedAt?: string | null;
  createdAt?: string | null;
  doctorName?: string | null;
  chart?: {
    plan?: string | null;
    examinationNotes?: string | null;
    assessment?: string | null;
    nextVisitNotes?: string | null;
    internalNotes?: string | null;
    vitals?: Record<string, unknown> | null;
  } | null;
};

export type PrescriptionHistoryItem = {
  visitUuid: string;
  bookingId: string;
  date: string | null;
  doctorName: string | null;
  plan: string;
};

export type VitalHistoryItem = {
  visitUuid: string;
  date: string | null;
  doctorName: string | null;
  weightKg: string;
  temperatureC: string;
};

export type NoteHistoryItem = {
  visitUuid: string;
  date: string | null;
  doctorName: string | null;
  examinationNotes: string;
  assessment: string;
  nextVisitNotes: string;
  internalNotes: string;
};

export function visitRecordDate(visit: VisitPrescriptionSource): string | null {
  return visit.completedAt || visit.startedAt || visit.createdAt || null;
}

function sortByDateDesc<T extends { date: string | null }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const at = a.date ? Date.parse(a.date) : 0;
    const bt = b.date ? Date.parse(b.date) : 0;
    return bt - at;
  });
}

export function prescriptionsFromVisits(
  visits: VisitPrescriptionSource[],
  excludeVisitUuid?: string | null
): PrescriptionHistoryItem[] {
  const rows: PrescriptionHistoryItem[] = [];
  for (const visit of visits) {
    if (excludeVisitUuid && visit.uuid === excludeVisitUuid) continue;
    const plan = visit.chart?.plan?.trim() ?? '';
    if (!plan) continue;
    rows.push({
      visitUuid: visit.uuid,
      bookingId: visit.uuid,
      date: visitRecordDate(visit),
      doctorName: visit.doctorName ?? null,
      plan,
    });
  }
  return sortByDateDesc(rows);
}

export function vitalsFromVisits(visits: VisitPrescriptionSource[]): VitalHistoryItem[] {
  const rows: VitalHistoryItem[] = [];
  for (const visit of visits) {
    const raw = visit.chart?.vitals;
    const weightKg = raw?.weightKg != null && raw.weightKg !== '' ? String(raw.weightKg) : '';
    const temperatureC =
      raw?.temperatureC != null && raw.temperatureC !== '' ? String(raw.temperatureC) : '';
    if (!weightKg && !temperatureC) continue;
    rows.push({
      visitUuid: visit.uuid,
      date: visitRecordDate(visit),
      doctorName: visit.doctorName ?? null,
      weightKg,
      temperatureC,
    });
  }
  return sortByDateDesc(rows);
}

export function notesFromVisits(visits: VisitPrescriptionSource[]): NoteHistoryItem[] {
  const rows: NoteHistoryItem[] = [];
  for (const visit of visits) {
    const examinationNotes = visit.chart?.examinationNotes?.trim() ?? '';
    const assessment = visit.chart?.assessment?.trim() ?? '';
    const nextVisitNotes = visit.chart?.nextVisitNotes?.trim() ?? '';
    const internalNotes = visit.chart?.internalNotes?.trim() ?? '';
    if (!examinationNotes && !assessment && !nextVisitNotes && !internalNotes) continue;
    rows.push({
      visitUuid: visit.uuid,
      date: visitRecordDate(visit),
      doctorName: visit.doctorName ?? null,
      examinationNotes,
      assessment,
      nextVisitNotes,
      internalNotes,
    });
  }
  return sortByDateDesc(rows);
}
