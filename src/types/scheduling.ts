export interface VetProfile {
  id: string;
  fullName: string;
  specialization?: string;
  specializations?: string[];
  rating?: number;
  reviewCount?: number;
  location?: string;
  profileImage?: string;
  profileImageUrl?: string;
  isVerified?: boolean;
  consultationPrice?: number;
  bio?: string;
  experience?: number;
  languages?: string[];
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  consultationType: string;
  price: number;
  isAvailable?: boolean;
  isBooked?: boolean;
  vetId?: string;
  timezone?: string;
}

export interface VetAvailability {
  id: string;
  vetId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  slotDuration: number;
  price: number;
  consultationType: string;
  isActive: boolean;
}

export type BookingStatus = 'scheduled' | 'cancelled' | 'completed' | 'no-show';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Booking {
  id: string;
  userId: string;
  vetId: string;
  timeSlotId: string;
  startTime: string;
  endTime: string;
  consultationType: string;
  status: BookingStatus;
  price: number;
  paymentStatus: PaymentStatus;
  notes: string;
  prescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingFilters {
  location?: string;
  specialization?: string;
  specializations?: string[];
  languages?: string[];
  consultationType?: string;
  rating?: number;
  priceRange?: [number, number];
  date?: string;
  urgency?: 'low' | 'medium' | 'high';
  searchText?: string;
}
