import axiosInstance from '@/config/axionInstance';
import { ApiSuccessResponse } from './cartService';
import { PaginationModel, emptyPage } from './adminService';

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
  transactionId?: string;
  paidAmount?: number;
  balance?: number;
  ownerSnapshot?: string;
  razorpayOrderId?: string;
  diagnosis?: string;
  reason?: string;
  createdAt?: string;
}

/** Create response: invoice always saved; WhatsApp is best-effort. */
export interface CreateInvoiceResult {
  invoice: ConsultationInvoice;
  whatsappSent: boolean;
  whatsappError?: string | null;
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
  clinicUuid?: string;
  petUuid?: string;
  visitUuid?: string;
  ownerUserUuid?: string;
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
  sendWhatsApp?: boolean;
}

/** Prefill payload when navigating from Finish treatment → invoices. */
export type InvoiceFromVisitState = {
  visitUuid: string;
  clinicUuid?: string;
  petUuid?: string;
  petName?: string;
  petBreed?: string;
  petSpecies?: string;
  petWeight?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  reason?: string;
  diagnosis?: string;
  doctorNotes?: string;
  nextVisitNotes?: string;
};

export async function createConsultationInvoice(
  body: CreateTreatmentInvoicePayload
): Promise<CreateInvoiceResult> {
  const res = await axiosInstance.post<ApiSuccessResponse<CreateInvoiceResult | ConsultationInvoice>>(
    '/invoice',
    body
  );
  return normalizeCreateResult(res.data.data);
}

export async function fetchMyInvoices(
  clinicUuid?: string,
  pageNumber = 1,
  pageSize = 10
): Promise<PaginationModel<ConsultationInvoice>> {
  const res = await axiosInstance.get<ApiSuccessResponse<PaginationModel<ConsultationInvoice>>>(
    '/invoice/mine',
    {
      params: { pageNumber, pageSize, ...(clinicUuid ? { clinicUuid } : {}) },
    }
  );
  return res.data.data ?? emptyPage<ConsultationInvoice>(pageSize);
}

export async function generateInvoicePdf(uuid: string): Promise<ConsultationInvoice> {
  const res = await axiosInstance.post<ApiSuccessResponse<ConsultationInvoice>>(
    `/invoice/${uuid}/generate-pdf`
  );
  return res.data.data;
}

export async function markInvoicePaid(
  uuid: string,
  body: { paymentMode: string; transactionId?: string }
): Promise<ConsultationInvoice> {
  const res = await axiosInstance.post<ApiSuccessResponse<ConsultationInvoice>>(
    `/invoice/${uuid}/mark-paid`,
    body
  );
  return res.data.data;
}

/** Resend an existing invoice PDF via WhatsApp (document template). */
export async function sendInvoiceWhatsApp(uuid: string): Promise<ConsultationInvoice> {
  const res = await axiosInstance.post<ApiSuccessResponse<ConsultationInvoice>>(
    `/invoice/${uuid}/send-whatsapp`
  );
  return res.data.data;
}

export async function fetchInvoicePdfUrl(uuid: string): Promise<string> {
  const res = await axiosInstance.get<ApiSuccessResponse<{ url: string }>>(`/invoice/${uuid}/pdf`);
  return res.data.data.url;
}

export async function createClinicInvoice(
  clinicUuid: string,
  body: CreateTreatmentInvoicePayload
): Promise<CreateInvoiceResult> {
  const res = await axiosInstance.post<ApiSuccessResponse<CreateInvoiceResult | ConsultationInvoice>>(
    `/clinic/${clinicUuid}/invoices`,
    { ...body, clinicUuid }
  );
  return normalizeCreateResult(res.data.data);
}

function normalizeCreateResult(data: CreateInvoiceResult | ConsultationInvoice): CreateInvoiceResult {
  if (data && typeof data === 'object' && 'invoice' in data && (data as CreateInvoiceResult).invoice) {
    const r = data as CreateInvoiceResult;
    return {
      invoice: r.invoice,
      whatsappSent: Boolean(r.whatsappSent),
      whatsappError: r.whatsappError ?? null,
    };
  }
  return {
    invoice: data as ConsultationInvoice,
    whatsappSent: false,
    whatsappError: null,
  };
}

export async function fetchClinicInvoices(
  clinicUuid: string,
  pageNumber = 1,
  pageSize = 10
): Promise<PaginationModel<ConsultationInvoice>> {
  const res = await axiosInstance.get<ApiSuccessResponse<PaginationModel<ConsultationInvoice>>>(
    `/clinic/${clinicUuid}/invoices`,
    { params: { pageNumber, pageSize } }
  );
  return res.data.data ?? emptyPage<ConsultationInvoice>(pageSize);
}

export async function generateClinicInvoicePdf(
  clinicUuid: string,
  invoiceUuid: string
): Promise<ConsultationInvoice> {
  const res = await axiosInstance.post<ApiSuccessResponse<ConsultationInvoice>>(
    `/clinic/${clinicUuid}/invoices/${invoiceUuid}/generate-pdf`
  );
  return res.data.data;
}

export async function markClinicInvoicePaid(
  clinicUuid: string,
  invoiceUuid: string,
  body: { paymentMode: string; transactionId?: string }
): Promise<ConsultationInvoice> {
  const res = await axiosInstance.post<ApiSuccessResponse<ConsultationInvoice>>(
    `/clinic/${clinicUuid}/invoices/${invoiceUuid}/mark-paid`,
    body
  );
  return res.data.data;
}

export async function sendClinicInvoiceWhatsApp(
  clinicUuid: string,
  invoiceUuid: string
): Promise<ConsultationInvoice> {
  const res = await axiosInstance.post<ApiSuccessResponse<ConsultationInvoice>>(
    `/clinic/${clinicUuid}/invoices/${invoiceUuid}/send-whatsapp`
  );
  return res.data.data;
}

export async function fetchClinicInvoicePdfUrl(
  clinicUuid: string,
  invoiceUuid: string
): Promise<string> {
  const res = await axiosInstance.get<ApiSuccessResponse<{ url: string }>>(
    `/clinic/${clinicUuid}/invoices/${invoiceUuid}/pdf`
  );
  return res.data.data.url;
}

/** Pet-owner view of a consultation invoice (no Razorpay ids). */
export interface OwnerInvoice {
  uuid: string;
  invoiceNumber?: string | null;
  visitUuid?: string | null;
  petUuid?: string | null;
  clinicName?: string | null;
  doctorName?: string | null;
  status?: string | null;
  paymentStatus?: string | null;
  amount?: number | null;
  paidAmount?: number | null;
  currency?: string | null;
  diagnosis?: string | null;
  reason?: string | null;
  doctorNotes?: string | null;
  nextVisitNotes?: string | null;
  pdfAvailable?: boolean;
  consultationDate?: string | null;
  createdAt?: string | null;
}

export async function fetchOwnerPetInvoices(
  petUuid: string,
  pageNumber = 1,
  pageSize = 10
): Promise<PaginationModel<OwnerInvoice>> {
  const res = await axiosInstance.get<ApiSuccessResponse<PaginationModel<OwnerInvoice>>>(
    `/pet/${petUuid}/invoices`,
    { params: { pageNumber, pageSize } }
  );
  return res.data.data ?? emptyPage<OwnerInvoice>(pageSize);
}

export async function fetchOwnerInvoicePdfUrl(petUuid: string, invoiceUuid: string): Promise<string> {
  const res = await axiosInstance.get<ApiSuccessResponse<{ url: string }>>(
    `/pet/${petUuid}/invoices/${invoiceUuid}/pdf`
  );
  return res.data.data.url;
}

export async function fetchDoctorWhatsAppSettings(): Promise<{
  whatsappConfigured: boolean;
  phoneNumberId: string;
  businessAccountId: string;
}> {
  const res = await axiosInstance.get<
    ApiSuccessResponse<{
      whatsappConfigured: boolean;
      phoneNumberId: string;
      businessAccountId: string;
    }>
  >('/doctor/whatsapp-settings');
  return res.data.data;
}

export async function updateDoctorWhatsAppSettings(body: {
  phoneNumberId: string;
  businessAccountId: string;
  token?: string;
}): Promise<{ whatsappConfigured: boolean; phoneNumberId: string; businessAccountId: string }> {
  const res = await axiosInstance.put<
    ApiSuccessResponse<{
      whatsappConfigured: boolean;
      phoneNumberId: string;
      businessAccountId: string;
    }>
  >('/doctor/whatsapp-settings', body);
  return res.data.data;
}

export async function fetchClinicWhatsAppSettings(clinicUuid: string): Promise<{
  whatsappConfigured: boolean;
  phoneNumberId: string;
  businessAccountId: string;
}> {
  const res = await axiosInstance.get<
    ApiSuccessResponse<{
      whatsappConfigured: boolean;
      phoneNumberId: string;
      businessAccountId: string;
    }>
  >(`/clinic/${clinicUuid}/whatsapp-settings`);
  return res.data.data;
}

export async function updateClinicWhatsAppSettings(
  clinicUuid: string,
  body: { phoneNumberId: string; businessAccountId: string; token?: string }
): Promise<{ whatsappConfigured: boolean; phoneNumberId: string; businessAccountId: string }> {
  const res = await axiosInstance.put<
    ApiSuccessResponse<{
      whatsappConfigured: boolean;
      phoneNumberId: string;
      businessAccountId: string;
    }>
  >(`/clinic/${clinicUuid}/whatsapp-settings`, body);
  return res.data.data;
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
