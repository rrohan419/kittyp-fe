import axiosInstance from '@/config/axionInstance';
import { ApiSuccessResponse } from './cartService';

export interface ConsultationInvoice {
  uuid: string;
  petUuid?: string;
  amount: number;
  currency?: string;
  status: string;
  notes?: string;
  lineItems?: string;
}

export async function createConsultationInvoice(body: {
  petUuid?: string;
  amount: number;
  currency?: string;
  notes?: string;
  lineItems?: string;
}): Promise<ConsultationInvoice> {
  const res = await axiosInstance.post<ApiSuccessResponse<ConsultationInvoice>>('/invoice', body);
  return res.data.data;
}

export async function fetchMyInvoices(): Promise<ConsultationInvoice[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ConsultationInvoice[]>>('/invoice/mine');
  return res.data.data ?? [];
}
