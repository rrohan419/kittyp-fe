import axiosInstance from '@/config/axionInstance';
import type { ApiSuccessResponse } from '@/services/cartService';

export type MessagingChannel = 'EMAIL' | 'WHATSAPP' | 'SMS';
export type MessageStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'PAUSED'
  | 'CANCELLED';

/** Approved channel content comes from the API; never create SMS/WhatsApp copy here. */
export interface MessagingTemplate {
  id: string;
  name: string;
  channel: MessagingChannel;
  purpose: string;
  body: string;
  /** Placeholder keys supported by this approved template, e.g. petName. */
  variables?: string[];
  /** Document-header templates are sent from Billing with their PDF attachment. */
  requiresDocument?: boolean;
  language?: string;
}

export interface MessagingChannelRate {
  /** Backend-provided estimated credits for one recipient/message. */
  creditsPerMessage: number;
  currency?: string;
  includedMonthly?: number;
  segmentSize?: number;
}

export interface MessagingOverview {
  globallyPaused: boolean;
  channelRates: Partial<Record<MessagingChannel, MessagingChannelRate>>;
  approvedTemplates: MessagingTemplate[];
  upcomingCount?: number;
  historyCount?: number;
}

export interface MessagingChannelContent {
  channel: MessagingChannel;
  templateId?: string;
  templateName?: string;
  content: string;
}

export interface MessagingMessage {
  uuid: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  petName?: string;
  status: MessageStatus | string;
  channels: MessagingChannel[];
  scheduledAt?: string;
  sentAt?: string;
  createdAt?: string;
  /** Exact resolved content shown to the recipient. */
  content?: string;
  channelContents?: MessagingChannelContent[];
  subject?: string;
  templateIds?: Partial<Record<MessagingChannel, string>>;
  templateVariables?: Record<string, string>;
  automationId?: string;
  sourceType?: string;
  sourceUuid?: string;
}

export interface MessagingRecipient {
  name: string;
  email?: string;
  phone?: string;
}

export interface CreateMessagingRequest {
  recipient: MessagingRecipient;
  petName?: string;
  channels: MessagingChannel[];
  /** Email may use user-written copy; SMS/WhatsApp must use approved template IDs. */
  emailContent?: string;
  emailSubject?: string;
  templateIds?: Partial<Record<MessagingChannel, string>>;
  templateVariables?: Record<string, string>;
  scheduledAt?: string;
}

export interface MessagingAutomation {
  id: string;
  enabled: boolean;
}

export interface MessagingSettings {
  paused: boolean;
  globallyPaused: boolean;
}

export interface MessagingCreditTransaction {
  uuid: string;
  channel: MessagingChannel;
  type: string;
  description: string;
  credits: number;
  createdAt: string;
  referenceId?: string;
}

export interface MessagingCreditBundle {
  id: string;
  channel: MessagingChannel;
  name: string;
  credits: number;
  /** Total amount in INR, including tax. */
  amount: number;
  currency: string;
}

export interface MessagingCredits {
  balance: Partial<Record<MessagingChannel, number>>;
  usedThisPeriod: Partial<Record<MessagingChannel, number>>;
  transactions: MessagingCreditTransaction[];
  purchaseOptions: MessagingCreditBundle[];
}

export interface MessagingPurchaseOrder {
  purchaseUuid: string;
  orderId: string;
  amount: number;
  currency: string;
  key?: string;
  name?: string;
  description?: string;
}

export interface MessagingPurchaseVerification {
  success: boolean;
  message?: string;
}

const envelope = <T>(data: unknown): T => (data as ApiSuccessResponse<T>).data;

const root = (scope: { kind: 'doctor' } | { kind: 'clinic'; clinicUuid: string }) =>
  scope.kind === 'doctor'
    ? '/doctor/messaging'
    : `/clinic/${encodeURIComponent(scope.clinicUuid)}/messaging`;

interface BackendMessage {
  uuid: string;
  recipient: string;
  recipientName?: string;
  petName?: string;
  status: string;
  channels?: MessagingChannel[];
  channel?: MessagingChannel;
  schedule?: string;
  scheduledAt?: string;
  sendDate?: string;
  createdAt?: string;
  channelContents?: Record<string, unknown>;
  content?: string;
  subject?: string;
  templateKey?: string;
  variables?: Record<string, string>;
  automationId?: string;
  sourceType?: string;
  sourceUuid?: string;
}

function messageFromApi(message: BackendMessage): MessagingMessage {
  const channel = message.channel ?? message.channels?.[0] ?? 'EMAIL';
  const content = message.channelContents?.[channel];
  const recipient = message.recipient ?? '';
  return {
    uuid: message.uuid,
    recipientName: message.recipientName || recipient,
    ...(channel === 'EMAIL' ? { recipientEmail: recipient } : { recipientPhone: recipient }),
    ...(message.petName ? { petName: message.petName } : {}),
    status: message.status.toUpperCase() === 'SENDING' ? 'PROCESSING' : message.status,
    channels: message.channels?.length ? message.channels : [channel],
    scheduledAt: message.schedule ?? message.scheduledAt,
    sentAt: message.sendDate,
    createdAt: message.createdAt,
    content: typeof content === 'string' ? content : message.content,
    channelContents: typeof content === 'string' ? [{ channel, content }] : undefined,
    subject: message.subject,
    templateIds: message.templateKey ? { [channel]: message.templateKey } : undefined,
    templateVariables: message.variables,
    automationId: message.automationId,
    sourceType: message.sourceType,
    sourceUuid: message.sourceUuid,
  };
}

function createRequestBody(request: CreateMessagingRequest) {
  return {
    recipient: request.recipient.email || request.recipient.phone || '',
    recipientName: request.recipient.name,
    recipientEmail: request.recipient.email,
    recipientPhone: request.recipient.phone,
    petName: request.petName,
    channels: request.channels,
    templateIds: request.templateIds,
    templateVariables: request.templateVariables,
    emailContent: request.emailContent,
    subject: request.emailSubject,
    scheduledAt: request.scheduledAt,
  };
}

export async function fetchMessagingOverview(scope: Parameters<typeof root>[0]) {
  return envelope<MessagingOverview>(
    (await axiosInstance.get<ApiSuccessResponse<MessagingOverview>>(`${root(scope)}/overview`)).data
  );
}

export async function fetchMessagingMessages(scope: Parameters<typeof root>[0]) {
  const response = envelope<BackendMessage[]>(
    (await axiosInstance.get<ApiSuccessResponse<BackendMessage[]>>(`${root(scope)}/messages`)).data
  );
  return response.map(messageFromApi);
}

export async function fetchMessagingMessage(
  scope: Parameters<typeof root>[0],
  uuid: string
) {
  return messageFromApi(envelope<BackendMessage>(
    (await axiosInstance.get<ApiSuccessResponse<BackendMessage>>(
      `${root(scope)}/messages/${encodeURIComponent(uuid)}`
    )).data
  ));
}

export async function createMessagingMessage(
  scope: Parameters<typeof root>[0],
  request: CreateMessagingRequest
) {
  const response = envelope<BackendMessage[]>(
    (await axiosInstance.post<ApiSuccessResponse<BackendMessage[]>>(
      `${root(scope)}/messages`,
      createRequestBody(request)
    )).data
  );
  return response.map(messageFromApi);
}

export async function updateMessagingMessage(
  scope: Parameters<typeof root>[0],
  uuid: string,
  request: Partial<CreateMessagingRequest>
) {
  const channel = request.channels?.[0] ?? 'EMAIL';
  const response = envelope<BackendMessage>(
    (await axiosInstance.patch<ApiSuccessResponse<BackendMessage>>(
      `${root(scope)}/messages/${encodeURIComponent(uuid)}`,
      {
        recipient: channel === 'EMAIL' ? request.recipient?.email : request.recipient?.phone,
        recipientName: request.recipient?.name,
        recipientEmail: request.recipient?.email,
        recipientPhone: request.recipient?.phone,
        petName: request.petName,
        templateId: request.templateIds?.[channel],
        templateVariables: request.templateVariables,
        subject: request.emailSubject,
        emailContent: request.emailContent,
        scheduledAt: request.scheduledAt,
      }
    )).data
  );
  return messageFromApi(response);
}

export type MessageAction = 'pause' | 'resume' | 'cancel' | 'retry';
export async function performMessagingAction(
  scope: Parameters<typeof root>[0],
  uuid: string,
  action: MessageAction
) {
  return messageFromApi(envelope<BackendMessage>(
    (await axiosInstance.post<ApiSuccessResponse<BackendMessage>>(
      `${root(scope)}/messages/${encodeURIComponent(uuid)}/${action}`
    )).data
  ));
}

export async function setMessagingPauseAll(
  scope: Parameters<typeof root>[0],
  paused: boolean
) {
  const action = paused ? 'pause-all' : 'resume-all';
  return envelope<{ globallyPaused: boolean }>(
    (await axiosInstance.post<ApiSuccessResponse<{ paused: boolean; globallyPaused: boolean }>>(
      `${root(scope)}/${action}`
    )).data
  );
}

export async function fetchMessagingAutomations(scope: Parameters<typeof root>[0]) {
  return envelope<MessagingAutomation[]>(
    (await axiosInstance.get<ApiSuccessResponse<MessagingAutomation[]>>(
      `${root(scope)}/automations`
    )).data
  );
}

export async function saveMessagingAutomations(
  scope: Parameters<typeof root>[0],
  automations: MessagingAutomation[]
) {
  return envelope<MessagingAutomation[]>(
    (await axiosInstance.put<ApiSuccessResponse<MessagingAutomation[]>>(
      `${root(scope)}/automations`,
      automations.map(({ id, enabled }) => ({ id, enabled }))
    )).data
  );
}

export async function fetchMessagingCredits(scope: Parameters<typeof root>[0]) {
  const raw = envelope<{
    balance: Partial<Record<MessagingChannel, number>>;
    usedThisPeriod: Partial<Record<MessagingChannel, number>>;
    transactions: Array<{ channel: MessagingChannel; entryType: string; creditDelta: number; referenceId?: string; createdAt: string }>;
    purchaseOptions: Array<{ bundleId: string; channel: MessagingChannel; credits: number; totalAmount: number; currency: string }>;
  }>((await axiosInstance.get<ApiSuccessResponse<{
    balance: Partial<Record<MessagingChannel, number>>;
    usedThisPeriod: Partial<Record<MessagingChannel, number>>;
    transactions: Array<{ channel: MessagingChannel; entryType: string; creditDelta: number; referenceId?: string; createdAt: string }>;
    purchaseOptions: Array<{ bundleId: string; channel: MessagingChannel; credits: number; totalAmount: number; currency: string }>;
  }>>(`${root(scope)}/credits`)).data);
  return {
    balance: raw.balance,
    usedThisPeriod: raw.usedThisPeriod,
    transactions: raw.transactions.map((transaction, index) => ({
      uuid: `${transaction.channel}-${transaction.entryType}-${transaction.createdAt}-${index}`,
      channel: transaction.channel,
      type: transaction.entryType,
      description: transaction.entryType.replaceAll('_', ' '),
      credits: transaction.creditDelta,
      createdAt: transaction.createdAt,
      referenceId: transaction.referenceId,
    })),
    purchaseOptions: raw.purchaseOptions.map((option) => ({
      id: option.bundleId,
      channel: option.channel,
      name: `${option.channel} credits`,
      credits: option.credits,
      amount: option.totalAmount,
      currency: option.currency,
    })),
  };
}

export async function createMessagingCreditPurchase(
  scope: Parameters<typeof root>[0],
  bundleId: string
) {
  const purchase = envelope<{
    purchaseUuid: string;
    bundleId: string;
    razorpayOrderId: string;
    totalAmount: number;
    currency: string;
    key?: string;
  }>((await axiosInstance.post<ApiSuccessResponse<{
    purchaseUuid: string;
    bundleId: string;
    razorpayOrderId: string;
    totalAmount: number;
    currency: string;
    key?: string;
  }>>(
      `${root(scope)}/credits/purchase`,
      { bundleId }
    )).data);
  return {
    purchaseUuid: purchase.purchaseUuid,
    orderId: purchase.razorpayOrderId,
    amount: Math.round(purchase.totalAmount * 100),
    currency: purchase.currency,
    name: 'Kittyp',
    description: 'Messaging credits',
    key: purchase.key,
  };
}

export async function verifyMessagingCreditPurchase(
  scope: Parameters<typeof root>[0],
  purchaseUuid: string,
  payment: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }
) {
  const purchase = envelope<{ status: string }>(
    (await axiosInstance.post<ApiSuccessResponse<{ status: string }>>(
      `${root(scope)}/credits/purchase/verify`,
      {
        purchaseUuid,
        orderId: payment.razorpay_order_id,
        paymentId: payment.razorpay_payment_id,
        signature: payment.razorpay_signature,
      }
    )).data
  );
  return { success: purchase.status === 'PAID', message: purchase.status };
}

export async function fetchMessagingSettings(scope: Parameters<typeof root>[0]) {
  return envelope<MessagingSettings>(
    (await axiosInstance.get<ApiSuccessResponse<MessagingSettings>>(`${root(scope)}/settings`)).data
  );
}

export async function saveMessagingSettings(
  scope: Parameters<typeof root>[0],
  settings: MessagingSettings
) {
  return envelope<MessagingSettings>(
    (await axiosInstance.put<ApiSuccessResponse<MessagingSettings>>(
      `${root(scope)}/settings`,
      { paused: settings.globallyPaused }
    )).data
  );
}
