import type { VisitChartModel } from '@/services/clinicService';
import { EMPTY_NOTES, EMPTY_VITALS, type ChartNotesSlice, type ChartVitalsSlice } from './chartTabs';

type VisitWithChart = {
  chart?: VisitChartModel | null;
};

export function chartSlicesFromVisit(visit: VisitWithChart): {
  vitals: ChartVitalsSlice;
  notes: ChartNotesSlice;
  plan: string;
} {
  const vitals = visit.chart?.vitals as { weightKg?: number; temperatureC?: number } | undefined;
  return {
    vitals: {
      weightKg: vitals?.weightKg != null ? String(vitals.weightKg) : EMPTY_VITALS.weightKg,
      temperatureC: vitals?.temperatureC != null ? String(vitals.temperatureC) : EMPTY_VITALS.temperatureC,
    },
    notes: {
      examinationNotes: visit.chart?.examinationNotes || EMPTY_NOTES.examinationNotes,
      assessment: visit.chart?.assessment || EMPTY_NOTES.assessment,
      nextVisitNotes: visit.chart?.nextVisitNotes || EMPTY_NOTES.nextVisitNotes,
      internalNotes: visit.chart?.internalNotes || EMPTY_NOTES.internalNotes,
    },
    plan: visit.chart?.plan || '',
  };
}
