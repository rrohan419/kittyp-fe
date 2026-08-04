import axiosInstance from '@/config/axionInstance';
import { ApiSuccessResponse } from './cartService';

export interface ClinicModel {
  uuid: string;
  name: string;
  licenseNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  operatingHours?: string;
  status?: string;
}

export interface ClinicDoctorModel {
  doctorUuid: string;
  userUuid: string;
  name: string;
  email?: string;
  specialization?: string;
  role?: string;
  isActive?: boolean;
}

export interface ClinicPatientModel {
  petUuid: string;
  petName: string;
  ownerName: string;
  ownerEmail?: string;
  lastVisit?: string;
}

export interface ClinicBookingModel {
  uuid: string;
  petUuid: string;
  petName: string;
  ownerName: string;
  doctorUuid?: string;
  slotStart: string;
  slotEnd?: string;
  timezone?: string;
  status: string;
  mode?: string;
  notes?: string;
}

export interface RetentionAlertModel {
  id: string;
  petUuid: string;
  petName: string;
  ownerName: string;
  type: string;
  message: string;
  dueInDays: number;
  status: string;
}

export interface HealthEventModel {
  uuid: string;
  type: string;
  title: string;
  description?: string;
  date: string;
  isPast?: boolean;
  status?: string;
  attachments?: string[];
}

export interface VaccineScheduleModel {
  id: number;
  vaccineName: string;
  dueDate: string;
  completed?: boolean;
  completedDate?: string;
}

export interface PatientDetailModel {
  patient: ClinicPatientModel;
  healthEvents: HealthEventModel[];
  vaccineSchedule: VaccineScheduleModel[];
}

export async function fetchMyClinics(): Promise<ClinicModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicModel[]>>('/clinic/mine');
  return res.data.data ?? [];
}

export async function fetchClinic(uuid: string): Promise<ClinicModel> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicModel>>(`/clinic/${uuid}`);
  return res.data.data;
}

export async function fetchClinicDoctors(clinicUuid: string): Promise<ClinicDoctorModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicDoctorModel[]>>(`/clinic/${clinicUuid}/doctors`);
  return res.data.data ?? [];
}

export async function fetchClinicPatients(clinicUuid: string): Promise<ClinicPatientModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicPatientModel[]>>(`/clinic/${clinicUuid}/patients`);
  return res.data.data ?? [];
}

export async function fetchClinicPatientDetail(
  clinicUuid: string,
  petUuid: string
): Promise<PatientDetailModel> {
  const res = await axiosInstance.get<ApiSuccessResponse<PatientDetailModel>>(
    `/clinic/${clinicUuid}/patients/${petUuid}`
  );
  return res.data.data;
}

export async function fetchClinicBookings(clinicUuid: string, page = 1, size = 20) {
  const res = await axiosInstance.get<ApiSuccessResponse<{ models: ClinicBookingModel[]; totalElements: number }>>(
    `/clinic/${clinicUuid}/bookings`,
    { params: { page, size } }
  );
  return res.data.data;
}

export async function fetchRetentionAlerts(clinicUuid: string): Promise<RetentionAlertModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<RetentionAlertModel[]>>(
    `/clinic/${clinicUuid}/retention-alerts`
  );
  return res.data.data ?? [];
}

export async function notifyRetentionAlert(clinicUuid: string, alertId: string): Promise<void> {
  await axiosInstance.post(`/clinic/${clinicUuid}/retention-alerts/${alertId}/notify`);
}
