import axiosInstance from "@/config/axionInstance";
import { PaginationModel, WrappedPaginationResponse } from "./adminService";

export interface NutritionPlan {
    uuid: string;
    planName: string;
    isActivePlan: boolean;
    tags: string[] | null;
    notes: string | null;
    generationTimestamp: string;
    petUuid: string;
    userUuid: string;
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

export const fetchFilteredNutritionPlans = async (
    page: number = 0,
    size: number = 10,
    petUuid: string,
    isActive: boolean = true
): Promise<PaginationModel<NutritionPlan>> => {
    const response = await axiosInstance.post<
        WrappedPaginationResponse<NutritionPlan>
    >(
        `/ai/nutrition/plans/filter?page=${page}&size=${size}&petUuid=${petUuid}&isActive=${isActive}`
    );

    return response.data.data;
};
