import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, CircleDashed, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConnectWhatsAppWithMetaButton } from '@/components/whatsapp/ConnectWhatsAppWithMetaButton';
import { WhatsAppSettingsForm } from '@/components/whatsapp/WhatsAppSettingsForm';
import type { WhatsAppSettingsResponse, WhatsAppTemplateRow } from '@/services/invoiceService';
import { whatsappHeroCopy } from '@/components/whatsapp/whatsappStatusCopy';

function heroIcon(tone: ReturnType<typeof whatsappHeroCopy>['tone']) {
  if (tone === 'ready') return CheckCircle2;
  if (tone === 'wait') return Clock;
  return CircleDashed;
}

export function WhatsAppBusinessPage({
  mode,
  clinicUuid,
  loadSettings,
  saveManual,
  retryTemplates,
}: {
  mode: 'clinic' | 'doctor';
  clinicUuid?: string;
  loadSettings: () => Promise<WhatsAppSettingsResponse>;
  saveManual: (values: {
    phoneNumberId: string;
    businessAccountId: string;
    token?: string;
  }) => Promise<WhatsAppSettingsResponse>;
  retryTemplates: () => Promise<WhatsAppSettingsResponse>;
}) {
  const [settings, setSettings] = useState<WhatsAppSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const wa = await loadSettings();
      setSettings(wa);
    } catch {
      toast.error('Could not load WhatsApp settings');
    } finally {
      setLoading(false);
    }
  }, [loadSettings]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const apply = (wa: WhatsAppSettingsResponse) => setSettings(wa);
  const hero = whatsappHeroCopy(settings);
  const HeroIcon = heroIcon(hero.tone);
  const invoiceRow = settings?.templates?.find((t) => t.name === 'invoice_receipt');
  const invoiceStatus =
    settings?.invoiceTemplateStatus || invoiceRow?.status || settings?.templatesStatus || 'MISSING';

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4 md:p-6">
      <header className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">WhatsApp Business</p>
        <div className="flex items-start gap-3">
          <HeroIcon
            className={`mt-1 h-7 w-7 shrink-0 ${
              hero.tone === 'ready'
                ? 'text-emerald-600'
                : hero.tone === 'wait'
                  ? 'text-amber-600'
                  : hero.tone === 'warn'
                    ? 'text-amber-700'
                    : 'text-muted-foreground'
            }`}
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{hero.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{hero.detail}</p>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <ConnectWhatsAppWithMetaButton
          mode={mode}
          clinicUuid={clinicUuid}
          disabled={loading}
          onConnected={apply}
        />
        {!settings?.whatsappConfigured ? (
          <p className="text-xs text-muted-foreground">
            Opens Meta’s signup flow. You’ll confirm your business WhatsApp number, then return here.
          </p>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-foreground">What happens next</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Connect with Meta and pick your WhatsApp Business number</li>
          <li>KittyP saves the connection and creates the invoice template</li>
          <li>When Meta approves the template, send invoices from Billing</li>
        </ol>
      </section>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Template checklist</CardTitle>
          <CardDescription>Invoice receipt template used when sending PDFs to pet parents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-foreground">invoice_receipt</span>
            <span className="text-muted-foreground">{invoiceStatus}</span>
          </div>
          {settings?.templatesMessage ? (
            <p className="text-xs text-muted-foreground">{settings.templatesMessage}</p>
          ) : null}
          {settings?.whatsappConfigured && invoiceStatus !== 'APPROVED' && invoiceStatus !== 'ACTIVE' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={retrying}
              onClick={() => {
                setRetrying(true);
                void retryTemplates()
                  .then((wa) => {
                    apply(wa);
                    toast.success('Template setup refreshed');
                  })
                  .catch(() => toast.error('Could not retry templates'))
                  .finally(() => setRetrying(false));
              }}
            >
              {retrying ? 'Retrying…' : 'Retry template setup'}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-left text-sm font-medium text-foreground"
          onClick={() => setAdvancedOpen((o) => !o)}
        >
          Advanced: enter credentials manually
          <ChevronDown className={`h-4 w-4 transition ${advancedOpen ? 'rotate-180' : ''}`} />
        </button>
        {advancedOpen ? (
          <div className="rounded-lg border border-border p-4">
            <WhatsAppSettingsForm
              configured={!!settings?.whatsappConfigured}
              phoneNumberIdInitial={settings?.phoneNumberId || ''}
              businessAccountIdInitial={settings?.businessAccountId || ''}
              templatesReady={settings?.templatesReady}
              templatesStatus={settings?.templatesStatus}
              templatesMessage={settings?.templatesMessage}
              templates={settings?.templates as WhatsAppTemplateRow[] | undefined}
              helperText="For pilots only. Prefer Connect with Meta above."
              onSave={async (values) => {
                const wa = await saveManual(values);
                apply(wa);
                return wa;
              }}
              onRetryTemplates={async () => {
                const wa = await retryTemplates();
                apply(wa);
                return wa;
              }}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
