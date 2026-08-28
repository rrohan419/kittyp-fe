import axiosInstance from '@/config/axionInstance';
import { API_BASE_URL } from '@/config/env';
import { ApiSuccessResponse } from './cartService';

export type DoctorStatus =
  | 'REGISTERED'
  | 'DOCUMENTS_SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'PUBLISHED'
  | 'REJECTED';

export interface DoctorVerificationModel {
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  specialization?: string;
  registrationNumber?: string;
  status: DoctorStatus;
  degreeCertificateUrl?: string;
  registrationCertificateUrl?: string;
  governmentIdUrl?: string;
  clinicPhotosUrls?: string;
  clinicAddress?: string;
  clinicName?: string;
  hasClinic: boolean;
  clinicPriority: boolean;
  requiresGovernmentIdCheck: boolean;
  requiresClinicChecks: boolean;
  requiresClinicPhotosCheck: boolean;
  emailOtpVerified: boolean;
  phoneOtpVerified: boolean;
  checkMobileOtp: boolean;
  checkEmailOtp: boolean;
  checkGovernmentId: boolean;
  checkDegree: boolean;
  checkRegistrationCertificate: boolean;
  checkClinicAddress: boolean;
  checkRegistrationNumber: boolean;
  checkGoogleMapsMatch: boolean;
  checkClinicPhotos: boolean;
  submittedAt?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export type ChecklistKey =
  | 'checkMobileOtp'
  | 'checkEmailOtp'
  | 'checkGovernmentId'
  | 'checkDegree'
  | 'checkRegistrationCertificate'
  | 'checkClinicAddress'
  | 'checkRegistrationNumber'
  | 'checkGoogleMapsMatch'
  | 'checkClinicPhotos';

export async function sendSignupOtp(body: {
  channel: 'EMAIL' | 'PHONE';
  email?: string;
  phone?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/auth/signup/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function verifySignupOtp(body: {
  channel: 'EMAIL' | 'PHONE';
  email?: string;
  phone?: string;
  code: string;
}) {
  const res = await fetch(`${API_BASE_URL}/auth/signup/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchMyDoctorProfile() {
  const res = await axiosInstance.get<ApiSuccessResponse<DoctorVerificationModel>>('/doctor/me');
  return res.data.data;
}

export async function fetchAdminDoctors(status?: DoctorStatus) {
  const res = await axiosInstance.get<ApiSuccessResponse<DoctorVerificationModel[]>>('/admin/doctors', {
    params: status ? { status } : undefined,
  });
  return res.data.data ?? [];
}

export async function fetchAdminDoctor(uuid: string) {
  const res = await axiosInstance.get<ApiSuccessResponse<DoctorVerificationModel>>(`/admin/doctors/${uuid}`);
  return res.data.data;
}

export async function updateDoctorChecklist(uuid: string, checklist: Partial<Record<ChecklistKey, boolean>>) {
  const res = await axiosInstance.patch<ApiSuccessResponse<DoctorVerificationModel>>(
    `/admin/doctors/${uuid}/checklist`,
    checklist
  );
  return res.data.data;
}

export async function updateDoctorStatus(uuid: string, status: DoctorStatus, reviewNotes?: string) {
  const res = await axiosInstance.patch<ApiSuccessResponse<DoctorVerificationModel>>(
    `/admin/doctors/${uuid}/status`,
    { status, reviewNotes }
  );
  return res.data.data;
}

export const DOCTOR_STATUS_STEPS: DoctorStatus[] = [
  'REGISTERED',
  'DOCUMENTS_SUBMITTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'PUBLISHED',
];

export function statusLabel(status: DoctorStatus | string | null | undefined): string {
  if (!status) return 'Unknown';
  return String(status)
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function isPracticeReady(status?: DoctorStatus | string | null): boolean {
  return status === 'VERIFIED' || status === 'PUBLISHED';
}

export function isChecklistItemApplicable(doctor: DoctorVerificationModel, key: ChecklistKey): boolean {
  switch (key) {
    case 'checkGovernmentId':
      return doctor.requiresGovernmentIdCheck;
    case 'checkClinicAddress':
    case 'checkGoogleMapsMatch':
    case 'checkClinicPhotos':
      return false;
    default:
      return true;
  }
}

export function allApplicableChecksPassed(doctor: DoctorVerificationModel): boolean {
  const keys: ChecklistKey[] = [
    'checkMobileOtp',
    'checkEmailOtp',
    'checkGovernmentId',
    'checkDegree',
    'checkRegistrationCertificate',
    'checkRegistrationNumber',
  ];
  return keys.every((key) => !isChecklistItemApplicable(doctor, key) || Boolean(doctor[key]));
}
