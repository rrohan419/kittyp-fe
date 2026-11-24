import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CalendarClock,
  Check,
  CircleDollarSign,
  Clock3,
  Mail,
  MessageCircle,
  MessageSquareText,
  Plus,
  Settings2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useActiveClinic } from '@/hooks/useActiveClinic';
import ClinicEmailUsagePage from '@/pages/clinic/ClinicEmailUsage';
import { useAppSelector } from '@/module/store/hooks';
import { ROLES, hasRole } from '@/utils/roles';
import {
  fetchClinicOwners,
  type ClinicOwnerModel,
} from '@/services/clinicService';
import {
  createMessagingCreditPurchase,
  createMessagingMessage,
  fetchMessagingAutomations,
  fetchMessagingCredits,
  fetchMessagingMessage,
  fetchMessagingMessages,
  fetchMessagingOverview,
  fetchMessagingSettings,
  performMessagingAction,
  saveMessagingAutomations,
  saveMessagingSettings,
  setMessagingPauseAll,
  updateMessagingMessage,
  verifyMessagingCreditPurchase,
  type CreateMessagingRequest,
  type MessagingAutomation,
  type MessagingChannel,
  type MessagingChannelRate,
  type MessagingCredits,
  type MessagingMessage,
  type MessagingSettings,
  type MessagingTemplate,
} from '@/services/messagingService';
import { openRazorpayCheckout } from '@/services/razorpayCheckout';

type Tab = 'overview' | 'upcoming' | 'history' | 'credits' | 'settings';
const CHANNELS: MessagingChannel[] = ['EMAIL', 'WHATSAPP', 'SMS'];
const CHANNEL_LABEL: Record<MessagingChannel, string> = {
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  SMS: 'SMS',
};
const CHANNEL_ICON = {
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  SMS: MessageSquareText,
};
const UPCOMING = new Set(['DRAFT', 'SCHEDULED', 'QUEUED', 'PAUSED']);

const errorText = (error: unknown) => {
  if (isAxiosError<{ message?: unknown; detailedMessage?: unknown }>(error)) {
    const data = error.response?.data;
    if (typeof data?.message === 'string' && data.message.trim()) return data.message;
    if (typeof data?.detailedMessage === 'string' && data.detailedMessage.trim()) return data.detailedMessage;
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
};

function localDateTime(value?: string) {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function scheduledSendTime(message: MessagingMessage) {
  if (!message.scheduledAt) {
    return { label: message.sentAt ? 'Sent' : 'Send time', value: localDateTime(message.sentAt) };
  }
  if (message.automationId) {
    const datePart = message.scheduledAt.slice(0, 10);
    const dispatchTime = new Date(`${datePart}T10:00:00+05:30`);
    return {
      label: 'Expected send',
      value: Number.isNaN(dispatchTime.getTime())
        ? localDateTime(message.scheduledAt)
        : dispatchTime.toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata',
          }) + ' IST',
    };
  }
  return { label: 'Scheduled for', value: localDateTime(message.scheduledAt) };
}

function isUpcoming(message: MessagingMessage) {
  return UPCOMING.has(message.status.toUpperCase());
}

function messageContent(message: MessagingMessage, channel?: MessagingChannel) {
  const contents = message.channelContents?.filter((item) => !channel || item.channel === channel);
  if (contents?.length) {
    return contents.map((item) => `${CHANNEL_LABEL[item.channel]}: ${item.content}`).join('\n\n');
  }
  return message.content || 'Content was not included in the server response.';
}

function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-5">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Notice({
  children,
  kind = 'error',
}: {
  children: React.ReactNode;
  kind?: 'error' | 'info';
}) {
  return (
    <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${kind === 'error' ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'bg-muted text-muted-foreground'}`}>
      {kind === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />}
      <div>{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const key = status.toUpperCase();
  const style = key === 'FAILED'
    ? 'bg-red-100 text-red-700'
    : key === 'DELIVERED' || key === 'SENT'
      ? 'bg-emerald-100 text-emerald-700'
      : key === 'CANCELLED'
        ? 'bg-slate-100 text-slate-600'
        : key === 'PAUSED'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-blue-100 text-blue-700';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>{key.replaceAll('_', ' ')}</span>;
}

function MessageCard({
  message,
  channel,
  onEdit,
  onAction,
  canManage,
  busy,
}: {
  message: MessagingMessage;
  channel?: MessagingChannel;
  onEdit: () => void;
  onAction: (action: 'pause' | 'resume' | 'cancel' | 'retry') => void;
  canManage: boolean;
  busy: boolean;
}) {
  const status = message.status.toUpperCase();
  const sendTime = scheduledSendTime(message);
  return (
    <article className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{message.recipientName || 'Recipient'}</h3>
            <StatusBadge status={message.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {[message.petName && `Pet: ${message.petName}`, message.recipientEmail, message.recipientPhone]
              .filter(Boolean).join(' · ') || 'No recipient contact details returned'}
          </p>
          {message.automationId && (
            <p className="mt-1 text-xs font-medium text-primary">
              Automation · {message.automationId.replaceAll('_', ' ').replaceAll('.', ' ')}
            </p>
          )}
        </div>
        <div className="text-right text-sm">
          <div className="text-xs text-muted-foreground">{sendTime.label}</div>
          <div className="font-medium">{sendTime.value}</div>
          {message.automationId && <div className="text-xs text-muted-foreground">Daily automation run</div>}
          <div className="text-muted-foreground">{(channel ? [channel] : message.channels).map((item) => CHANNEL_LABEL[item]).join(', ')}</div>
        </div>
      </div>
      <pre className="mt-3 whitespace-pre-wrap break-words rounded-md bg-muted/60 p-3 font-sans text-sm leading-6">
        {messageContent(message, channel)}
      </pre>
      {canManage && (
        <div className="mt-3 flex flex-wrap gap-2">
          {status === 'SCHEDULED' && (
            <button type="button" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50" disabled={busy} onClick={() => onAction('pause')}>Pause</button>
          )}
          {status === 'PAUSED' && (
            <button type="button" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50" disabled={busy} onClick={() => onAction('resume')}>Resume</button>
          )}
          {['DRAFT', 'SCHEDULED', 'PAUSED'].includes(status) && (
            <button type="button" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50" disabled={busy} onClick={onEdit}>Edit</button>
          )}
          {['DRAFT', 'SCHEDULED', 'PAUSED', 'QUEUED'].includes(status) && (
            <button type="button" className="rounded-md border border-destructive/30 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/5 disabled:opacity-50" disabled={busy} onClick={() => onAction('cancel')}>Cancel</button>
          )}
          {status === 'FAILED' && (
            <button type="button" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50" disabled={busy} onClick={() => onAction('retry')}>Retry</button>
          )}
        </div>
      )}
    </article>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{children}</div>;
}

function ComposeForm({
  scopeClinicUuid,
  templates,
  templatesUnavailable,
  rates,
  initial,
  canChooseOwner,
  onCancel,
  onSubmit,
  busy,
}: {
  scopeClinicUuid: string | null;
  templates: MessagingTemplate[];
  templatesUnavailable: boolean;
  rates: Partial<Record<MessagingChannel, MessagingChannelRate>>;
  initial?: MessagingMessage;
  canChooseOwner: boolean;
  onCancel: () => void;
  onSubmit: (request: CreateMessagingRequest) => Promise<void>;
  busy: boolean;
}) {
  const [recipientName, setRecipientName] = useState(initial?.recipientName ?? '');
  const [email, setEmail] = useState(initial?.recipientEmail ?? '');
  const [phone, setPhone] = useState(initial?.recipientPhone ?? '');
  const [petName, setPetName] = useState(initial?.petName ?? '');
  const [emailSubject, setEmailSubject] = useState(initial?.subject ?? '');
  const [channels, setChannels] = useState<MessagingChannel[]>(initial?.channels ?? []);
  const [templateIds, setTemplateIds] = useState<Partial<Record<MessagingChannel, string>>>(initial?.templateIds ?? {});
  const [variables, setVariables] = useState<Record<string, string>>(initial?.templateVariables ?? {});
  const [emailContent, setEmailContent] = useState(initial?.channelContents?.find((c) => c.channel === 'EMAIL')?.content ?? initial?.content ?? '');
  const [sendMode, setSendMode] = useState<'now' | 'schedule'>(initial?.scheduledAt ? 'schedule' : 'now');
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt ? new Date(new Date(initial.scheduledAt).getTime() - new Date(initial.scheduledAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
  const [ownerSuggestions, setOwnerSuggestions] = useState<ClinicOwnerModel[]>([]);
  const [ownerPets, setOwnerPets] = useState<ClinicOwnerModel['pets']>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [ownerSearchError, setOwnerSearchError] = useState<string | null>(null);
  const chosenTemplates = channels
    .filter((channel) => channel !== 'EMAIL')
    .map((channel) => templates.find((item) => item.channel === channel && item.id === templateIds[channel] && !item.requiresDocument))
    .filter((item): item is MessagingTemplate => Boolean(item));
  const uniqueVariables = [...new Set(chosenTemplates.flatMap((template) => template.variables ?? []))];
  const estimatedCredits = channels.length && channels.every((channel) => rates[channel] && Number.isFinite(rates[channel]?.creditsPerMessage))
    ? channels.map((channel) => {
      if (channel === 'SMS') {
        const template = templates.find((item) => item.channel === channel && item.id === templateIds[channel] && !item.requiresDocument);
        const body = template?.body.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, key: string) => variables[key.trim()] || `{{${key.trim()}}}`) ?? '';
        const size = Math.max(1, rates.SMS?.segmentSize ?? 160);
        const segments = Math.max(1, Math.ceil(Array.from(body).length / size));
        return `SMS: ${segments}`;
      }
      if (channel === 'EMAIL' && (rates.EMAIL?.includedMonthly ?? 0) > 0) return 'Email: 0–1';
      return `${CHANNEL_LABEL[channel]}: ${Math.max(1, Math.ceil(rates[channel]?.creditsPerMessage ?? 1))}`;
    }).join(' · ')
    : null;

  useEffect(() => {
    if (!canChooseOwner || !scopeClinicUuid || recipientName.trim().length < 2) {
      setOwnerSuggestions([]);
      setOwnerSearchError(null);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      setOwnersLoading(true);
      setOwnerSearchError(null);
      void fetchClinicOwners(scopeClinicUuid, recipientName.trim(), { pageNumber: 1, pageSize: 5 })
        .then((result) => { if (active) setOwnerSuggestions(result.models ?? []); })
        .catch((error: unknown) => {
          if (active) {
            setOwnerSuggestions([]);
            setOwnerSearchError(errorText(error));
          }
        })
        .finally(() => { if (active) setOwnersLoading(false); });
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [canChooseOwner, recipientName, scopeClinicUuid]);

  const toggleChannel = (channel: MessagingChannel) => {
    setChannels((current) => current.includes(channel) ? current.filter((value) => value !== channel) : [...current, channel]);
  };
  const selectOwner = (owner: ClinicOwnerModel) => {
    setRecipientName(owner.name);
    setEmail(owner.email ?? '');
    setPhone(owner.phone ?? '');
    setOwnerPets(owner.pets ?? []);
    setPetName(owner.pets?.[0]?.name ?? '');
    setOwnerSuggestions([]);
  };
  const templatePreview = (template: MessagingTemplate) =>
    template.body.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, key: string) => variables[key.trim()] || `{{${key.trim()}}}`);
  const validation = () => {
    if (!recipientName.trim()) return 'Enter a recipient name.';
    if (!channels.length) return 'Choose at least one channel.';
    if (channels.includes('EMAIL') && !email.trim()) return 'Enter an email address for Email delivery.';
    if (channels.some((channel) => channel !== 'EMAIL') && !phone.trim()) return 'Enter a phone number for SMS or WhatsApp delivery.';
    if (channels.includes('EMAIL') && !emailContent.trim()) return 'Write the Email message content.';
    if (channels.includes('EMAIL') && !emailSubject.trim()) return 'Enter an Email subject.';
    for (const channel of channels.filter((item) => item !== 'EMAIL')) {
      if (!templateIds[channel] || !templates.some((item) => item.id === templateIds[channel]
        && item.channel === channel && !item.requiresDocument)) {
        return `Choose an approved ${CHANNEL_LABEL[channel]} template.`;
      }
    }
    if (uniqueVariables.some((key) => !variables[key]?.trim())) return 'Fill in each approved template field.';
    if (sendMode === 'schedule' && (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now())) return 'Choose a future date and time.';
    return null;
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const error = validation();
    if (error) {
      toast.error(error);
      return;
    }
    await onSubmit({
      recipient: { name: recipientName.trim(), ...(email.trim() ? { email: email.trim() } : {}), ...(phone.trim() ? { phone: phone.trim() } : {}) },
      ...(petName.trim() ? { petName: petName.trim() } : {}),
      channels,
      ...(channels.includes('EMAIL') ? { emailContent: emailContent.trim() } : {}),
      ...(channels.includes('EMAIL') ? { emailSubject: emailSubject.trim() } : {}),
      templateIds,
      templateVariables: variables,
      ...(sendMode === 'schedule' ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
    });
  };

  return (
    <form className="space-y-5 rounded-xl border bg-card p-5" onSubmit={(event) => void submit(event)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{initial ? 'Edit scheduled message' : 'Compose a message'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">SMS and WhatsApp use approved templates. Email can use your message text.</p>
        </div>
        <button type="button" className="rounded-md p-1.5 hover:bg-muted" aria-label="Close compose" onClick={onCancel}><X className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Owner / recipient</span>
          <input required value={recipientName} onChange={(event) => setRecipientName(event.target.value)} className="w-full rounded-md border bg-background px-3 py-2" placeholder="Name" autoComplete="off" />
          {ownersLoading && <span className="text-xs text-muted-foreground">Searching clients…</span>}
          {ownerSearchError && <span className="block text-xs text-destructive">Client search failed: {ownerSearchError}</span>}
          {ownerSuggestions.length > 0 && (
            <div className="max-h-40 overflow-auto rounded-md border bg-background shadow-sm">
              {ownerSuggestions.map((owner) => (
                <button key={owner.ownerUuid} type="button" onClick={() => selectOwner(owner)} className="block w-full px-3 py-2 text-left hover:bg-muted">
                  <span className="block text-sm">{owner.name}</span>
                  <span className="text-xs text-muted-foreground">{[owner.email, owner.phone].filter(Boolean).join(' · ')}</span>
                </button>
              ))}
            </div>
          )}
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Pet (optional)</span>
          {ownerPets.length ? (
            <select value={petName} onChange={(event) => setPetName(event.target.value)} className="w-full rounded-md border bg-background px-3 py-2">
              <option value="">No pet selected</option>
              {ownerPets.map((pet) => <option key={pet.petUuid} value={pet.name}>{pet.name}</option>)}
            </select>
          ) : (
            <input value={petName} onChange={(event) => setPetName(event.target.value)} className="w-full rounded-md border bg-background px-3 py-2" placeholder="Pet name" />
          )}
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-md border bg-background px-3 py-2" placeholder="owner@example.com" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Phone</span>
          <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-md border bg-background px-3 py-2" placeholder="+91…" />
        </label>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Send via</legend>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((channel) => {
            const Icon = CHANNEL_ICON[channel];
            const selected = channels.includes(channel);
            return (
              <button key={channel} type="button" aria-pressed={selected} onClick={() => toggleChannel(channel)}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${selected ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-muted'}`}>
                <Icon className="h-4 w-4" />{CHANNEL_LABEL[channel]}{selected && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      </fieldset>
      {channels.includes('EMAIL') && (
        <div className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Email subject</span>
            <input value={emailSubject} onChange={(event) => setEmailSubject(event.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Email message</span>
            <textarea value={emailContent} onChange={(event) => setEmailContent(event.target.value)} rows={4} className="w-full rounded-md border bg-background px-3 py-2" placeholder="Write the email message…" />
          </label>
        </div>
      )}
      {channels.filter((channel) => channel !== 'EMAIL').map((channel) => {
        const channelTemplates = templates.filter((item) => item.channel === channel && !item.requiresDocument);
        const documentTemplatesAvailable = templates.some((item) => item.channel === channel && item.requiresDocument);
        const chosen = channelTemplates.find((item) => item.id === templateIds[channel]);
        return (
          <div key={channel} className="space-y-3 rounded-lg border p-4">
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Approved {CHANNEL_LABEL[channel]} template</span>
              <select value={templateIds[channel] ?? ''} onChange={(event) => setTemplateIds((current) => ({ ...current, [channel]: event.target.value }))} className="w-full rounded-md border bg-background px-3 py-2">
                <option value="">Choose a template</option>
                {channelTemplates.map((template) => <option key={template.id} value={template.id}>{template.purpose} — {template.name}</option>)}
              </select>
              {channelTemplates.length === 0 && <span className="text-xs text-muted-foreground">
                {documentTemplatesAvailable
                  ? 'This account has document templates. Send invoice PDFs from Billing.'
                  : templatesUnavailable
                    ? 'Templates could not be loaded. Retry the Messaging overview.'
                    : 'No approved templates were returned for this channel.'}
              </span>}
            </label>
            {chosen && (
              <>
                <div className="rounded-md bg-muted/60 p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Preview · {chosen.name}</p>
                  <p className="whitespace-pre-wrap text-sm">{templatePreview(chosen)}</p>
                </div>
                {uniqueVariables.filter((key) => chosen.variables?.includes(key)).map((key) => (
                  <label key={key} className="block space-y-1 text-sm">
                    <span className="font-medium">{/^\d+$/.test(key) ? `Template variable {{${key}}}` : key.replace(/([A-Z])/g, ' $1')}</span>
                    <input value={variables[key] ?? ''} onChange={(event) => setVariables((current) => ({ ...current, [key]: event.target.value }))} className="w-full rounded-md border bg-background px-3 py-2" />
                  </label>
                ))}
              </>
            )}
          </div>
        );
      })}
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">When</legend>
          <div className="flex gap-2">
            <button type="button" onClick={() => setSendMode('now')} className={`rounded-md border px-3 py-2 text-sm ${sendMode === 'now' ? 'border-primary bg-primary/5 text-primary' : ''}`}>Send now</button>
            <button type="button" onClick={() => setSendMode('schedule')} className={`rounded-md border px-3 py-2 text-sm ${sendMode === 'schedule' ? 'border-primary bg-primary/5 text-primary' : ''}`}>Schedule</button>
          </div>
          {sendMode === 'schedule' && <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />}
        </fieldset>
        <div className="rounded-lg bg-muted/60 p-3 text-sm">
          <div className="font-medium">Estimated credits</div>
          <div className="mt-1">{estimatedCredits === null ? 'Estimate unavailable — channel rates were not provided.' : estimatedCredits}</div>
          <p className="mt-1 text-xs text-muted-foreground">Estimated credits for one recipient. Email may use the included monthly allowance.</p>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Close</button>
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {busy ? 'Saving…' : initial ? 'Save changes' : sendMode === 'now' ? 'Send message' : 'Schedule message'}
        </button>
      </div>
    </form>
  );
}

export default function MessagingPage() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.authReducer.user);
  const { clinicUuid, isPersonalPractice, loading: clinicLoading, error: clinicError } = useActiveClinic();
  const doctorMode = location.pathname.startsWith('/doctor/');
  const scope = useMemo(() => doctorMode ? ({ kind: 'doctor' as const }) : clinicUuid ? ({ kind: 'clinic' as const, clinicUuid }) : null, [clinicUuid, doctorMode]);
  const scopeKey = scope?.kind === 'clinic' ? scope.clinicUuid : 'doctor';
  const canAdminister = doctorMode || hasRole(user?.roles, ROLES.CLINIC_ADMIN);
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedChannel, setSelectedChannel] = useState<MessagingChannel | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);

  const overviewQuery = useQuery({
    queryKey: ['messaging-overview', scopeKey],
    queryFn: () => fetchMessagingOverview(scope!),
    enabled: Boolean(scope),
  });
  const messagesQuery = useQuery({
    queryKey: ['messaging-messages', scopeKey],
    queryFn: () => fetchMessagingMessages(scope!),
    enabled: Boolean(scope),
  });
  const creditsQuery = useQuery({
    queryKey: ['messaging-credits', scopeKey],
    queryFn: () => fetchMessagingCredits(scope!),
    enabled: Boolean(scope) && (tab === 'credits' || (tab === 'overview' && selectedChannel !== null && selectedChannel !== 'EMAIL')),
  });
  const automationsQuery = useQuery({
    queryKey: ['messaging-automations', scopeKey],
    queryFn: () => fetchMessagingAutomations(scope!),
    enabled: Boolean(scope) && tab === 'settings',
  });
  const settingsQuery = useQuery({
    queryKey: ['messaging-settings', scopeKey],
    queryFn: () => fetchMessagingSettings(scope!),
    enabled: Boolean(scope) && tab === 'settings',
  });
  const editQuery = useQuery({
    queryKey: ['messaging-message', scopeKey, editingUuid],
    queryFn: () => fetchMessagingMessage(scope!, editingUuid!),
    enabled: Boolean(scope && editingUuid),
  });
  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['messaging-overview', scopeKey] }),
      queryClient.invalidateQueries({ queryKey: ['messaging-messages', scopeKey] }),
      queryClient.invalidateQueries({ queryKey: ['messaging-credits', scopeKey] }),
    ]);
  };
  const createMutation = useMutation({
    mutationFn: (request: CreateMessagingRequest) => createMessagingMessage(scope!, request),
    onSuccess: async () => {
      toast.success('Message saved.');
      setComposeOpen(false);
      setEditingUuid(null);
      await refreshAll();
    },
    onError: (error) => toast.error(errorText(error)),
  });
  const updateMutation = useMutation({
    mutationFn: (request: CreateMessagingRequest) => updateMessagingMessage(scope!, editingUuid!, request),
    onSuccess: async () => {
      toast.success('Message updated.');
      setEditingUuid(null);
      await refreshAll();
    },
    onError: (error) => toast.error(errorText(error)),
  });
  const actionMutation = useMutation({
    mutationFn: ({ uuid, action }: { uuid: string; action: 'pause' | 'resume' | 'cancel' | 'retry' }) => performMessagingAction(scope!, uuid, action),
    onSuccess: async (_message, { action }) => {
      const label = { pause: 'paused', resume: 'resumed', cancel: 'cancelled', retry: 'retry requested' }[action];
      toast.success(`Message ${label}.`);
      await refreshAll();
    },
    onError: (error) => toast.error(errorText(error)),
  });
  const globalMutation = useMutation({
    mutationFn: (paused: boolean) => setMessagingPauseAll(scope!, paused),
    onSuccess: async (_result, paused) => {
      toast.success(paused ? 'All messaging paused.' : 'Messaging resumed.');
      await refreshAll();
    },
    onError: (error) => toast.error(errorText(error)),
  });
  const automationsMutation = useMutation({
    mutationFn: (data: MessagingAutomation[]) => saveMessagingAutomations(scope!, data),
    onSuccess: async () => {
      toast.success('Automations saved.');
      await queryClient.invalidateQueries({ queryKey: ['messaging-automations', scopeKey] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  const settingsMutation = useMutation({
    mutationFn: (data: MessagingSettings) => saveMessagingSettings(scope!, data),
    onSuccess: async () => {
      toast.success('Messaging settings saved.');
      await queryClient.invalidateQueries({ queryKey: ['messaging-settings', scopeKey] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  const purchaseMutation = useMutation({
    mutationFn: async (bundleId: string) => {
      const order = await createMessagingCreditPurchase(scope!, bundleId);
      const payment = await openRazorpayCheckout({
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: order.name || 'Kittyp',
        description: order.description || 'Messaging credits',
        ...(order.key ? { key: order.key } : {}),
        prefill: {
          name: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
          email: user?.email,
          contact: user?.phoneNumber,
        },
      });
      const verified = await verifyMessagingCreditPurchase(scope!, order.purchaseUuid, payment);
      if (!verified.success) throw new Error(verified.message || 'Payment verification did not complete.');
      return verified;
    },
    onSuccess: async () => {
      toast.success('Credits purchased.');
      await queryClient.invalidateQueries({ queryKey: ['messaging-credits', scopeKey] });
      await refreshAll();
    },
    onError: (error) => toast.error(errorText(error)),
  });

  const messages = messagesQuery.data ?? [];
  const upcoming = messages.filter(isUpcoming).sort((a, b) => new Date(a.scheduledAt || 0).getTime() - new Date(b.scheduledAt || 0).getTime());
  const history = messages.filter((message) => !isUpcoming(message));
  const tabs: { id: Tab; label: string; icon: typeof Mail }[] = [
    { id: 'overview', label: 'Overview', icon: CircleDollarSign },
    { id: 'upcoming', label: 'Upcoming', icon: CalendarClock },
    { id: 'history', label: 'Message History', icon: Clock3 },
    { id: 'credits', label: 'My Credits', icon: CircleDollarSign },
    { id: 'settings', label: 'Settings / Automations', icon: Settings2 },
  ];

  const handleAction = (message: MessagingMessage, action: 'pause' | 'resume' | 'cancel' | 'retry') => {
    if (action === 'cancel' && !window.confirm('Cancel this message? It will not be sent.')) return;
    actionMutation.mutate({ uuid: message.uuid, action });
  };
  const handleGlobalPause = (paused: boolean) => {
    if (paused && !window.confirm('Pause all messages and automations for this practice?')) return;
    globalMutation.mutate(paused);
  };
  const changeTab = (nextTab: Tab) => {
    setComposeOpen(false);
    setEditingUuid(null);
    setSelectedChannel(null);
    setTab(nextTab);
  };
  const submitNewMessage = async (request: CreateMessagingRequest) => { await createMutation.mutateAsync(request); };
  const submitEdit = async (request: CreateMessagingRequest) => { await updateMutation.mutateAsync(request); };
  const editingMessage = editQuery.data;
  const dataLoading = clinicLoading || (Boolean(scope) && overviewQuery.isLoading && messagesQuery.isLoading);

  if (!doctorMode && !clinicUuid) {
    return (
      <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
        <h1 className="text-2xl font-semibold">Messaging</h1>
        {clinicLoading ? <p className="text-sm text-muted-foreground">Loading your practice…</p> : (
          <Notice>{clinicError || 'Select a practice to use Messaging.'}</Notice>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Practice tools</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Messaging</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Send and schedule client updates through Kittyp-managed channels.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canAdminister && overviewQuery.data && (
            <button type="button" disabled={globalMutation.isPending} onClick={() => handleGlobalPause(!overviewQuery.data?.globallyPaused)}
              className={`rounded-md border px-3 py-2 text-sm disabled:opacity-50 ${overviewQuery.data.globallyPaused ? 'border-emerald-600/30 text-emerald-700' : 'border-amber-600/30 text-amber-800'}`}>
              {overviewQuery.data.globallyPaused ? 'Resume all' : 'Pause all'}
            </button>
          )}
          <button type="button" onClick={() => { setEditingUuid(null); setSelectedChannel(null); setComposeOpen(true); setTab('overview'); }}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <Plus className="h-4 w-4" /> Compose
          </button>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b" aria-label="Messaging sections">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => changeTab(id)} aria-current={tab === id ? 'page' : undefined}
            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm ${tab === id ? 'border-primary font-medium text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </nav>

      {overviewQuery.isError && (
        <Notice>
          <span>Could not load Messaging overview. {errorText(overviewQuery.error)}</span>
          <button type="button" className="ml-2 underline" onClick={() => void overviewQuery.refetch()}>Try again</button>
        </Notice>
      )}
      {messagesQuery.isError && (
        <Notice>
          <span>Could not load messages. {errorText(messagesQuery.error)}</span>
          <button type="button" className="ml-2 underline" onClick={() => void messagesQuery.refetch()}>Try again</button>
        </Notice>
      )}
      {dataLoading && <div className="animate-pulse rounded-lg border p-8 text-sm text-muted-foreground">Loading messaging data…</div>}
      {!dataLoading && (
        <>
          {composeOpen && (
            <ComposeForm
              scopeClinicUuid={clinicUuid}
              templates={overviewQuery.data?.approvedTemplates ?? []}
              templatesUnavailable={!overviewQuery.data}
              rates={overviewQuery.data?.channelRates ?? {}}
              canChooseOwner={!doctorMode && Boolean(clinicUuid)}
              onCancel={() => setComposeOpen(false)}
              onSubmit={submitNewMessage}
              busy={createMutation.isPending}
            />
          )}
          {editingUuid && (
            editQuery.isLoading ? <div className="rounded-lg border p-5 text-sm text-muted-foreground">Loading message…</div> :
              editQuery.isError ? <Notice>Could not load the message. {errorText(editQuery.error)} <button type="button" className="ml-2 underline" onClick={() => void editQuery.refetch()}>Try again</button></Notice> :
                editingMessage && (
                  <ComposeForm
                    key={editingUuid}
                    scopeClinicUuid={clinicUuid}
                    templates={overviewQuery.data?.approvedTemplates ?? []}
                    templatesUnavailable={!overviewQuery.data}
                    rates={overviewQuery.data?.channelRates ?? {}}
                    initial={editingMessage}
                    canChooseOwner={!doctorMode && Boolean(clinicUuid)}
                    onCancel={() => setEditingUuid(null)}
                    onSubmit={submitEdit}
                    busy={updateMutation.isPending}
                  />
                )
          )}

          {tab === 'overview' && (
            <div className="space-y-5">
              {selectedChannel ? (
                <div className="space-y-5">
                  <button
                    type="button"
                    onClick={() => setSelectedChannel(null)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to channels
                  </button>
                  {selectedChannel === 'EMAIL' ? (
                    <ClinicEmailUsagePage embedded />
                  ) : (
                    <ChannelDetails
                      channel={selectedChannel}
                      messages={messages.filter((message) => message.channels.includes(selectedChannel))}
                      templates={(overviewQuery.data?.approvedTemplates ?? []).filter((template) => template.channel === selectedChannel)}
                      templatesLoading={overviewQuery.isLoading}
                      templatesUnavailable={!overviewQuery.data}
                      credits={creditsQuery.data}
                      loadingMessages={messagesQuery.isLoading}
                      loadingCredits={creditsQuery.isLoading}
                      creditsError={creditsQuery.isError ? errorText(creditsQuery.error) : null}
                      onRetryCredits={() => void creditsQuery.refetch()}
                      canManage={canAdminister || hasRole(user?.roles, ROLES.CLINIC_STAFF)}
                      actionBusy={actionMutation.isPending}
                      onEdit={(message) => { setComposeOpen(false); setSelectedChannel(null); setEditingUuid(message.uuid); }}
                      onAction={handleAction}
                    />
                  )}
                </div>
              ) : (
                <>
                  <section aria-label="Messaging channels" className="grid gap-3 md:grid-cols-3">
                    {CHANNELS.filter((channel) => channel !== 'EMAIL' || (canAdminister && (!doctorMode || isPersonalPractice))).map((channel) => {
                      const Icon = CHANNEL_ICON[channel];
                      const description = channel === 'EMAIL'
                        ? '2,000 free credits each month, with account email activity.'
                        : `View approved ${CHANNEL_LABEL[channel]} templates, usage, and message history.`;
                      return (
                        <button
                          key={channel}
                          type="button"
                          onClick={() => { setComposeOpen(false); setEditingUuid(null); setSelectedChannel(channel); }}
                          className="rounded-xl border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="flex items-center justify-between">
                            <span className="flex items-center gap-2 font-semibold">
                              <Icon className="h-5 w-5 text-primary" />
                              {CHANNEL_LABEL[channel]}
                            </span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          </span>
                          <span className="mt-2 block text-sm text-muted-foreground">{description}</span>
                          <span className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                            View details <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </span>
                        </button>
                      );
                    })}
                  </section>
              {overviewQuery.data?.globallyPaused && <Notice kind="info">All messaging is paused. Scheduled messages will stay queued until messaging is resumed.</Notice>}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['Upcoming', messagesQuery.isLoading ? '…' : upcoming.length],
                  ['Delivered / sent', messages.filter((item) => ['DELIVERED', 'SENT'].includes(item.status.toUpperCase())).length],
                  ['Failed', messages.filter((item) => item.status.toUpperCase() === 'FAILED').length],
                    ['Messages on record', messages.length],
                ].map(([label, value]) => <div key={label} className="rounded-xl border bg-card p-4"><div className="text-sm text-muted-foreground">{label}</div><div className="mt-2 text-2xl font-semibold">{value}</div></div>)}
              </div>
              <Panel title="Upcoming messages" description="Review what is scheduled and the exact message content.">
                {messagesQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading messages…</p> :
                  upcoming.length ? <div className="space-y-3">{upcoming.slice(0, 5).map((message) => (
                    <MessageCard key={message.uuid} message={message} canManage={canAdminister || hasRole(user?.roles, ROLES.CLINIC_STAFF)} busy={actionMutation.isPending}
                      onEdit={() => { setComposeOpen(false); setEditingUuid(message.uuid); }}
                      onAction={(action) => handleAction(message, action)} />
                  ))}</div> : <Empty>No upcoming messages. Compose a message to send now or schedule one.</Empty>}
              </Panel>
              <Panel title="Channel templates" description="SMS and WhatsApp templates are loaded from Kittyp&apos;s configured providers.">
                {overviewQuery.isLoading ? <Empty>Loading templates…</Empty> :
                  !overviewQuery.data ? <Empty>Templates could not be loaded. Retry the Messaging overview.</Empty> :
                  !overviewQuery.data.approvedTemplates.length ? <Empty>No approved templates were included in the overview.</Empty> : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {overviewQuery.data.approvedTemplates.map((template) => <div key={template.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between gap-2"><h3 className="font-medium">{template.purpose}</h3><span className="text-xs text-muted-foreground">{CHANNEL_LABEL[template.channel]}</span></div>
                      <p className="mt-1 text-sm text-muted-foreground">{template.name}</p>
                      {template.requiresDocument && <p className="mt-2 text-xs text-muted-foreground">Document template · send with the invoice PDF from Billing.</p>}
                      <p className="mt-3 whitespace-pre-wrap text-sm">{template.body}</p>
                    </div>)}
                  </div>
                )}
              </Panel>
                </>
              )}
            </div>
          )}

          {tab === 'upcoming' && (
            <Panel title="Upcoming" description="Queued and scheduled messages, with the resolved content that will be sent.">
              {messagesQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading upcoming messages…</p> :
                upcoming.length ? <div className="space-y-3">{upcoming.map((message) => (
                  <MessageCard key={message.uuid} message={message} canManage={canAdminister || hasRole(user?.roles, ROLES.CLINIC_STAFF)} busy={actionMutation.isPending}
                    onEdit={() => { setComposeOpen(false); setEditingUuid(message.uuid); }}
                    onAction={(action) => handleAction(message, action)} />
                ))}</div> : <Empty>No upcoming messages.</Empty>}
            </Panel>
          )}

          {tab === 'history' && (
            <Panel title="Message History" description="Sent, delivered, cancelled and failed messages.">
              {messagesQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading message history…</p> :
                history.length ? <div className="space-y-3">{history.map((message) => (
                  <MessageCard key={message.uuid} message={message} canManage={canAdminister || hasRole(user?.roles, ROLES.CLINIC_STAFF)} busy={actionMutation.isPending}
                    onEdit={() => { setComposeOpen(false); setEditingUuid(message.uuid); }}
                    onAction={(action) => handleAction(message, action)} />
                ))}</div> : <Empty>No message history yet.</Empty>}
            </Panel>
          )}

          {tab === 'credits' && (
            <CreditsPanel
              loading={creditsQuery.isLoading}
              error={creditsQuery.isError ? errorText(creditsQuery.error) : null}
              credits={creditsQuery.data}
              onRetry={() => void creditsQuery.refetch()}
              onPurchase={(bundleId) => purchaseMutation.mutate(bundleId)}
              purchasing={purchaseMutation.isPending}
              canPurchase={canAdminister}
            />
          )}

          {tab === 'settings' && (
            <SettingsPanel
              automations={automationsQuery.data}
              settings={settingsQuery.data}
              loading={automationsQuery.isLoading || settingsQuery.isLoading}
              error={automationsQuery.isError || settingsQuery.isError ? errorText(automationsQuery.error || settingsQuery.error) : null}
              canEdit={canAdminister}
              onRetry={() => { void automationsQuery.refetch(); void settingsQuery.refetch(); }}
              saving={automationsMutation.isPending || settingsMutation.isPending}
              onSaveAutomations={(items) => automationsMutation.mutate(items)}
              onSaveSettings={(settings) => settingsMutation.mutate(settings)}
            />
          )}
        </>
      )}
    </main>
  );
}

function ChannelDetails({
  channel,
  messages,
  templates,
  templatesLoading,
  templatesUnavailable,
  credits,
  loadingMessages,
  loadingCredits,
  creditsError,
  onRetryCredits,
  canManage,
  actionBusy,
  onEdit,
  onAction,
}: {
  channel: Exclude<MessagingChannel, 'EMAIL'>;
  messages: MessagingMessage[];
  templates: MessagingTemplate[];
  templatesLoading: boolean;
  templatesUnavailable: boolean;
  credits?: MessagingCredits;
  loadingMessages: boolean;
  loadingCredits: boolean;
  creditsError: string | null;
  onRetryCredits: () => void;
  canManage: boolean;
  actionBusy: boolean;
  onEdit: (message: MessagingMessage) => void;
  onAction: (message: MessagingMessage, action: 'pause' | 'resume' | 'cancel' | 'retry') => void;
}) {
  const sentCount = messages.filter((message) => ['DELIVERED', 'SENT'].includes(message.status.toUpperCase())).length;
  const failedCount = messages.filter((message) => message.status.toUpperCase() === 'FAILED').length;
  const upcomingMessages = messages
    .filter(isUpcoming)
    .sort((a, b) => new Date(a.scheduledAt || 0).getTime() - new Date(b.scheduledAt || 0).getTime());
  const historyMessages = messages
    .filter((message) => !isUpcoming(message))
    .sort((a, b) => new Date(b.sentAt || b.createdAt || 0).getTime() - new Date(a.sentAt || a.createdAt || 0).getTime());
  const creditUsed = credits?.usedThisPeriod[channel] ?? 0;

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-semibold">{CHANNEL_LABEL[channel]} details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review {CHANNEL_LABEL[channel]} usage, approved templates, and messages sent through this channel.
        </p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Upcoming', loadingMessages ? '…' : upcomingMessages.length],
          ['Sent / delivered', loadingMessages ? '…' : sentCount],
          ['Failed', loadingMessages ? '…' : failedCount],
          ['Credits used', loadingCredits ? '…' : creditsError ? 'Unavailable' : creditUsed],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </section>
      {creditsError && (
        <Notice>
          <span>Could not load {CHANNEL_LABEL[channel]} credits. {creditsError}</span>
          <button type="button" className="ml-2 underline" onClick={onRetryCredits}>Try again</button>
        </Notice>
      )}
      <Panel title="Approved templates" description={`Templates available for ${CHANNEL_LABEL[channel]}.`}>
        {templatesLoading ? <Empty>Loading templates…</Empty> :
          templatesUnavailable ? <Empty>Templates could not be loaded. Retry the Messaging overview.</Empty> :
          !templates.length ? <Empty>No approved templates are currently available.</Empty> : (
          <div className="grid gap-3 md:grid-cols-2">
            {templates.map((template) => (
              <article key={template.id} className="rounded-lg border p-4">
                <h3 className="font-medium">{template.purpose}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{template.name}</p>
                {template.requiresDocument && <p className="mt-2 text-xs text-muted-foreground">Document template · send with the invoice PDF from Billing.</p>}
                <p className="mt-3 whitespace-pre-wrap text-sm">{template.body}</p>
              </article>
            ))}
          </div>
        )}
      </Panel>
      <Panel title={`${CHANNEL_LABEL[channel]} message activity`} description="Messages sent or scheduled through this channel.">
        {loadingMessages ? <p className="text-sm text-muted-foreground">Loading messages…</p> :
          !messages.length ? <Empty>No {CHANNEL_LABEL[channel]} messages yet.</Empty> : (
            <div className="space-y-3">
              {[...upcomingMessages, ...historyMessages].map((message) => (
                <MessageCard
                  key={message.uuid}
                  message={message}
                  channel={channel}
                  canManage={canManage}
                  busy={actionBusy}
                  onEdit={() => onEdit(message)}
                  onAction={(action) => onAction(message, action)}
                />
              ))}
            </div>
          )}
      </Panel>
    </div>
  );
}

function CreditsPanel({
  loading,
  error,
  credits,
  onRetry,
  onPurchase,
  purchasing,
  canPurchase,
}: {
  loading: boolean;
  error: string | null;
  credits?: MessagingCredits;
  onRetry: () => void;
  onPurchase: (bundleId: string) => void;
  purchasing: boolean;
  canPurchase: boolean;
}) {
  if (loading) return <div className="rounded-lg border p-8 text-sm text-muted-foreground">Loading credits…</div>;
  if (error) return <Notice>{error} <button type="button" className="ml-2 underline" onClick={onRetry}>Try again</button></Notice>;
  if (!credits) return <Empty>Credit details were not returned.</Empty>;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {CHANNELS.map((channel) => (
          <div key={channel} className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{CHANNEL_LABEL[channel]} credits</p>
            <p className="mt-2 text-3xl font-semibold">{credits.balance[channel] ?? 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">Used this period: {credits.usedThisPeriod[channel] ?? 0}</p>
          </div>
        ))}
      </div>
      <Panel title="Buy credits" description="Choose a credit pack. Prices and order amount come from Kittyp.">
        {!canPurchase && <Notice kind="info">Only a doctor or practice admin can buy credits.</Notice>}
        {!credits.purchaseOptions.length ? <Empty>No credit packs are available.</Empty> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {credits.purchaseOptions.map((bundle) => <div key={bundle.id} className="rounded-lg border p-4">
              <h3 className="font-medium">{CHANNEL_LABEL[bundle.channel]} · {bundle.name}</h3>
              <p className="mt-2 text-2xl font-semibold">{bundle.credits} credits</p>
              <p className="mt-1 text-sm text-muted-foreground">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: bundle.currency }).format(bundle.amount)} including tax</p>
              <button type="button" disabled={!canPurchase || purchasing} onClick={() => onPurchase(bundle.id)} className="mt-4 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                {purchasing ? 'Processing…' : 'Buy'}
              </button>
            </div>)}
          </div>
        )}
      </Panel>
      <Panel title="Credit activity" description="Transactions returned by the credits service.">
        {!credits.transactions.length ? <Empty>No credit transactions yet.</Empty> : <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className="border-b text-muted-foreground"><th className="pb-2 font-medium">Date</th><th className="pb-2 font-medium">Channel</th><th className="pb-2 font-medium">Activity</th><th className="pb-2 font-medium">Credits</th></tr></thead>
            <tbody>{credits.transactions.map((transaction) => <tr key={transaction.uuid} className="border-b last:border-0"><td className="py-3">{localDateTime(transaction.createdAt)}</td><td className="py-3">{CHANNEL_LABEL[transaction.channel]}</td><td className="py-3">{transaction.description}</td><td className="py-3">{transaction.credits > 0 ? '+' : ''}{transaction.credits}</td></tr>)}</tbody>
          </table>
        </div>}
      </Panel>
    </div>
  );
}

function SettingsPanel({
  automations,
  settings,
  loading,
  error,
  canEdit,
  onRetry,
  saving,
  onSaveAutomations,
  onSaveSettings,
}: {
  automations?: MessagingAutomation[];
  settings?: MessagingSettings;
  loading: boolean;
  error: string | null;
  canEdit: boolean;
  onRetry: () => void;
  saving: boolean;
  onSaveAutomations: (items: MessagingAutomation[]) => void;
  onSaveSettings: (settings: MessagingSettings) => void;
}) {
  const [automationDraft, setAutomationDraft] = useState<MessagingAutomation[]>([]);
  const [settingsDraft, setSettingsDraft] = useState<MessagingSettings | null>(null);
  useEffect(() => { if (automations) setAutomationDraft(automations); }, [automations]);
  useEffect(() => { if (settings) setSettingsDraft(settings); }, [settings]);
  if (loading) return <div className="rounded-lg border p-8 text-sm text-muted-foreground">Loading messaging settings…</div>;
  if (error) return <Notice>{error} <button type="button" className="ml-2 underline" onClick={onRetry}>Try again</button></Notice>;
  if (!settingsDraft) return <Empty>Settings were not returned.</Empty>;

  const updateAutomation = (index: number, patch: Partial<MessagingAutomation>) =>
    setAutomationDraft((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));

  return (
    <div className="space-y-5">
      {!canEdit && <Notice kind="info">These settings are read-only for clinic staff.</Notice>}
      <Panel title="Automations" description="Enable or disable the automation rules configured for this practice.">
        {!automationDraft.length ? <Empty>No automation rules are configured.</Empty> : <div className="space-y-3">
          {automationDraft.map((automation, index) => <div key={automation.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="font-medium">{automation.id.replaceAll('_', ' ').replaceAll('.', ' ')}</h3>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={automation.enabled} disabled={!canEdit} onChange={(event) => updateAutomation(index, { enabled: event.target.checked })} />
                Enabled
              </label>
            </div>
          </div>)}
        </div>}
        {canEdit && <div className="mt-4 flex justify-end"><button type="button" disabled={saving} onClick={() => onSaveAutomations(automationDraft)} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? 'Saving…' : 'Save automations'}</button></div>}
      </Panel>
      <Panel title="Global pause" description="Stop future provider dispatches while preserving scheduled messages.">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settingsDraft.globallyPaused}
            disabled={!canEdit}
            onChange={(event) => setSettingsDraft({ paused: event.target.checked, globallyPaused: event.target.checked })}
          />
          Pause all outgoing messages
        </label>
        {canEdit && <div className="mt-4 flex justify-end"><button type="button" disabled={saving} onClick={() => onSaveSettings(settingsDraft)} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? 'Saving…' : 'Save pause setting'}</button></div>}
      </Panel>
    </div>
  );
}
