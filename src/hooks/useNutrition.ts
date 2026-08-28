import { useState, useEffect, useMemo } from 'react';
import { NutritionPlan, DailyLog, WeightLog, NutritionStats } from '@/types/nutrition';

export const useNutrition = (petId: string) => {
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Mock data - in production, this would fetch from API
  useEffect(() => {
    setIsLoading(true);
    
    // Generate mock data for the past 30 days
    const generateDailyLogs = (): DailyLog[] => {
      const logs: DailyLog[] = [];
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const statuses: ('completed' | 'pending' | 'skipped')[] = ['completed', 'completed', 'completed', 'pending', 'skipped'];
        const status = i === 0 ? 'pending' : statuses[Math.floor(Math.random() * statuses.length)];
        
        logs.push({
          date: dateStr,
          status,
          meals: [
            { time: '08:00', foodType: 'Dry Kibble', portionSize: '1 cup', calories: 95, completed: status === 'completed' },
            { time: '12:00', foodType: 'Wet Food', portionSize: '0.5 can', calories: 95, completed: status === 'completed' },
            { time: '18:00', foodType: 'Dry Kibble', portionSize: '1 cup', calories: 95, completed: status === 'completed' },
          ],
          supplements: [
            { name: 'Omega-3', purpose: 'Joint health', dosage: '1 capsule', completed: status === 'completed' },
            { name: 'Multivitamin', purpose: 'Overall wellness', dosage: '1 tablet', completed: status === 'completed' },
          ],
          hydrationMl: status === 'completed' ? 800 + Math.random() * 200 : 0,
          weight: i % 3 === 0 ? 25 + Math.random() * 0.5 : undefined,
          notes: status === 'completed' ? 'Good appetite today' : '',
        });
      }
      
      return logs.reverse();
    };

    const generateWeightHistory = (): WeightLog[] => {
      const history: WeightLog[] = [];
      const today = new Date();
      
      for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 3));
        history.push({
          date: date.toISOString().split('T')[0],
          weight: 25 + (Math.random() - 0.5) * 0.8,
        });
      }
      
      return history.reverse();
    };

    const mockPlan: NutritionPlan = {
      petProfileSummary: {
        petId,
        name: 'Buddy',
        breed: 'Golden Retriever',
        age: 3,
        weight: 25,
        activityLevel: 'moderate',
        currentFoodBrand: 'Royal Canin Medium Adult',
      },
      dailyFeedingPlan: {
        caloriesPerDay: 285,
        meals: [
          { time: '08:00', foodType: 'Dry Kibble', portionSize: '1 cup', calories: 95, completed: false },
          { time: '12:00', foodType: 'Wet Food', portionSize: '0.5 can', calories: 95, completed: false },
          { time: '18:00', foodType: 'Dry Kibble', portionSize: '1 cup', calories: 95, completed: false },
        ],
        supplements: [
          { name: 'Omega-3', purpose: 'Joint health', dosage: '1 capsule', completed: false },
          { name: 'Multivitamin', purpose: 'Overall wellness', dosage: '1 tablet', completed: false },
        ],
        hydrationTarget: 1000,
      },
      specialConsiderations: [
        'Prone to hip dysplasia - monitor weight carefully',
        'Sensitive stomach - avoid sudden food changes',
        'High energy - ensure adequate calories for activity level',
      ],
      recommendedProducts: [
        {
          id: '1',
          name: 'Royal Canin Medium Adult',
          category: 'Food',
          purpose: 'Complete nutrition for medium breeds',
          imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400',
          buyLink: 'https://www.amazon.com/s?k=royal+canin+medium+adult',
          price: '$52.99',
        },
        {
          id: '2',
          name: 'Nordic Naturals Omega-3',
          category: 'Supplement',
          purpose: 'Supports joint and heart health',
          imageUrl: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400',
          buyLink: 'https://www.amazon.com/s?k=pet+omega+3+supplement',
          price: '$24.99',
        },
        {
          id: '3',
          name: 'Stainless Steel Water Bowl',
          category: 'Accessory',
          purpose: 'Easy to clean, prevents bacteria',
          imageUrl: 'https://images.unsplash.com/photo-1591769225440-811ad7d6eab3?w=400',
          buyLink: 'https://www.amazon.com/s?k=dog+water+bowl',
          price: '$15.99',
        },
      ],
      longTermWellnessTips: [
        {
          id: '1',
          title: 'Fresh Water Always',
          description: 'Ensure your pet has access to clean, fresh water throughout the day. Change water at least twice daily.',
          frequency: 'daily',
          category: 'hydration',
        },
        {
          id: '2',
          title: 'Dental Care',
          description: 'Brush your pet\'s teeth or provide dental chews to prevent plaque buildup and maintain oral health.',
          frequency: 'daily',
          category: 'dental',
        },
        {
          id: '3',
          title: 'Regular Exercise',
          description: 'Golden Retrievers need at least 60 minutes of exercise daily. Mix walks with playtime for best results.',
          frequency: 'daily',
          category: 'exercise',
        },
        {
          id: '4',
          title: 'Weight Check',
          description: 'Weigh your pet weekly to track weight trends and adjust portions if needed.',
          frequency: 'weekly',
          category: 'general',
        },
        {
          id: '5',
          title: 'Vet Checkup',
          description: 'Schedule annual vet visits for vaccinations, health screenings, and professional advice.',
          frequency: 'monthly',
          category: 'vet',
        },
      ],
      dailyLogs: generateDailyLogs(),
      weightHistory: generateWeightHistory(),
    };

    setNutritionPlan(mockPlan);
    setIsLoading(false);
  }, [petId]);

  const stats = useMemo((): NutritionStats | null => {
    if (!nutritionPlan) return null;

    const last7Days = nutritionPlan.dailyLogs.slice(-7);
    const completed = last7Days.filter(log => log.status === 'completed').length;
    const hydrationSum = last7Days.reduce((sum, log) => sum + log.hydrationMl, 0);
    const hydrationScore = (hydrationSum / (nutritionPlan.dailyFeedingPlan.hydrationTarget * 7)) * 100;

    const recentWeights = nutritionPlan.weightHistory.slice(-3);
    let weightTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (recentWeights.length >= 2) {
      const diff = recentWeights[recentWeights.length - 1].weight - recentWeights[0].weight;
      if (diff > 0.3) weightTrend = 'increasing';
      else if (diff < -0.3) weightTrend = 'decreasing';
    }

    return {
      caloriesPerDay: nutritionPlan.dailyFeedingPlan.caloriesPerDay,
      hydrationScore: Math.min(100, Math.round(hydrationScore)),
      weightTrend,
      mealCompletionRate: Math.round((completed / 7) * 100),
    };
  }, [nutritionPlan]);

  const selectedDayLog = useMemo(() => {
    if (!nutritionPlan) return null;
    const dateStr = selectedDate.toISOString().split('T')[0];
    return nutritionPlan.dailyLogs.find(log => log.date === dateStr) || null;
  }, [nutritionPlan, selectedDate]);

  const updateDailyLog = (date: string, updates: Partial<DailyLog>) => {
    if (!nutritionPlan) return;

    setNutritionPlan(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        dailyLogs: prev.dailyLogs.map(log =>
          log.date === date ? { ...log, ...updates } : log
        ),
      };
    });
  };

  const toggleMealCompletion = (date: string, mealIndex: number) => {
    if (!nutritionPlan) return;

    const log = nutritionPlan.dailyLogs.find(l => l.date === date);
    if (!log) return;

    const updatedMeals = log.meals.map((meal, idx) =>
      idx === mealIndex ? { ...meal, completed: !meal.completed } : meal
    );

    const allCompleted = updatedMeals.every(m => m.completed) && 
                         log.supplements.every(s => s.completed);

    updateDailyLog(date, {
      meals: updatedMeals,
      status: allCompleted ? 'completed' : 'pending',
    });
  };

  const toggleSupplementCompletion = (date: string, supplementIndex: number) => {
    if (!nutritionPlan) return;

    const log = nutritionPlan.dailyLogs.find(l => l.date === date);
    if (!log) return;

    const updatedSupplements = log.supplements.map((supp, idx) =>
      idx === supplementIndex ? { ...supp, completed: !supp.completed } : supp
    );

    const allCompleted = log.meals.every(m => m.completed) && 
                         updatedSupplements.every(s => s.completed);

    updateDailyLog(date, {
      supplements: updatedSupplements,
      status: allCompleted ? 'completed' : 'pending',
    });
  };

  const logWeight = (date: string, weight: number) => {
    if (!nutritionPlan) return;

    setNutritionPlan(prev => {
      if (!prev) return prev;
      
      const existingIndex = prev.weightHistory.findIndex(w => w.date === date);
      const updatedHistory = existingIndex >= 0
        ? prev.weightHistory.map((w, idx) => idx === existingIndex ? { date, weight } : w)
        : [...prev.weightHistory, { date, weight }].sort((a, b) => a.date.localeCompare(b.date));

      return {
        ...prev,
        weightHistory: updatedHistory,
      };
    });

    updateDailyLog(date, { weight });
  };

  return {
    nutritionPlan,
    stats,
    selectedDate,
    setSelectedDate,
    selectedDayLog,
    isLoading,
    updateDailyLog,
    toggleMealCompletion,
    toggleSupplementCompletion,
    logWeight,
  };
};
