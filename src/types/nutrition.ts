export interface PetProfileSummary {
    petId: string;
    name: string;
    breed: string;
    age: number;
    weight: number;
    activityLevel: 'low' | 'moderate' | 'high';
    currentFoodBrand: string;
  }
  
  export interface Meal {
    time: string;
    foodType: string;
    portionSize: string;
    calories: number;
    completed: boolean;
  }
  
  export interface Supplement {
    name: string;
    purpose: string;
    dosage: string;
    completed: boolean;
  }
  
  export interface DailyFeedingPlan {
    caloriesPerDay: number;
    meals: Meal[];
    supplements: Supplement[];
    hydrationTarget: number; // ml per day
  }
  
  export interface DailyLog {
    date: string; // ISO date string
    status: 'completed' | 'pending' | 'skipped';
    meals: Meal[];
    supplements: Supplement[];
    hydrationMl: number;
    weight?: number;
    notes: string;
  }
  
  export interface WeightLog {
    date: string;
    weight: number;
  }
  
  export interface RecommendedProduct {
    id: string;
    name: string;
    category: string;
    purpose: string;
    imageUrl: string;
    buyLink: string;
    price?: string;
  }
  
  export interface WellnessTip {
    id: string;
    title: string;
    description: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    category: 'hydration' | 'dental' | 'exercise' | 'vet' | 'grooming' | 'general';
  }
  
  export interface NutritionPlan {
    petProfileSummary: PetProfileSummary;
    dailyFeedingPlan: DailyFeedingPlan;
    specialConsiderations: string[];
    recommendedProducts: RecommendedProduct[];
    longTermWellnessTips: WellnessTip[];
    dailyLogs: DailyLog[];
    weightHistory: WeightLog[];
  }
  
  export interface NutritionStats {
    caloriesPerDay: number;
    hydrationScore: number; // percentage
    weightTrend: 'increasing' | 'stable' | 'decreasing';
    mealCompletionRate: number; // percentage
  }
  