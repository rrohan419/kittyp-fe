import axiosInstance from '@/config/axionInstance';
import { ApiSuccessResponse } from './cartService';
import { PaginationModel, emptyPage } from './adminService';
import type { ClinicBookingModel, ClinicVisitModel, VisitChartModel } from './clinicService';

export type DoctorScheduleParams = {
  date?: string;
  from?: string;
  to?: string;
  clinicUuid?: string | null;
};

export async function fetchMyDoctorVisits(params?: string | DoctorScheduleParams): Promise<ClinicVisitModel[]> {
  const query =
    typeof params === 'string'
      ? { date: params }
      : {
          date: params?.date,
          from: params?.from,
          to: params?.to,
          clinicUuid: params?.clinicUuid || undefined,
        };
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicVisitModel[]>>('/doctor/visits/mine', {
    params: query,
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

export async function fetchParentPetVisits(petUuid: string): Promise<ClinicVisitModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicVisitModel[]>>(`/pet/${petUuid}/visits`);
  return res.data.data ?? [];
}

export async function fetchMyParentVisits(): Promise<ClinicVisitModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicVisitModel[]>>('/user/visits/mine');
  return res.data.data ?? [];
}

export type AttendedPatientModel = {
  petUuid: string;
  petName: string;
  species?: string | null;
  breed?: string | null;
  dateOfBirth?: string | null;
  weight?: string | number | null;
  profilePicture?: string | null;
  activityLevel?: string | null;
  gender?: string | null;
  currentFoodBrand?: string | null;
  healthConditions?: string | null;
  allergies?: string | null;
  isNeutered?: boolean | null;
  ownerUuid?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  clinicUuid?: string | null;
  clinicName?: string | null;
  visitCount: number;
  lastVisitAt?: string | null;
  lastAssessment?: string | null;
};

export async function fetchMyAttendedPatients(
  clinicUuid?: string | null,
  opts?: { q?: string; pageNumber?: number; pageSize?: number }
): Promise<PaginationModel<AttendedPatientModel>> {
  const res = await axiosInstance.get<ApiSuccessResponse<PaginationModel<AttendedPatientModel>>>(
    '/doctor/patients/attended',
    {
      params: {
        ...(clinicUuid ? { clinicUuid } : {}),
        ...(opts?.q ? { q: opts.q } : {}),
        pageNumber: opts?.pageNumber ?? 1,
        pageSize: opts?.pageSize ?? 20,
      },
    }
  );
  return res.data.data ?? emptyPage<AttendedPatientModel>(opts?.pageSize ?? 20);
}

export type VisitRatingResult = {
  visitUuid: string;
  doctorUuid: string;
  stars: number;
  ratingLabel: string;
  doctorRating?: number | null;
  doctorReviewsCount?: number | null;
};

export async function rateParentVisit(
  visitUuid: string,
  payload: { stars: number; comment?: string }
): Promise<VisitRatingResult> {
  const res = await axiosInstance.post<ApiSuccessResponse<VisitRatingResult>>(
    `/user/visits/${visitUuid}/rating`,
    payload
  );
  return res.data.data;
}

export async function fetchMyParentBookings(): Promise<ClinicBookingModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicBookingModel[]>>('/user/bookings/mine');
  return res.data.data ?? [];
}

export async function patchParentBooking(
  bookingUuid: string,
  body: { slotStart?: string; notes?: string; status?: 'CANCELLED' }
): Promise<ClinicBookingModel> {
  const res = await axiosInstance.patch<ApiSuccessResponse<ClinicBookingModel>>(
    `/user/bookings/${bookingUuid}`,
    body
  );
  return res.data.data;
}

export async function fetchMyDoctorBookings(params?: string | DoctorScheduleParams): Promise<ClinicBookingModel[]> {
  const query =
    typeof params === 'string'
      ? { date: params }
      : {
          date: params?.date,
          from: params?.from,
          to: params?.to,
          clinicUuid: params?.clinicUuid || undefined,
        };
  const res = await axiosInstance.get<ApiSuccessResponse<ClinicBookingModel[]>>('/doctor/bookings/mine', {
    params: query,
  });
  return res.data.data ?? [];
}

export async function startDoctorBookingTreatment(bookingUuid: string): Promise<ClinicVisitModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<ClinicVisitModel>>(
    `/doctor/bookings/${bookingUuid}/start-treatment`
  );
  return res.data.data;
}

export type VideoJoinInfo = {
  bookingUuid: string;
  roomName: string;
  domain: string;
  joinUrl: string;
  displayName?: string;
};

export async function fetchBookingVideo(
  bookingUuid: string,
  portal: 'parent' | 'doctor'
): Promise<VideoJoinInfo> {
  const path =
    portal === 'doctor'
      ? `/doctor/bookings/${bookingUuid}/video`
      : `/user/bookings/${bookingUuid}/video`;
  const res = await axiosInstance.get<ApiSuccessResponse<VideoJoinInfo>>(path);
  return res.data.data;
}

export type VideoLiveInfo = {
  bookingUuid: string;
  live: boolean;
  joinOpen?: boolean;
};

export async function fetchBookingVideoLive(
  bookingUuid: string,
  portal: 'parent' | 'doctor'
): Promise<{ live: boolean; joinOpen: boolean }> {
  const path =
    portal === 'doctor'
      ? `/doctor/bookings/${bookingUuid}/video/status`
      : `/user/bookings/${bookingUuid}/video/status`;
  const res = await axiosInstance.get<ApiSuccessResponse<VideoLiveInfo>>(path);
  return {
    live: Boolean(res.data.data?.live),
    joinOpen: res.data.data?.joinOpen !== false,
  };
}

export async function heartbeatDoctorVideo(bookingUuid: string): Promise<void> {
  await axiosInstance.post(`/doctor/bookings/${bookingUuid}/video/heartbeat`);
}

export async function endDoctorVideo(bookingUuid: string): Promise<void> {
  await axiosInstance.post(`/doctor/bookings/${bookingUuid}/video/end`);
}

export type IncomingVideoCall = {
  bookingUuid: string;
  title: string;
  body: string;
  joinPath: string;
  callerName: string;
  callerPhotoUrl?: string | null;
};

export async function fetchIncomingVideoCall(): Promise<IncomingVideoCall | null> {
  const res = await axiosInstance.get<ApiSuccessResponse<IncomingVideoCall | null>>(
    '/user/video-calls/incoming'
  );
  return res.data.data ?? null;
}

export async function ackIncomingVideoCall(bookingUuid: string): Promise<void> {
  await axiosInstance.post(`/user/video-calls/${bookingUuid}/ack`);
}

export type { ClinicVisitModel, VisitChartModel, ClinicBookingModel };
