type Msg91SuccessData = Record<string, unknown> | string;

type Msg91Configuration = {
  widgetId: string;
  tokenAuth: string;
  identifier: string;
  exposeMethods?: boolean;
  success: (data: Msg91SuccessData) => void;
  failure: (error: unknown) => void;
};

type Msg91Window = Window & {
  initSendOTP?: (configuration: Msg91Configuration) => void;
};

const MSG91_SCRIPT_URLS = [
  'https://verify.msg91.com/otp-provider.js',
  'https://verify.phone91.com/otp-provider.js',
];

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${url}"]`);
    if (existing) {
      if ((window as Msg91Window).initSendOTP) resolve();
      else existing.addEventListener('load', () => resolve(), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load MSG91 widget from ${url}`));
    document.head.appendChild(script);
  });
}

async function ensureWidgetLoaded(): Promise<void> {
  if ((window as Msg91Window).initSendOTP) return;

  let lastError: unknown;
  for (const url of MSG91_SCRIPT_URLS) {
    try {
      await loadScript(url);
      if ((window as Msg91Window).initSendOTP) return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('MSG91 widget is unavailable');
}

function extractAccessToken(data: Msg91SuccessData): string {
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (!data || typeof data !== 'object') throw new Error('MSG91 did not return a verification token');

  const candidates = [
    data.accessToken,
    data.access_token,
    data['access-token'],
    data.token,
    data.message,
  ];
  const token = candidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0);
  if (!token) throw new Error('MSG91 did not return a verification token');
  return token.trim();
}

export async function openMsg91OtpWidget(phone: string): Promise<string> {
  const widgetId = import.meta.env.VITE_MSG91_WIDGET_ID;
  const tokenAuth = import.meta.env.VITE_MSG91_TOKEN_AUTH;
  if (!widgetId || !tokenAuth) {
    throw new Error('MSG91 widget configuration is missing');
  }

  await ensureWidgetLoaded();
  const initSendOTP = (window as Msg91Window).initSendOTP;
  if (!initSendOTP) throw new Error('MSG91 widget failed to initialize');

  return new Promise((resolve, reject) => {
    initSendOTP({
      widgetId,
      tokenAuth,
      identifier: phone,
      exposeMethods: false,
      success: (data) => {
        try {
          resolve(extractAccessToken(data));
        } catch (error) {
          reject(error);
        }
      },
      failure: (error) => reject(new Error(typeof error === 'string' ? error : 'MSG91 OTP verification failed')),
    });
  });
}