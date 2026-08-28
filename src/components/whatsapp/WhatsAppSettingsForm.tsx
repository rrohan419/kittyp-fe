import { useEffect, useState } from 'react';
import { CheckCircle2, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export type WhatsAppSettingsValues = {
  phoneNumberId: string;
  businessAccountId: string;
  token?: string;
};

type FormMode = 'setup' | 'view' | 'edit' | 'replace';

function maskId(id: string): string {
  const t = id.trim();
  if (t.length <= 8) return t || '—';
  return `${t.slice(0, 4)}…${t.slice(-4)}`;
}

/** Meta Cloud API credentials — only the three fields needed to send. Token is write-only. */
export function WhatsAppSettingsForm({
  configured,
  phoneNumberIdInitial = '',
  businessAccountIdInitial = '',
  onSave,
  helperText,
}: {
  configured: boolean;
  phoneNumberIdInitial?: string;
  businessAccountIdInitial?: string;
  onSave: (values: WhatsAppSettingsValues) => Promise<void>;
  helperText?: string;
}) {
  const [mode, setMode] = useState<FormMode>(configured ? 'view' : 'setup');
  const [phoneNumberId, setPhoneNumberId] = useState(phoneNumberIdInitial);
  const [businessAccountId, setBusinessAccountId] = useState(businessAccountIdInitial);
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPhoneNumberId(phoneNumberIdInitial);
  }, [phoneNumberIdInitial]);

  useEffect(() => {
    setBusinessAccountId(businessAccountIdInitial);
  }, [businessAccountIdInitial]);

  useEffect(() => {
    if (configured && mode === 'setup') {
      setMode('view');
    }
    if (!configured && mode === 'view') {
      setMode('setup');
    }
  }, [configured, mode]);

  const resetFieldsFromSaved = () => {
    setPhoneNumberId(phoneNumberIdInitial);
    setBusinessAccountId(businessAccountIdInitial);
    setToken('');
  };

  const openEdit = () => {
    resetFieldsFromSaved();
    setMode('edit');
  };

  const openReplace = () => {
    setPhoneNumberId('');
    setBusinessAccountId('');
    setToken('');
    setMode('replace');
  };

  const cancelForm = () => {
    resetFieldsFromSaved();
    setMode(configured ? 'view' : 'setup');
  };

  const save = async () => {
    if (!phoneNumberId.trim()) {
      toast.error('WhatsApp Phone Number ID is required');
      return;
    }
    if (!businessAccountId.trim()) {
      toast.error('WhatsApp Business Account ID is required');
      return;
    }
    const requireToken = mode === 'setup' || mode === 'replace' || !configured;
    if (requireToken && !token.trim()) {
      toast.error(
        mode === 'replace'
          ? 'Enter the new access token to replace WhatsApp'
          : 'WhatsApp token is required for first-time setup'
      );
      return;
    }
    setSaving(true);
    try {
      await onSave({
        phoneNumberId: phoneNumberId.trim(),
        businessAccountId: businessAccountId.trim(),
        token: token.trim() || undefined,
      });
      setToken('');
      setMode('view');
      toast.success(
        mode === 'replace' ? 'WhatsApp number replaced' : 'WhatsApp connected'
      );
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string; detailedMessage?: string } }; message?: string };
      toast.error(
        ax.response?.data?.detailedMessage ||
          ax.response?.data?.message ||
          ax.message ||
          'WhatsApp verification failed'
      );
    } finally {
      setSaving(false);
    }
  };

  if (mode === 'view' && configured) {
    return (
      <div className="space-y-3">
        {helperText ? <p className="text-sm text-muted-foreground">{helperText}</p> : null}
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">WhatsApp connected</p>
            <p className="text-xs text-muted-foreground truncate">
              Phone ID {maskId(phoneNumberIdInitial)} · WABA {maskId(businessAccountIdInitial)}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={openEdit}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        </div>
      </div>
    );
  }

  const title =
    mode === 'replace'
      ? 'Replace WhatsApp number'
      : mode === 'edit'
        ? 'Edit WhatsApp credentials'
        : 'Connect WhatsApp';

  return (
    <div className="space-y-3">
      {helperText ? <p className="text-sm text-muted-foreground">{helperText}</p> : null}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {mode === 'edit' && (
          <Button type="button" variant="ghost" size="sm" onClick={openReplace}>
            Reset to new WhatsApp
          </Button>
        )}
      </div>
      {mode === 'replace' && (
        <p className="text-xs text-muted-foreground">
          Enter Meta credentials for the new number. Saved only after successful verification.
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="wa-phone-id">Phone Number ID</Label>
        <Input
          id="wa-phone-id"
          value={phoneNumberId}
          onChange={(e) => setPhoneNumberId(e.target.value)}
          placeholder="WHATSAPP_PHONE_NUMBER_ID"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          From Meta WhatsApp → API Setup → Phone number ID
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="wa-waba-id">Business Account ID</Label>
        <Input
          id="wa-waba-id"
          value={businessAccountId}
          onChange={(e) => setBusinessAccountId(e.target.value)}
          placeholder="WHATSAPP_BUSINESS_ACCOUNT_ID"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">WhatsApp Business Account (WABA) ID</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="wa-token">
          Access token
          {mode === 'edit' ? ' (leave blank to keep current)' : ''}
        </Label>
        <Input
          id="wa-token"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder={mode === 'edit' ? '••••••••' : 'WHATSAPP_TOKEN'}
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground">
          Permanent system-user token — never shown again after save
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={saving} onClick={() => void save()}>
          {saving
            ? 'Verifying…'
            : mode === 'replace'
              ? 'Verify and replace'
              : mode === 'edit'
                ? 'Verify and save'
                : 'Verify and connect'}
        </Button>
        {(mode === 'edit' || mode === 'replace') && (
          <Button type="button" variant="outline" disabled={saving} onClick={cancelForm}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
