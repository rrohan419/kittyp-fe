import axiosInstance from '@/config/axionInstance';
import { ApiSuccessResponse } from './cartService';
import type { ClinicBookingModel } from './clinicService';

export interface DiscoverDoctorCard {
  doctorUuid: string;
  clinicUuid: string;
  clinicName?: string | null;
  name: string;
  specialization?: string | null;
  photoUrl?: string | null;
  experienceYears?: number | null;
  rating?: number | null;
  reviewsCount?: number | null;
  ratingLabel?: string | null;
  registrationNumber?: string | null;
  bio?: string | null;
  distanceKm?: number | null;
}

export interface DiscoverClinicCard {
  clinicUuid: string;
  name: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  profileImageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  rating?: number | null;
  reviewsCount?: number | null;
  ratingLabel?: string | null;
  doctorCount?: number | null;
  personal?: boolean | null;
  doctors?: DiscoverDoctorCard[] | null;
}

export async function discoverClinics(params: {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  city?: string;
  q?: string;
}): Promise<DiscoverClinicCard[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<DiscoverClinicCard[]>>('/discover/clinics', {
    params,
  });
  return res.data.data ?? [];
}

export async function discoverPersonalDoctors(params: {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  city?: string;
  q?: string;
}): Promise<DiscoverDoctorCard[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<DiscoverDoctorCard[]>>('/discover/doctors', {
    params,
  });
  return res.data.data ?? [];
}

export async function discoverClinicDoctors(clinicUuid: string): Promise<DiscoverDoctorCard[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<DiscoverDoctorCard[]>>(
    `/discover/clinics/${clinicUuid}/doctors`
  );
  return res.data.data ?? [];
}

export async function fetchParentDoctorSlots(
  clinicUuid: string,
  doctorUuid: string,
  date: string
): Promise<string[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<string[]>>(
    `/user/clinics/${clinicUuid}/doctors/${doctorUuid}/slots`,
    { params: { date } }
  );
  return res.data.data ?? [];
}

export async function createParentBooking(payload: {
  clinicUuid: string;
  doctorUuid: string;
  petUuid: string;
  slotStart: string;
  notes?: string;
  mode?: 'IN_PERSON' | 'VIDEO';
}): Promise<ClinicBookingModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<ClinicBookingModel>>('/user/bookings', payload);
  return res.data.data;
}
