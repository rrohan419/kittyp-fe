import axiosInstance from '@/config/axionInstance';
import type { ApiSuccessResponse } from './cartService';

export type DoctorSmartPhrase = {
  uuid: string;
  phraseText: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export async function fetchDoctorSmartPhrases(): Promise<DoctorSmartPhrase[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<DoctorSmartPhrase[]>>('/doctor/smart-phrases');
  if (!res.data.success || !Array.isArray(res.data.data)) {
    throw new Error('Invalid smart phrases response');
  }
  return res.data.data;
}

export async function createDoctorSmartPhrase(phraseText: string): Promise<DoctorSmartPhrase> {
  const res = await axiosInstance.post<ApiSuccessResponse<DoctorSmartPhrase>>('/doctor/smart-phrases', {
    phraseText,
  });
  if (!res.data.success || !res.data.data) throw new Error('Invalid smart phrase response');
  return res.data.data;
}

export async function updateDoctorSmartPhrase(
  uuid: string,
  phraseText: string
): Promise<DoctorSmartPhrase> {
  const res = await axiosInstance.put<ApiSuccessResponse<DoctorSmartPhrase>>(
    `/doctor/smart-phrases/${uuid}`,
    { phraseText }
  );
  if (!res.data.success || !res.data.data) throw new Error('Invalid smart phrase response');
  return res.data.data;
}

export async function deleteDoctorSmartPhrase(uuid: string): Promise<void> {
  const res = await axiosInstance.delete<ApiSuccessResponse<null>>(`/doctor/smart-phrases/${uuid}`);
  if (!res.data.success) throw new Error('Could not delete smart phrase');
}
