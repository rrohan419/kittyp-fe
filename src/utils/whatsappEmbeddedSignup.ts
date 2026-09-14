export type EmbeddedSignupPayload = {
  type?: string;
  event?: string;
  waba_id?: string;
  phone_number_id?: string;
  data?: {
    waba_id?: string;
    phone_number_id?: string;
    data?: {
      waba_id?: string;
      phone_number_id?: string;
    };
  };
};

const EDIT_SETTINGS_HINT =
  'Facebook reused a previous KittyP login. Click Connect again, choose Edit Settings, and finish WhatsApp setup.';

export function facebookLoginEditSettingsHint(): string {
  return EDIT_SETTINGS_HINT;
}

export function isFacebookMessageOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return host === 'facebook.com' || host.endsWith('.facebook.com');
  } catch {
    return false;
  }
}

export function isEmbeddedSignupFinish(event: string | undefined): boolean {
  return Boolean(event?.startsWith('FINISH'));
}

export function pickEmbeddedSignupId(
  payload: EmbeddedSignupPayload,
  key: 'waba_id' | 'phone_number_id'
): string {
  const nested = payload.data?.data?.[key];
  const mid = payload.data?.[key];
  const root = payload[key];
  return (nested || mid || root || '').trim();
}

export function parseEmbeddedSignupMessage(data: unknown): EmbeddedSignupPayload | null {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as EmbeddedSignupPayload;
    } catch {
      return null;
    }
  }
  if (data && typeof data === 'object') {
    return data as EmbeddedSignupPayload;
  }
  return null;
}
