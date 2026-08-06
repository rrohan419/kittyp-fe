import axiosInstance from '@/config/axionInstance';
import { ApiSuccessResponse } from './cartService';
import { VetAvailability } from '@/types/scheduling';

export interface AvailabilityException {
  id: string;
  date: string;
  type: 'unavailable' | 'holiday' | 'reduced-hours' | 'emergency-only';
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
}

export interface DoctorAvailabilityResponse {
  doctorUuid: string;
  currency: string;
  slotDurationMinutes: number;
  bufferMinutes: number;
  timezone: string;
  notes?: string;
  weeklySchedule: VetAvailability[];
  exceptions: AvailabilityException[];
}

export interface DoctorAvailabilityPayload {
  slotDurationMinutes?: number;
  bufferMinutes?: number;
  timezone?: string;
  notes?: string;
  consultationFee?: number;
  weeklySchedule: VetAvailability[];
  exceptions: AvailabilityException[];
}

export async function fetchMyAvailability() {
  const res = await axiosInstance.get<ApiSuccessResponse<DoctorAvailabilityResponse>>(
    '/doctor/me/availability'
  );
  return res.data.data;
}

export async function saveMyAvailability(payload: DoctorAvailabilityPayload) {
  const res = await axiosInstance.put<ApiSuccessResponse<DoctorAvailabilityResponse>>(
    '/doctor/me/availability',
    payload
  );
  return res.data.data;
}

/** Default INR consultation prices for Indian doctors. */
export const INR_DEFAULT_PRICES = {
  general: 499,
  emergency: 999,
  'follow-up': 299,
  specialist: 799,
} as const;

export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
