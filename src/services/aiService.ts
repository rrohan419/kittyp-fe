import axiosInstance from '@/config/axionInstance';
import { PetProfile } from './authService';
import { ApiSuccessResponse } from './cartService';


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

export interface DailyFeedingPlan {
  caloriesPerDay: number;
  meals: Meal[];
  supplements: Supplement[];
}

export interface SpecialConsideration {
  condition: string;
  recommendation: string;
}

export type ProductCategory = "food" | "supplement" | "accessory";

export interface RecommendedProduct {
  productName: string;
  category: ProductCategory;
  purpose: string;
  url: string;
}

export interface PetCarePlan {
  petProfileSummary: PetProfileSummary;
  environmentalImpact: EnvironmentalImpact;
  dailyFeedingPlan: DailyFeedingPlan;
  specialConsiderations: SpecialConsideration[];
  recommendedProducts: RecommendedProduct[];
  longTermWellnessTips: string[];
  vetAdviceDisclaimer: string;
}

export const defaultPetCarePlan: PetCarePlan = {
  petProfileSummary: {
    name: "",
    type: "",
    breed: "",
    age: "",
    weight: "",
    activityLevel: "",
    gender: "",
    currentFoodBrand: "",
    healthConditions: "",
    allergies: "",
  },
  environmentalImpact: {
    climateConsiderations: "",
    hydrationNeeds: "",
    energyNeedsAdjustment: "",
  },
  dailyFeedingPlan: {
    caloriesPerDay: 0,
    meals: [
      {
        time: "",
        foodType: "",
        portionSizeGrams: 0,
        notes: "",
      },
    ],
    supplements: [
      {
        name: "",
        purpose: "",
        dosage: "",
      },
    ],
  },
  specialConsiderations: [
    {
      condition: "",
      recommendation: "",
    },
  ],
  recommendedProducts: [
    {
      productName: "",
      category: "food",
      purpose: "",
      url: "",
    },
  ],
  longTermWellnessTips: [""],
  vetAdviceDisclaimer: "",
};


export interface VetTriageAssessment {
  urgencyLevel: 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
  message: string;
  symptoms: string[];
  actions: string[];
  followUp: {
    timeframe: string;
    instructions: string[];
  };
  riskFactors: string[];
  preventionTips: string[];
  generatedAt: string;
}

export interface AIChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: {
    petId?: string;
    context?: string;
    confidence?: number;
  };
}

export interface AIChatSession {
  id: string;
  userId: string;
  petId?: string;
  messages: AIChatMessage[];
  startedAt: Date;
  lastActivity: Date;
  context: {
    petProfile?: PetProfile;
    userConcerns?: string[];
    previousRecommendations?: string[];
  };
}

// AI Service Configuration
const AI_CONFIG = {
  NUTRITION_CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  VET_TRIAGE_CACHE_DURATION: 60 * 60 * 1000, // 1 hour
  MAX_CHAT_MESSAGES: 50,
  RATE_LIMIT: {
    NUTRITION_GENERATION: 10, // per day
    VET_CHAT: 20, // per day
    VET_TRIAGE: 5, // per day
  }
};

// Cache management
class AICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

const aiCache = new AICache();

// Analytics tracking
class AIAnalytics {
  private events: Array<{
    event: string;
    userId: string;
    petId?: string;
    timestamp: Date;
    metadata?: any;
  }> = [];

  track(event: string, userId: string, petId?: string, metadata?: any): void {
    this.events.push({
      event,
      userId,
      petId,
      timestamp: new Date(),
      metadata
    });

    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics service (e.g., Mixpanel, Amplitude)
      console.log('AI Analytics:', { event, userId, petId, metadata });
    }
  }

  getEvents(): any[] {
    return this.events;
  }
}

const aiAnalytics = new AIAnalytics();

// Rate limiting
class RateLimiter {
  private limits = new Map<string, { count: number; resetTime: number }>();

  checkLimit(userId: string, action: string, limit: number): boolean {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const current = this.limits.get(key);

    if (!current || now > current.resetTime) {
      this.limits.set(key, { count: 1, resetTime: now + 24 * 60 * 60 * 1000 });
      return true;
    }

    if (current.count >= limit) {
      return false;
    }

    current.count++;
    return true;
  }

  getRemaining(userId: string, action: string): number {
    const key = `${userId}:${action}`;
    const current = this.limits.get(key);
    if (!current) return AI_CONFIG.RATE_LIMIT[action as keyof typeof AI_CONFIG.RATE_LIMIT] || 0;
    return Math.max(0, (AI_CONFIG.RATE_LIMIT[action as keyof typeof AI_CONFIG.RATE_LIMIT] || 0) - current.count);
  }
}

const rateLimiter = new RateLimiter();

// AI Service Functions
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export const generateNutritionRecommendation = async (
  petProfile: PetProfile,
  userId: string,
  location?: LocationData
): Promise<PetCarePlan> => {
  try {
    // Check rate limit
    if (!rateLimiter.checkLimit(userId, 'NUTRITION_GENERATION', AI_CONFIG.RATE_LIMIT.NUTRITION_GENERATION)) {
      throw new Error('Daily nutrition generation limit reached. Please try again tomorrow.');
    }

    console.log('location data ', location);

    // Check cache (include location in cache key if provided)
    const locationKey = location ? `:${location.latitude.toFixed(3)}:${location.longitude.toFixed(3)}` : '';
    const cacheKey = `nutrition:${petProfile.uuid}:${userId}${locationKey}`;
    const cached = aiCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Track analytics
    aiAnalytics.track('nutrition_generation_started', userId, petProfile.uuid, {
      petType: petProfile.breed,
      petDob: (petProfile as any).dateOfBirth,
      petWeight: petProfile.weight,
      hasLocation: !!location
    });

    // Call AI service
    const requestData: any = {
      petProfile,
      userId,
      timestamp: new Date().toISOString()
    };

    // Add location data if provided
    if (location) {
      requestData.location = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp
      };
    }

    const response = await axiosInstance.post<ApiSuccessResponse<PetCarePlan>>('/ai/nutrition/generate', requestData);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to generate nutrition recommendation');
    }

    const recommendation: PetCarePlan = response.data.data;
    
    // Cache the result
    aiCache.set(cacheKey, recommendation, AI_CONFIG.NUTRITION_CACHE_DURATION);

    // Track success
    // aiAnalytics.track('nutrition_generation_completed', userId, petProfile.uuid, {
    //   healthScore: recommendation.insights.healthScore,
    //   productCount: recommendation.products.length,
    //   hasLocation: !!location
    // });

    return recommendation;

  } catch (error: any) {
    // Track error
    aiAnalytics.track('nutrition_generation_error', userId, petProfile.uuid, {
      error: error.message,
      hasLocation: !!location
    });

    throw new Error(error.message || 'Failed to generate nutrition recommendation');
  }
};

export const generateVetTriageAssessment = async (
  symptoms: string[],
  petProfile: PetProfile,
  userId: string,
  additionalInfo?: string
): Promise<VetTriageAssessment> => {
  try {
    // Check rate limit
    if (!rateLimiter.checkLimit(userId, 'VET_TRIAGE', AI_CONFIG.RATE_LIMIT.VET_TRIAGE)) {
      throw new Error('Daily vet triage limit reached. Please try again tomorrow.');
    }

    // Check cache for similar assessments
    const cacheKey = `triage:${petProfile.uuid}:${symptoms.sort().join(',')}`;
    const cached = aiCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Track analytics
    aiAnalytics.track('vet_triage_started', userId, petProfile.uuid, {
      symptoms,
      symptomCount: symptoms.length
    });

    // Call AI service
    const response = await axiosInstance.post('/ai/vet/triage', {
      symptoms,
      petProfile,
      userId,
      additionalInfo,
      timestamp: new Date().toISOString()
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to generate vet triage assessment');
    }

    const assessment: VetTriageAssessment = response.data.data;
    
    // Cache the result
    aiCache.set(cacheKey, assessment, AI_CONFIG.VET_TRIAGE_CACHE_DURATION);

    // Track success
    aiAnalytics.track('vet_triage_completed', userId, petProfile.uuid, {
      urgencyLevel: assessment.urgencyLevel,
      actionCount: assessment.actions.length
    });

    return assessment;

  } catch (error: any) {
    // Track error
    aiAnalytics.track('vet_triage_error', userId, petProfile.uuid, {
      error: error.message
    });

    throw new Error(error.message || 'Failed to generate vet triage assessment');
  }
};

export const sendAIChatMessage = async (
  message: string,
  sessionId: string,
  userId: string,
  petId?: string,
  context?: any
): Promise<AIChatMessage> => {
  try {
    // Check rate limit
    if (!rateLimiter.checkLimit(userId, 'VET_CHAT', AI_CONFIG.RATE_LIMIT.VET_CHAT)) {
      throw new Error('Daily chat limit reached. Please upgrade to premium for unlimited chats.');
    }

    // Track analytics
    aiAnalytics.track('ai_chat_message_sent', userId, petId, {
      sessionId,
      messageLength: message.length,
      hasContext: !!context
    });

    // Call AI service
    const response = await axiosInstance.post('/ai/chat/message', {
      message,
      sessionId,
      userId,
      petId,
      context,
      timestamp: new Date().toISOString()
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to send chat message');
    }

    const aiMessage: AIChatMessage = response.data.data;

    // Track success
    aiAnalytics.track('ai_chat_message_received', userId, petId, {
      sessionId,
      responseLength: aiMessage.content.length,
      confidence: aiMessage.metadata?.confidence
    });

    return aiMessage;

  } catch (error: any) {
    // Track error
    aiAnalytics.track('ai_chat_message_error', userId, petId, {
      error: error.message,
      sessionId
    });

    throw new Error(error.message || 'Failed to send chat message');
  }
};

export const createAIChatSession = async (
  userId: string,
  petUuid?: string,
  initialContext?: any
): Promise<AIChatSession> => {
  try {
    const response = await axiosInstance.post('/ai/chat/session', {
      userId,
      petUuid,
      initialContext,
      timestamp: new Date().toISOString()
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create chat session');
    }

    const session: AIChatSession = response.data.data;

    // Track session creation
    aiAnalytics.track('ai_chat_session_created', userId, petUuid, {
      sessionId: session.id,
      hasPetContext: !!petUuid
    });

    return session;

  } catch (error: any) {
    throw new Error(error.message || 'Failed to create chat session');
  }
};

export const getAIChatHistory = async (userId: string): Promise<AIChatSession[]> => {
  try {
    const response = await axiosInstance.get(`/ai/chat/history/${userId}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch chat history');
    }

    return response.data.data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch chat history');
  }
};

// Utility functions
export const getRemainingQuota = (userId: string) => ({
  nutrition: rateLimiter.getRemaining(userId, 'NUTRITION_GENERATION'),
  vetChat: rateLimiter.getRemaining(userId, 'VET_CHAT'),
  vetTriage: rateLimiter.getRemaining(userId, 'VET_TRIAGE')
});

export const clearAICache = (): void => {
  aiCache.clear();
};

export const getAIAnalytics = () => {
  return aiAnalytics.getEvents();
};

// Error handling utilities
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export const handleAIError = (error: any): AIError => {
  if (error instanceof AIError) {
    return error;
  }

  // Handle different types of errors
  if (error.response?.status === 429) {
    return new AIError(
      'Rate limit exceeded',
      'RATE_LIMIT_EXCEEDED',
      true,
      'You have reached the daily limit. Please try again tomorrow or upgrade to premium.'
    );
  }

  if (error.response?.status === 503) {
    return new AIError(
      'AI service temporarily unavailable',
      'SERVICE_UNAVAILABLE',
      true,
      'Our AI service is temporarily unavailable. Please try again in a few minutes.'
    );
  }

  return new AIError(
    error.message || 'Unknown error occurred',
    'UNKNOWN_ERROR',
    false,
    'Something went wrong. Please try again.'
  );
}; 