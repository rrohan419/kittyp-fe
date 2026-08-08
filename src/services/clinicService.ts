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
  /** True when the current user owns this clinic (personal practice). */
  personal?: boolean;
}

export interface ClinicDoctorModel {
  doctorUuid: string;
  userUuid: string;
  name: string;
  email?: string;
  specialization?: string;
  role?: string;
  isActive?: boolean;
  status?: string;
  photoUrl?: string;
}

export interface ClinicDoctorPatientModel {
  pet: ClinicPetListModel;
  owner: OwnerSummaryModel;
  appointmentCount: number;
  lastAppointment?: string;
}

export interface ClinicDoctorDetailModel {
  doctorUuid: string;
  userUuid: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  specialization?: string;
  registrationNumber?: string;
  licenseNumber?: string;
  bio?: string;
  photoUrl?: string;
  experienceYears?: number;
  role?: string;
  isActive?: boolean;
  joinedAt?: string;
  status?: string;
  degreeCertificateUrl?: string;
  registrationCertificateUrl?: string;
  governmentIdUrl?: string;
  licenseDocumentUrl?: string;
  clinicPhotosUrls?: string;
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
  patients: ClinicDoctorPatientModel[];
}

export interface ClinicPatientModel {
  petUuid: string;
  petName: string;
  ownerName: string;
  ownerEmail?: string;
  lastVisit?: string;
  ownerUuid?: string;
  ownerPhone?: string;
  ownerAddress?: string;
  species?: string;
  breed?: string;
}

export interface OwnerSummaryModel {
  ownerUuid: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  linked?: boolean;
  linkedUserUuid?: string;
}

export interface PatientPetModel {
  petUuid: string;
  petName: string;
  species?: string;
  breed?: string;
  lastVisit?: string;
  atThisClinic?: boolean;
  globalPetId?: string;
  microchipNumber?: string;
}

export interface ClinicOwnerPetModel {
  petUuid: string;
  globalPetId?: string;
  name: string;
  species?: string;
  breed?: string;
  gender?: string;
  dateOfBirth?: string;
  weight?: string;
  microchipNumber?: string;
  photoUrl?: string;
  patientNumber?: string;
  lastVisit?: string;
}

export interface ClinicOwnerModel {
  ownerUuid: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  notes?: string;
  linked: boolean;
  linkedUserUuid?: string;
  petCount: number;
  lastVisit?: string;
  pets: ClinicOwnerPetModel[];
}

export interface PlatformUserSearchModel {
  userUuid: string;
  name: string;
  email?: string;
  phone?: string;
  clinicOwnerUuid?: string;
  alreadyClient: boolean;
}

export interface ClinicOwnerProfileModel {
  owner: ClinicOwnerModel;
  billingStatus: string;
  invoiceCount: number;
}

export interface ClinicPetListModel {
  petUuid: string;
  globalPetId?: string;
  name: string;
  species?: string;
  breed?: string;
  gender?: string;
  dateOfBirth?: string;
  weight?: string;
  microchipNumber?: string;
  photoUrl?: string;
  patientNumber?: string;
  ownerUuid: string;
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  linked: boolean;
  lastVisit?: string;
}

export interface InvoiceSummaryModel {
  uuid: string;
  status?: string;
  amount?: string;
  currency?: string;
  petUuid?: string;
  createdAt?: string;
}

export interface ClinicPetMedicalProfileModel {
  pet: ClinicPetListModel;
  owner: OwnerSummaryModel;
  timeline: HealthEventModel[];
  appointments: ClinicBookingModel[];
  vaccinations: VaccineScheduleModel[];
  prescriptions: string[];
  labReports: string[];
  surgeries: string[];
  invoices: InvoiceSummaryModel[];
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
  clinicUuid?: string;
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
  owner?: OwnerSummaryModel;
  pets?: PatientPetModel[];
  healthEvents: HealthEventModel[];
  vaccineSchedule: VaccineScheduleModel[];
}

export interface ClinicStatsModel {
  diagnosedPetCount: number;
  patientCount: number;
}

export interface ClinicCreateRequest {
  name: string;
  licenseNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  operatingHours?: string;
}

export async function fetchMyClinics(): Promise<ClinicModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicModel[]>>('/clinic/mine');
  return res.data.data ?? [];
}

export async function fetchUserClinics(): Promise<ClinicModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicModel[]>>('/user/clinics');
  return res.data.data ?? [];
}

export async function switchClinic(clinicUuid: string): Promise<ClinicModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<ClinicModel>>('/user/switch-clinic', {
    clinicUuid,
  });
  return res.data.data;
}

export async function createClinic(payload: ClinicCreateRequest): Promise<ClinicModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<ClinicModel>>('/clinic', payload);
  return res.data.data;
}

export async function shutdownClinic(clinicUuid: string): Promise<ClinicModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<ClinicModel>>(`/clinic/${clinicUuid}/shutdown`);
  return res.data.data;
}

export async function reopenClinic(clinicUuid: string): Promise<ClinicModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<ClinicModel>>(`/clinic/${clinicUuid}/reopen`);
  return res.data.data;
}

export async function fetchClinicStats(clinicUuid: string): Promise<ClinicStatsModel> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicStatsModel>>(`/clinic/${clinicUuid}/stats`);
  return res.data.data;
}

export async function fetchClinic(uuid: string): Promise<ClinicModel> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicModel>>(`/clinic/${uuid}`);
  return res.data.data;
}

export async function fetchClinicDoctors(clinicUuid: string): Promise<ClinicDoctorModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicDoctorModel[]>>(`/clinic/${clinicUuid}/doctors`);
  return res.data.data ?? [];
}

export async function fetchClinicDoctorDetail(
  clinicUuid: string,
  doctorUuid: string
): Promise<ClinicDoctorDetailModel> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicDoctorDetailModel>>(
    `/clinic/${clinicUuid}/doctors/${doctorUuid}`
  );
  return res.data.data;
}

export interface DoctorInviteModel {
  uuid: string;
  email: string;
  doctorName: string;
  status: string;
  expiresAt: string;
  clinicUuid: string;
  clinicName: string;
  /** Present only on GET /clinic/my-doctor-invites (doctor inbox). */
  token?: string | null;
  createdAt?: string | null;
  lastRemindedAt?: string | null;
  canRemind?: boolean | null;
}

export interface DoctorInvitePreview {
  clinicName: string;
  doctorName: string;
  email: string;
  expired: boolean;
  accepted: boolean;
  status: string;
}

export async function inviteDoctor(
  clinicUuid: string,
  payload: { name?: string; email?: string; doctorUuid?: string }
): Promise<DoctorInviteModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<DoctorInviteModel>>(
    `/clinic/${clinicUuid}/doctors/invite`,
    payload
  );
  return res.data.data;
}

export async function lookupDoctorByUuid(doctorUuid: string): Promise<{
  doctorUuid: string;
  name: string;
  email: string;
}> {
  const res = await axiosInstance.get<
    ApiSuccessResponse<{ doctorUuid: string; name: string; email: string }>
  >(`/clinic/doctors/lookup`, { params: { uuid: doctorUuid } });
  return res.data.data;
}

export async function fetchDoctorInvites(clinicUuid: string): Promise<DoctorInviteModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<DoctorInviteModel[]>>(
    `/clinic/${clinicUuid}/doctors/invites`
  );
  return res.data.data ?? [];
}

/** Pending clinic invites for the signed-in doctor (includes accept token). */
export async function fetchMyPendingInvites(): Promise<DoctorInviteModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<DoctorInviteModel[]>>('/clinic/my-doctor-invites');
  return res.data.data ?? [];
}

export async function revokeDoctorInvite(clinicUuid: string, inviteUuid: string): Promise<void> {
  await axiosInstance.post(`/clinic/${clinicUuid}/doctors/invites/${inviteUuid}/revoke`);
}

export async function remindDoctorInvite(
  clinicUuid: string,
  inviteUuid: string
): Promise<DoctorInviteModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<DoctorInviteModel>>(
    `/clinic/${clinicUuid}/doctors/invites/${inviteUuid}/remind`
  );
  return res.data.data;
}

export async function fetchInviteByToken(token: string): Promise<DoctorInvitePreview> {
  const res = await axiosInstance.get<ApiSuccessResponse<DoctorInvitePreview>>(`/clinic/invites/${token}`);
  return res.data.data;
}

export async function acceptInvite(token: string): Promise<ClinicDoctorModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<ClinicDoctorModel>>(`/clinic/invites/${token}/accept`);
  return res.data.data;
}

export async function rejectInvite(token: string): Promise<void> {
  await axiosInstance.post(`/clinic/invites/${token}/reject`);
}

export async function fetchClinicPatients(clinicUuid: string): Promise<ClinicPatientModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicPatientModel[]>>(`/clinic/${clinicUuid}/patients`);
  return res.data.data ?? [];
}

export interface AddPatientRequest {
  ownerFirstName: string;
  ownerLastName?: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerAddress?: string;
  petName: string;
  petType?: string;
  petBreed?: string;
  petGender?: string;
  petDateOfBirth?: string;
}

export async function addClinicPatient(
  clinicUuid: string,
  payload: AddPatientRequest
): Promise<PatientDetailModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<PatientDetailModel>>(
    `/clinic/${clinicUuid}/patients`,
    payload
  );
  return res.data.data;
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

export async function fetchClinicOwners(clinicUuid: string, q?: string): Promise<ClinicOwnerModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicOwnerModel[]>>(
    `/clinic/${clinicUuid}/owners`,
    { params: q ? { q } : undefined }
  );
  return res.data.data ?? [];
}

export async function searchPlatformUsers(
  clinicUuid: string,
  q: string
): Promise<PlatformUserSearchModel[]> {
  const query = q.trim();
  if (query.length < 3) return [];
  const res = await axiosInstance.get<ApiSuccessResponse<PlatformUserSearchModel[]>>(
    `/clinic/${clinicUuid}/users/search`,
    { params: { q: query }, headers: { 'Cache-Control': 'no-cache' } }
  );
  return res.data.data ?? [];
}

export async function ensureClinicOwnerFromUser(
  clinicUuid: string,
  userUuid: string
): Promise<ClinicOwnerModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<ClinicOwnerModel>>(
    `/clinic/${clinicUuid}/owners/from-user`,
    { userUuid }
  );
  return res.data.data;
}

export async function createClinicOwner(
  clinicUuid: string,
  payload: {
    firstName: string;
    lastName?: string;
    email: string;
    phone: string;
    alternatePhone?: string;
    address?: string;
    notes?: string;
  }
): Promise<ClinicOwnerModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<ClinicOwnerModel>>(
    `/clinic/${clinicUuid}/owners`,
    payload
  );
  return res.data.data;
}

export async function fetchClinicOwnerProfile(
  clinicUuid: string,
  ownerUuid: string
): Promise<ClinicOwnerProfileModel> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicOwnerProfileModel>>(
    `/clinic/${clinicUuid}/owners/${ownerUuid}`
  );
  return res.data.data;
}

export async function addPetToClinicOwner(
  clinicUuid: string,
  ownerUuid: string,
  payload: {
    name: string;
    species?: string;
    breed?: string;
    gender?: string;
    dateOfBirth?: string;
    weight?: string;
    microchipNumber?: string;
    photoUrl?: string;
    patientNumber?: string;
  }
): Promise<ClinicPetListModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<ClinicPetListModel>>(
    `/clinic/${clinicUuid}/owners/${ownerUuid}/pets`,
    payload
  );
  return res.data.data;
}

export async function fetchClinicPets(clinicUuid: string, q?: string): Promise<ClinicPetListModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicPetListModel[]>>(
    `/clinic/${clinicUuid}/pets`,
    { params: q ? { q } : undefined }
  );
  return res.data.data ?? [];
}

export async function hideClinicPet(clinicUuid: string, petUuid: string): Promise<void> {
  await axiosInstance.post(`/clinic/${clinicUuid}/pets/${petUuid}/hide`);
}

export async function hideClinicOwner(clinicUuid: string, ownerUuid: string): Promise<void> {
  await axiosInstance.post(`/clinic/${clinicUuid}/owners/${ownerUuid}/hide`);
}

export async function fetchClinicPetMedicalProfile(
  clinicUuid: string,
  petUuid: string
): Promise<ClinicPetMedicalProfileModel> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicPetMedicalProfileModel>>(
    `/clinic/${clinicUuid}/pets/${petUuid}`
  );
  return res.data.data;
}

export async function fetchClinicBookings(clinicUuid: string, page = 0, size = 20) {
  const res = await axiosInstance.get<ApiSuccessResponse<{ models: ClinicBookingModel[]; totalElements: number }>>(
    `/clinic/${clinicUuid}/bookings`,
    { params: { page, size } }
  );
  return res.data.data;
}

export type VisitStatus =
  | 'WAITLIST'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'CHECKING_OUT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type VisitUrgency = 'ROUTINE' | 'URGENT';

export interface VisitChartModel {
  examinationNotes?: string;
  assessment?: string;
  plan?: string;
  nextVisitNotes?: string;
  vitals?: Record<string, unknown> | null;
  internalNotes?: string | null;
}

export interface ClinicVisitModel {
  uuid: string;
  clinicUuid: string;
  clinicName?: string;
  petUuid: string;
  petName: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  doctorUuid?: string | null;
  doctorName?: string | null;
  doctorSpecialization?: string | null;
  doctorExperienceYears?: number | null;
  source: string;
  channel: string;
  status: VisitStatus;
  urgency: VisitUrgency;
  reasonForVisit?: string;
  checkedInAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  chart?: VisitChartModel;
  invoiceUuid?: string;
  healthEventUuid?: string;
}

export async function fetchClinicVisits(
  clinicUuid: string,
  params?: { date?: string; status?: VisitStatus; doctorUuid?: string }
): Promise<ClinicVisitModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicVisitModel[]>>(
    `/clinic/${clinicUuid}/visits`,
    { params }
  );
  return res.data.data ?? [];
}

export async function fetchDoctorBusySlots(
  clinicUuid: string,
  doctorUuid: string,
  range: { from: string; to: string }
): Promise<ClinicBookingModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicBookingModel[]>>(
    `/clinic/${clinicUuid}/doctors/${doctorUuid}/busy`,
    { params: { from: range.from, to: range.to } }
  );
  return res.data.data ?? [];
}

export async function createWalkInVisit(
  clinicUuid: string,
  payload: {
    petUuid?: string;
    owner?: {
      firstName: string;
      lastName?: string;
      email: string;
      phone: string;
      address?: string;
    };
    newPet?: { name: string; species?: string; breed?: string; gender?: string };
    reasonForVisit?: string;
    urgency?: VisitUrgency;
    doctorUuid?: string;
  }
): Promise<ClinicVisitModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<ClinicVisitModel>>(
    `/clinic/${clinicUuid}/visits/walk-in`,
    payload
  );
  return res.data.data;
}

export async function createClinicBooking(
  clinicUuid: string,
  payload: {
    petUuid?: string;
    owner?: {
      firstName: string;
      lastName?: string;
      email: string;
      phone: string;
      address?: string;
    };
    newPet?: { name: string; species?: string; breed?: string; gender?: string };
    doctorUuid: string;
    slotStart: string;
    slotEnd?: string;
    durationMinutes?: number;
    notes?: string;
    mode?: 'IN_PERSON' | 'VIDEO';
  }
): Promise<ClinicBookingModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<ClinicBookingModel>>(
    `/clinic/${clinicUuid}/bookings`,
    payload
  );
  return res.data.data;
}

export async function patchClinicVisit(
  clinicUuid: string,
  visitUuid: string,
  payload: {
    status?: VisitStatus;
    doctorUuid?: string | null;
    urgency?: VisitUrgency;
    reasonForVisit?: string;
  }
): Promise<ClinicVisitModel> {
  const res = await axiosInstance.patch<ApiSuccessResponse<ClinicVisitModel>>(
    `/clinic/${clinicUuid}/visits/${visitUuid}`,
    payload
  );
  return res.data.data;
}

export async function fetchClinicPetVisits(
  clinicUuid: string,
  petUuid: string
): Promise<ClinicVisitModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicVisitModel[]>>(
    `/clinic/${clinicUuid}/patients/${petUuid}/visits`
  );
  return res.data.data ?? [];
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
