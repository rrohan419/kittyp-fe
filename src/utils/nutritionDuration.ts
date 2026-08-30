export const DEFAULT_PLAN_DURATION_DAYS = 30;
export const MIN_PLAN_DURATION_DAYS = 1;
export const MAX_PLAN_DURATION_DAYS = 90;
export const PLAN_DURATION_PRESETS = [7, 14, 21, 30] as const;

export function clampPlanDurationDays(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_PLAN_DURATION_DAYS;
  }
  return Math.min(MAX_PLAN_DURATION_DAYS, Math.max(MIN_PLAN_DURATION_DAYS, Math.round(value)));
}
