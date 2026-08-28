import axiosInstance from '@/config/axionInstance';
import { ApiSuccessResponse } from './cartService';

export type PetReminderType = 'VISIT' | 'VACCINATION' | 'INJECTION' | 'CHECKUP' | 'CUSTOM';

export interface PetReminderModel {
  uuid: string;
  petUuid: string;
  petName?: string | null;
  type: PetReminderType;
  dueAt: string;
  note?: string | null;
  pushEnabled?: boolean;
  whatsappEnabled?: boolean;
  sentAt?: string | null;
  isActive?: boolean;
}

export async function fetchMyReminders(): Promise<PetReminderModel[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<PetReminderModel[]>>('/user/reminders');
  return res.data.data ?? [];
}

export async function createReminder(payload: {
  petUuid: string;
  type: PetReminderType;
  dueAt: string;
  note?: string;
  pushEnabled?: boolean;
  whatsappEnabled?: boolean;
}): Promise<PetReminderModel> {
  const res = await axiosInstance.post<ApiSuccessResponse<PetReminderModel>>('/user/reminders', payload);
  return res.data.data;
}

export async function updateReminder(
  reminderUuid: string,
  payload: Partial<{
    type: PetReminderType;
    dueAt: string;
    note: string;
    pushEnabled: boolean;
    whatsappEnabled: boolean;
    isActive: boolean;
  }>
): Promise<PetReminderModel> {
  const res = await axiosInstance.patch<ApiSuccessResponse<PetReminderModel>>(
    `/user/reminders/${reminderUuid}`,
    payload
  );
  return res.data.data;
}

export async function deleteReminder(reminderUuid: string): Promise<void> {
  await axiosInstance.delete(`/user/reminders/${reminderUuid}`);
}
