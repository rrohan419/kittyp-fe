import axiosInstance from '@/config/axionInstance';
import { ApiSuccessResponse } from './cartService';
import { PetProfile } from './authService';

export interface VaccineDueModel {
  vaccineName: string;
  dueDate: string;
}

export interface ActiveNutritionPlanModel {
  uuid: string;
  planName: string;
  generatedAt?: string;
}

export interface TipOfTheDay {
  tip: string;
  date: string;
}

export interface WeightLogModel {
  id?: number;
  weight: number;
  recordedAt: string;
  note?: string;
}

export interface PetDashboardModel {
  pet: PetProfile;
  latestWeight?: WeightLogModel | null;
  openVaccineDues?: VaccineDueModel[];
  activeNutritionPlan?: ActiveNutritionPlanModel | null;
  todayFeedingCompletionCount?: number;
  tipOfTheDay?: TipOfTheDay;
}

export interface FeedingLogModel {
  id?: number;
  dailyPlanId?: number;
  status: 'COMPLETED' | 'SKIPPED' | string;
  quantity?: number;
  notes?: string;
  loggedAt?: string;
}

export async function fetchPetDashboard(petUuid: string): Promise<PetDashboardModel> {
  const res = await axiosInstance.get<ApiSuccessResponse<PetDashboardModel>>(`/pet/${petUuid}/dashboard`);
  return res.data.data;
}

export async function fetchTipOfTheDay(petUuid: string): Promise<TipOfTheDay> {
  const res = await axiosInstance.get<ApiSuccessResponse<TipOfTheDay>>('/ai/tip-of-the-day', {
    params: { petUuid },
  });
  return res.data.data;
}

export async function fetchWeightHistory(petUuid: string): Promise<WeightLogModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<WeightLogModel[]>>(`/pet/${petUuid}/weight-history`);
  return res.data.data ?? [];
}

export async function logPetWeight(
  petUuid: string,
  body: { weight: number; recordedAt?: string; note?: string }
): Promise<WeightLogModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<WeightLogModel>>(`/pet/${petUuid}/weight`, body);
  return res.data.data;
}

export async function fetchFeedingLogs(petUuid: string): Promise<FeedingLogModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<FeedingLogModel[]>>(
    `/nutrition/pets/${petUuid}/feeding-logs`
  );
  return res.data.data ?? [];
}

export async function createFeedingLog(
  petUuid: string,
  body: {
    dailyPlanId?: number;
    status: 'COMPLETED' | 'SKIPPED';
    quantity?: number;
    notes?: string;
    loggedAt?: string;
  }
): Promise<FeedingLogModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<FeedingLogModel>>(
    `/nutrition/pets/${petUuid}/feeding-logs`,
    body
  );
  return res.data.data;
}
