import axiosInstance from '@/config/axionInstance';
import { PaginationModel, WrappedPaginationResponse } from './adminService';
import { ApiSuccessResponse } from './cartService';
import type { PetCarePlan } from './aiService';

export type NutritionPlanStatus = 'DRAFT' | 'APPROVED' | 'SENT';

export interface NutritionPlan {
  uuid: string;
  planName: string;
  isActivePlan: boolean;
  tags: string[] | null;
  notes: string | null;
  generationTimestamp: string;
  petUuid: string;
  userUuid: string;
  parentUserUuid?: string | null;
  doctorUserUuid?: string | null;
  status?: NutritionPlanStatus | string;
  approvedAt?: string | null;
  sentAt?: string | null;
  nutritionRecommendationResponse: NutritionRecommendationResponse;
}

export interface NutritionRecommendationResponse {
  petProfileSummary: PetProfileSummary;
  environmentalImpact: EnvironmentalImpact;
  dailyFeedingPlan: DailyFeedingPlan;
  specialConsiderations: SpecialConsideration[];
  recommendedProducts: RecommendedProduct[];
  longTermWellnessTips: string[];
  vetAdviceDisclaimer: string | null;
  environment: Environment;
}

export interface PetProfileSummary {
  name: string;
  type: string;
  breed: string;
  age: string;
  weight: string;
  activityLevel: string;
  gender: string;
  currentFoodBrand: string;
  healthConditions: string;
  allergies: string;
}

export interface EnvironmentalImpact {
  climateConsiderations: string;
  hydrationNeeds: string;
  energyNeedsAdjustment: string;
}

export interface DailyFeedingPlan {
  caloriesPerDay: number;
  meals: Meal[];
  supplements: Supplement[];
}

export interface Meal {
  time: string;
  foodType: string;
  portionSizeGrams: number;
  notes: string;
}

export interface Supplement {
  name: string;
  purpose: string;
  dosage: string;
}

export interface SpecialConsideration {
  condition: string;
  recommendation: string;
}

export interface RecommendedProduct {
  productName: string;
  category: string;
  purpose: string;
  url: string;
}

export interface Environment {
  temperature: number;
  unit: string;
  humidity: number;
  weatherCondition: string;
  windSpeed: number;
  windUnit: string;
  uvIndex: number;
  precipitation: number;
}

export interface PetDailyPlanItem {
  id?: number;
  petUuid?: string;
  nutritionPlanUuid?: string;
  itemType?: string;
  itemName?: string;
  time?: string;
  quantityInGrams?: number;
  notes?: string;
  day?: string;
  planMonth?: number;
  planYear?: number;
  active?: boolean;
}

export const fetchFilteredNutritionPlans = async (
  page: number = 0,
  size: number = 10,
  options: {
    petUuid?: string;
    isActive?: boolean;
    status?: string;
    doctorUserUuid?: string;
    userUuid?: string;
    searchText?: string;
  } = {}
): Promise<PaginationModel<NutritionPlan>> => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (options.petUuid) params.set('petUuid', options.petUuid);
  if (options.isActive !== undefined) params.set('isActive', String(options.isActive));
  if (options.status) params.set('status', options.status);
  if (options.doctorUserUuid) params.set('doctorUserUuid', options.doctorUserUuid);
  if (options.userUuid) params.set('userUuid', options.userUuid);
  if (options.searchText) params.set('searchText', options.searchText);

  const response = await axiosInstance.post<WrappedPaginationResponse<NutritionPlan>>(
    `/ai/nutrition/plans/filter?${params.toString()}`
  );
  return response.data.data;
};

export const approveNutritionPlan = async (uuid: string): Promise<NutritionPlan> => {
  const res = await axiosInstance.post<ApiSuccessResponse<NutritionPlan>>(
    `/ai/nutrition/plans/${uuid}/approve`
  );
  return res.data.data;
};

export const sendNutritionPlan = async (uuid: string): Promise<NutritionPlan> => {
  const res = await axiosInstance.post<ApiSuccessResponse<NutritionPlan>>(
    `/ai/nutrition/plans/${uuid}/send`
  );
  return res.data.data;
};

export const updateNutritionPlan = async (
  uuid: string,
  body: {
    recommendationResponse: PetCarePlan;
    environmentDataDto?: PetCarePlan['environment'];
  }
): Promise<NutritionPlan> => {
  const res = await axiosInstance.patch<ApiSuccessResponse<NutritionPlan>>(
    `/ai/nutrition/plans/${uuid}`,
    body
  );
  return res.data.data;
};

export const fetchActiveNutritionPlan = async (petUuid: string): Promise<NutritionPlan> => {
  const res = await axiosInstance.get<ApiSuccessResponse<NutritionPlan>>(
    `/ai/nutrition/plans/active`,
    { params: { petUuid } }
  );
  return res.data.data;
};

export const fetchPetDailyPlan = async (petUuid: string): Promise<PetDailyPlanItem[]> => {
  const res = await axiosInstance.get<ApiSuccessResponse<PetDailyPlanItem[]>>(
    `/nutrition/pets/${petUuid}/daily-plan`
  );
  return res.data.data ?? [];
};

export const planResponseToPetCarePlan = (plan: NutritionPlan): PetCarePlan => {
  const r = plan.nutritionRecommendationResponse;
  return {
    uuid: plan.uuid,
    petProfileSummary: r?.petProfileSummary ?? ({} as PetCarePlan['petProfileSummary']),
    environmentalImpact: r?.environmentalImpact ?? ({} as PetCarePlan['environmentalImpact']),
    dailyFeedingPlan: r?.dailyFeedingPlan ?? { caloriesPerDay: 0, meals: [], supplements: [] },
    specialConsiderations: r?.specialConsiderations ?? [],
    recommendedProducts: (r?.recommendedProducts ?? []) as PetCarePlan['recommendedProducts'],
    longTermWellnessTips: r?.longTermWellnessTips ?? [],
    vetAdviceDisclaimer: r?.vetAdviceDisclaimer ?? '',
  };
};
