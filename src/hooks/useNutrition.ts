import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  createFeedingLog,
  fetchFeedingLogs,
  fetchWeightHistory,
  logPetWeight,
  type FeedingLogModel,
  type WeightLogModel,
} from '@/services/petDashboardService';
import {
  fetchActiveNutritionPlan,
  fetchPetDailyPlan,
  type NutritionPlan as ApiNutritionPlan,
  type PetDailyPlanItem,
} from '@/services/petNutritionService';
import { DailyLog, NutritionPlan, NutritionStats, WeightLog } from '@/types/nutrition';

export const useNutrition = (petId: string) => {
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (!petId) {
      setNutritionPlan(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      fetchActiveNutritionPlan(petId).catch((requestError: unknown) => {
        if (axios.isAxiosError(requestError) && requestError.response?.status === 404) return null;
        throw requestError;
      }),
      fetchPetDailyPlan(petId),
      fetchFeedingLogs(petId),
      fetchWeightHistory(petId),
    ])
      .then(([plan, dailyItems, feedingLogs, weights]) => {
        if (!cancelled) {
          setNutritionPlan(plan ? toNutritionPlan(plan, dailyItems, feedingLogs, weights, petId) : null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNutritionPlan(null);
          setError('Could not load nutrition data.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [petId, refreshKey]);

  const retry = useCallback(() => setRefreshKey((value) => value + 1), []);

  const stats = useMemo((): NutritionStats | null => {
    if (!nutritionPlan) return null;
    const last7Days = nutritionPlan.dailyLogs.slice(-7);
    const completed = last7Days.filter((log) => log.status === 'completed').length;
    const hydrationValues = last7Days.flatMap((log) => log.hydrationMl == null ? [] : [log.hydrationMl]);
    const hydrationTarget = nutritionPlan.dailyFeedingPlan.hydrationTarget;
    const hydrationScore = hydrationTarget && hydrationValues.length > 0
      ? (hydrationValues.reduce((sum, value) => sum + value, 0) / (hydrationTarget * hydrationValues.length)) * 100
      : undefined;
    const recentWeights = nutritionPlan.weightHistory.slice(-3);
    let weightTrend: NutritionStats['weightTrend'] = 'stable';
    if (recentWeights.length >= 2) {
      const diff = recentWeights[recentWeights.length - 1].weight - recentWeights[0].weight;
      if (diff > 0.3) weightTrend = 'increasing';
      else if (diff < -0.3) weightTrend = 'decreasing';
    }
    return {
      caloriesPerDay: nutritionPlan.dailyFeedingPlan.caloriesPerDay,
      hydrationScore: hydrationScore == null ? undefined : Math.min(100, Math.round(hydrationScore)),
      weightTrend,
      mealCompletionRate: last7Days.length ? Math.round((completed / last7Days.length) * 100) : undefined,
    };
  }, [nutritionPlan]);

  const selectedDayLog = useMemo(() => {
    const date = selectedDate.toISOString().split('T')[0];
    return nutritionPlan?.dailyLogs.find((log) => log.date === date) || null;
  }, [nutritionPlan, selectedDate]);

  const refresh = useCallback(() => retry(), [retry]);

  const updateDailyLog = useCallback(async (_date: string, updates: Partial<DailyLog>) => {
    void updates;
  }, []);

  const toggleMealCompletion = useCallback(async (date: string, mealIndex: number) => {
    const meal = nutritionPlan?.dailyLogs.find((log) => log.date === date)?.meals[mealIndex];
    if (!petId || !meal) return;
    await createFeedingLog(petId, { status: 'COMPLETED', notes: meal.foodType, loggedAt: `${date}T12:00:00` });
    refresh();
  }, [nutritionPlan, petId, refresh]);

  const toggleSupplementCompletion = useCallback(async (_date: string, _supplementIndex: number) => undefined, []);

  const logWeight = useCallback(async (date: string, weight: number) => {
    if (!petId) return;
    await logPetWeight(petId, { weight, recordedAt: `${date}T12:00:00` });
    refresh();
  }, [petId, refresh]);

  return {
    nutritionPlan,
    stats,
    selectedDate,
    setSelectedDate,
    selectedDayLog,
    isLoading,
    error,
    retry,
    updateDailyLog,
    toggleMealCompletion,
    toggleSupplementCompletion,
    logWeight,
  };
};

function toNutritionPlan(
  plan: ApiNutritionPlan,
  dailyItems: PetDailyPlanItem[],
  logs: FeedingLogModel[],
  weights: WeightLogModel[],
  petId: string,
): NutritionPlan {
  const profile = plan.nutritionRecommendationResponse?.petProfileSummary;
  const feeding = plan.nutritionRecommendationResponse?.dailyFeedingPlan;
  const dates = Array.from(new Set([
    ...dailyItems.map((item) => item.day?.slice(0, 10)).filter(Boolean),
    ...logs.map((log) => log.loggedAt?.slice(0, 10)).filter(Boolean),
  ])) as string[];

  const dailyLogs: DailyLog[] = dates.sort().map((date) => {
    const dayItems = dailyItems.filter((item) => item.day?.slice(0, 10) === date);
    const dayLogs = logs.filter((log) => log.loggedAt?.slice(0, 10) === date);
    const meals = dayItems.map((item) => ({
      time: item.time || '',
      foodType: item.itemName || '',
      portionSize: item.quantityInGrams == null ? '' : `${item.quantityInGrams}g`,
      completed: dayLogs.some((log) => log.dailyPlanId === item.id && log.status === 'COMPLETED'),
    }));
    return {
      date,
      status: dayLogs.some((log) => log.status === 'SKIPPED')
        ? 'skipped'
        : meals.length > 0 && meals.every((meal) => meal.completed) ? 'completed' : 'pending',
      meals,
      supplements: [],
      notes: dayLogs.map((log) => log.notes).filter(Boolean).join('; '),
    };
  });

  return {
    petProfileSummary: {
      petId,
      name: profile?.name || '',
      breed: profile?.breed,
      age: profile?.age,
      weight: profile?.weight,
      activityLevel: profile?.activityLevel,
      currentFoodBrand: profile?.currentFoodBrand,
    },
    dailyFeedingPlan: {
      caloriesPerDay: feeding?.caloriesPerDay,
      meals: feeding?.meals?.map((meal) => ({
        time: meal.time,
        foodType: meal.foodType,
        portionSize: meal.portionSizeGrams == null ? '' : `${meal.portionSizeGrams}g`,
        calories: undefined,
        completed: false,
      })) || [],
      supplements: [],
    },
    specialConsiderations: plan.nutritionRecommendationResponse?.specialConsiderations?.map((item) => `${item.condition}: ${item.recommendation}`) || [],
    recommendedProducts: plan.nutritionRecommendationResponse?.recommendedProducts?.map((product, index) => ({
      id: `${product.productName}-${index}`,
      name: product.productName,
      category: product.category,
      purpose: product.purpose,
      buyLink: product.url,
      imageUrl: '',
    })) || [],
    longTermWellnessTips: plan.nutritionRecommendationResponse?.longTermWellnessTips?.map((tip, index) => ({
      id: `${plan.uuid}-tip-${index}`,
      title: tip,
    })) || [],
    dailyLogs,
    weightHistory: weights.map((weight): WeightLog => ({
      date: weight.recordedAt.slice(0, 10),
      weight: weight.weight,
    })),
  };
}
