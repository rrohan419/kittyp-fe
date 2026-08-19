export const CHART_TAB_IDS = ['vitals', 'notes', 'prescriptions'] as const;

export type ChartTabId = (typeof CHART_TAB_IDS)[number];

export function isChartTabId(value: string | null | undefined): value is ChartTabId {
  return value === 'vitals' || value === 'notes' || value === 'prescriptions';
}

export const PATIENT_DASHBOARD_TABS = [
  'timeline',
  'appointments',
  'prescriptions',
  'vaccinations',
  'labs',
  'surgeries',
  'invoices',
] as const;

export type PatientDashboardTab = (typeof PATIENT_DASHBOARD_TABS)[number];

export function parsePatientDashboardTab(value: string | null | undefined): PatientDashboardTab {
  if (value && (PATIENT_DASHBOARD_TABS as readonly string[]).includes(value)) {
    return value as PatientDashboardTab;
  }
  return 'timeline';
}

export interface ChartVitalsSlice {
  weightKg: string;
  temperatureC: string;
}

export interface ChartNotesSlice {
  examinationNotes: string;
  assessment: string;
  nextVisitNotes: string;
  internalNotes: string;
}

export const EMPTY_VITALS: ChartVitalsSlice = { weightKg: '', temperatureC: '' };

export const EMPTY_NOTES: ChartNotesSlice = {
  examinationNotes: '',
  assessment: '',
  nextVisitNotes: '',
  internalNotes: '',
};
