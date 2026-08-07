import axiosInstance from '@/config/axionInstance';
import { ApiSuccessResponse } from './cartService';
import type { ClinicBookingModel, ClinicVisitModel, VisitChartModel } from './clinicService';

export async function fetchMyDoctorVisits(date?: string): Promise<ClinicVisitModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicVisitModel[]>>('/doctor/visits/mine', {
    params: date ? { date } : undefined,
  });
  return res.data.data ?? [];
}

export async function startDoctorVisit(visitUuid: string): Promise<ClinicVisitModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<ClinicVisitModel>>(
    `/doctor/visits/${visitUuid}/start`
  );
  return res.data.data;
}

export async function saveDoctorVisitChart(
  visitUuid: string,
  chart: {
    examinationNotes?: string;
    assessment?: string;
    plan?: string;
    nextVisitNotes?: string;
    vitals?: Record<string, unknown>;
    internalNotes?: string;
  }
): Promise<ClinicVisitModel> {
  const res = await axiosInstance.put<ApiSuccessResponse<ClinicVisitModel>>(
    `/doctor/visits/${visitUuid}/chart`,
    chart
  );
  return res.data.data;
}

export async function completeDoctorVisit(visitUuid: string): Promise<ClinicVisitModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<ClinicVisitModel>>(
    `/doctor/visits/${visitUuid}/complete`
  );
  return res.data.data;
}

export async function returnDoctorVisitToReception(visitUuid: string): Promise<ClinicVisitModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<ClinicVisitModel>>(
    `/doctor/visits/${visitUuid}/return-to-reception`
  );
  return res.data.data;
}

export async function fetchParentPetVisits(petUuid: string): Promise<ClinicVisitModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicVisitModel[]>>(`/pet/${petUuid}/visits`);
  return res.data.data ?? [];
}

export async function fetchMyParentVisits(): Promise<ClinicVisitModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicVisitModel[]>>('/user/visits/mine');
  return res.data.data ?? [];
}

export async function fetchMyParentBookings(): Promise<ClinicBookingModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicBookingModel[]>>('/user/bookings/mine');
  return res.data.data ?? [];
}

export interface AttendedPatientModel {
  petUuid: string;
  petName: string;
  species?: string;
  breed?: string;
  ownerUuid?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  clinicUuid?: string;
  clinicName?: string;
  visitCount: number;
  lastVisitAt?: string;
  lastAssessment?: string;
}

export async function fetchMyAttendedPatients(): Promise<AttendedPatientModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<AttendedPatientModel[]>>(
    '/doctor/patients/attended'
  );
  return res.data.data ?? [];
}

export async function fetchMyDoctorBookings(date?: string): Promise<ClinicBookingModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicBookingModel[]>>('/doctor/bookings/mine', {
    params: date ? { date } : undefined,
  });
  return res.data.data ?? [];
}

export type { ClinicVisitModel, VisitChartModel, ClinicBookingModel };
