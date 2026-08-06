import axiosInstance from '@/config/axionInstance';
import { ApiSuccessResponse } from './cartService';

export type TreatmentItemType =
  | 'CONSULTATION'
  | 'SERVICE'
  | 'MEDICINE'
  | 'LAB_TEST'
  | 'SURGERY'
  | 'HOSPITALIZATION'
  | 'CONSUMABLE'
  | 'VACCINATION'
  | 'OTHER';

export interface TreatmentLineItem {
  itemType: TreatmentItemType;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discount?: number;
  tax?: number;
  total?: number;
}

export interface ConsultationInvoice {
  uuid: string;
  invoiceNumber?: string;
  petUuid?: string;
  amount: number;
  subtotal?: number;
  discount?: number;
  tax?: number;
  currency?: string;
  status: string;
  notes?: string;
  lineItems?: string;
  pdfUrl?: string;
  paymentStatus?: string;
  paymentMode?: string;
  diagnosis?: string;
  reason?: string;
}

export interface CreateTreatmentInvoicePayload {
  items: TreatmentLineItem[];
  amount?: number;
  subtotal?: number;
  discount?: number;
  tax?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  paidAmount?: number;
  currency?: string;
  notes?: string;
  doctorNotes?: string;
  nextVisitNotes?: string;
  reason?: string;
  diagnosis?: string;
  consultationDate?: string;
  paymentStatus?: string;
  paymentMode?: string;
  transactionId?: string;
  petName?: string;
  petSpecies?: string;
  petBreed?: string;
  petGender?: string;
  petAge?: string;
  petWeight?: string;
  patientId?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  ownerAddress?: string;
  generatePdf?: boolean;
}

export async function createConsultationInvoice(
  body: CreateTreatmentInvoicePayload
): Promise<ConsultationInvoice> {
  const res = await axiosInstance.post<ApiSuccessResponse<ConsultationInvoice>>('/invoice', body);
  return res.data.data;
}

export async function fetchMyInvoices(): Promise<ConsultationInvoice[]> {
  const res = await axiosInstance.get<ApiSuccessResponse<ConsultationInvoice[]>>('/invoice/mine');
  return res.data.data ?? [];
}

export async function generateInvoicePdf(uuid: string): Promise<ConsultationInvoice> {
  const res = await axiosInstance.post<ApiSuccessResponse<ConsultationInvoice>>(
    `/invoice/${uuid}/generate-pdf`
  );
  return res.data.data;
}

export async function fetchInvoicePdfUrl(uuid: string): Promise<string> {
  const res = await axiosInstance.get<ApiSuccessResponse<{ url: string }>>(`/invoice/${uuid}/pdf`);
  return res.data.data.url;
}

export const ITEM_TYPE_OPTIONS: { value: TreatmentItemType; label: string }[] = [
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'MEDICINE', label: 'Medicine' },
  { value: 'LAB_TEST', label: 'Lab test' },
  { value: 'SURGERY', label: 'Surgery' },
  { value: 'HOSPITALIZATION', label: 'Hospitalization' },
  { value: 'CONSUMABLE', label: 'Consumable' },
  { value: 'VACCINATION', label: 'Vaccination' },
  { value: 'OTHER', label: 'Other' },
];
