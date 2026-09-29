import type { WhatsAppSettingsResponse } from '@/services/invoiceService';

function templateStatus(settings: WhatsAppSettingsResponse | null | undefined): string {
  const invoice = settings?.templates?.find((t) => t.name === 'invoice_receipt');
  return (
    settings?.invoiceTemplateStatus ||
    invoice?.status ||
    settings?.templatesStatus ||
    ''
  )
    .trim()
    .toUpperCase();
}

/** Short line for clinic/doctor settings cards. */
export function whatsappSettingsSummary(settings: {
  configured: boolean;
  ready: boolean;
  templateStatus?: string;
}): string {
  if (!settings.configured) {
    return 'Not connected yet. Connect with Meta must finish (Facebook login + number pick) before KittyP can save WhatsApp.';
  }
  if (settings.ready || settings.templateStatus === 'APPROVED' || settings.templateStatus === 'ACTIVE') {
    return 'Connected and ready to send invoices.';
  }
  const status = (settings.templateStatus || '').toUpperCase();
  if (status === 'PENDING' || status === 'IN_APPEAL') {
    return 'Credentials saved. Waiting for Meta to approve the invoice_receipt template.';
  }
  if (status === 'REJECTED') {
    return 'Credentials saved, but Meta rejected the invoice template. Open WhatsApp Manager, then retry setup.';
  }
  if (status === 'ERROR') {
    return 'Credentials are saved, but template setup failed. This is not Meta login success — retry template setup or reconnect.';
  }
  return 'Phone ID and token are saved on this practice. Meta login is a separate step — “waiting for approval” only applies after invoice_receipt is submitted and PENDING.';
}

export function whatsappHeroCopy(settings: WhatsAppSettingsResponse | null): {
  title: string;
  detail: string;
  tone: 'idle' | 'wait' | 'ready' | 'warn';
} {
  if (!settings?.whatsappConfigured) {
    return {
      title: 'Not connected',
      detail:
        'Connect your practice WhatsApp number with Meta. A Facebook login error means nothing was saved — you are still not connected.',
      tone: 'idle',
    };
  }
  if (settings.whatsappReadyToSend || settings.invoiceTemplateStatus === 'APPROVED' || settings.templatesReady) {
    return {
      title: 'Ready to send',
      detail: 'Invoices can be sent on WhatsApp from Billing.',
      tone: 'ready',
    };
  }
  const status = templateStatus(settings);
  if (status === 'PENDING' || status === 'IN_APPEAL') {
    return {
      title: 'Connected · waiting for Meta approval',
      detail:
        settings.templatesMessage ||
        'KittyP submitted your invoice template. Meta usually approves within minutes to a day.',
      tone: 'wait',
    };
  }
  if (status === 'REJECTED') {
    return {
      title: 'Connected · template rejected',
      detail:
        settings.templatesMessage ||
        'Meta rejected invoice_receipt. Fix it in WhatsApp Manager, then retry template setup.',
      tone: 'warn',
    };
  }
  if (status === 'ERROR') {
    return {
      title: 'Credentials saved · template setup failed',
      detail:
        settings.templatesMessage ||
        'Phone Number ID / token are on file, but KittyP could not create or read templates. This is not a successful Connect with Meta.',
      tone: 'warn',
    };
  }
  return {
    title: 'Credentials on file · not fully connected',
    detail:
      settings.templatesMessage ||
      'This practice already has a Phone Number ID and token saved (often from Advanced/manual setup). Clicking Connect with Meta did not complete Facebook login — that error does not mean Meta approved anything. Finish Connect with Meta on HTTPS, or retry template setup.',
    tone: 'warn',
  };
}
