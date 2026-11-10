import type { WeightLogModel } from '@/services/petDashboardService';
import type { WeightLog } from '@/types/nutrition';

export function toWeightHistory(weights: WeightLogModel[]): WeightLog[] {
  return weights.map((weight) => ({
    id: weight.id,
    date: weight.recordedAt,
    weight: weight.weight,
    note: weight.note,
    visitUuid: weight.visitUuid,
    recordedBy: weight.recordedBy,
    correctedBy: weight.correctedBy,
    correctedAt: weight.correctedAt,
  })).sort((a, b) => a.date.localeCompare(b.date) || (a.id ?? 0) - (b.id ?? 0));
}
