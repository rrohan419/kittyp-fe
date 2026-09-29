import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  connectClinicWhatsAppEmbedded,
  connectDoctorWhatsAppEmbedded,
  fetchWhatsAppEmbeddedSignupConfig,
  type WhatsAppEmbeddedSignupConfig,
  type WhatsAppSettingsResponse,
} from '@/services/invoiceService';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    FB?: {
      init: (opts: Record<string, unknown>) => void;
      login: (
        cb: (response: { authResponse?: { code?: string }; status?: string }) => void,
        opts: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

type SessionData = {
  wabaId?: string;
  phoneNumberId?: string;
  event?: string;
};

function loadFacebookSdk(appId: string, apiVersion: string): Promise<void> {
  const version = apiVersion.startsWith('v') ? apiVersion : `v${apiVersion}`;
  return new Promise((resolve, reject) => {
    const init = () => {
      if (!window.FB) {
        reject(new Error('Facebook SDK failed to load'));
        return;
      }
      window.FB.init({ appId, cookie: true, xfbml: false, version });
      resolve();
    };
    if (window.FB) {
      init();
      return;
    }
    window.fbAsyncInit = init;
    if (document.getElementById('facebook-jssdk')) {
      return;
    }
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.onerror = () => reject(new Error('Could not load Facebook SDK'));
    document.body.appendChild(script);
  });
}

export function ConnectWhatsAppWithMetaButton({
  mode,
  clinicUuid,
  onConnected,
  disabled,
}: {
  mode: 'clinic' | 'doctor';
  clinicUuid?: string;
  onConnected: (settings: WhatsAppSettingsResponse) => void;
  disabled?: boolean;
}) {
  const [config, setConfig] = useState<WhatsAppEmbeddedSignupConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const sessionRef = useRef<SessionData>({});

  useEffect(() => {
    let cancelled = false;
    void fetchWhatsAppEmbeddedSignupConfig()
      .then(async (cfg) => {
        if (cancelled) return;
        setConfig(cfg);
        if (cfg.enabled && cfg.appId && cfg.configId) {
          await loadFacebookSdk(cfg.appId, cfg.apiVersion || 'v26.0');
          if (!cancelled) setSdkReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) setConfig({ enabled: false, appId: '', configId: '', apiVersion: 'v21.0' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      try {
        const origin = new URL(event.origin).hostname;
        if (origin !== 'facebook.com' && !origin.endsWith('.facebook.com')) return;
      } catch {
        return;
      }
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type !== 'WA_EMBEDDED_SIGNUP') return;
        sessionRef.current.event = typeof data.event === 'string' ? data.event : undefined;
        const payload = data.data || {};
        if (payload?.waba_id) sessionRef.current.wabaId = String(payload.waba_id);
        if (!sessionRef.current.wabaId && Array.isArray(payload?.waba_ids) && payload.waba_ids.length === 1) {
          sessionRef.current.wabaId = String(payload.waba_ids[0]);
        }
        if (payload?.phone_number_id) sessionRef.current.phoneNumberId = String(payload.phone_number_id);
      } catch {
        // ignore non-JSON messages
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const startSignup = useCallback(() => {
    if (!config?.enabled || !config.configId || !window.FB || !sdkReady) {
      toast.error('Connect with Meta is not configured yet. Use Advanced setup or ask KittyP support.');
      return;
    }
    if (mode === 'clinic' && !clinicUuid) {
      toast.error('Select a clinic first');
      return;
    }
    setLoading(true);
    sessionRef.current = {};
    window.FB.login(
      (response) => {
        void (async () => {
          try {
            const code = response.authResponse?.code;
            if (!code) {
              const status = response.status || 'unknown';
              toast.error(
                status === 'unknown'
                  ? 'Facebook blocked login (often “not using a secure connection”). Use HTTPS (kittyp.in), not http. KittyP did not save a connection.'
                  : 'WhatsApp signup was cancelled or Facebook did not return a code. KittyP did not save a connection.'
              );
              return;
            }
            const signupEvent = sessionRef.current.event;
            if (signupEvent && !signupEvent.startsWith('FINISH')) {
              toast.error(
                signupEvent === 'CANCEL'
                  ? 'WhatsApp signup was cancelled. KittyP did not save a connection.'
                  : 'Meta could not complete WhatsApp signup. KittyP did not save a connection.'
              );
              return;
            }
            const body = {
              code,
              wabaId: sessionRef.current.wabaId,
              phoneNumberId: sessionRef.current.phoneNumberId,
            };
            const settings =
              mode === 'clinic'
                ? await connectClinicWhatsAppEmbedded(clinicUuid!, body)
                : await connectDoctorWhatsAppEmbedded(body);
            toast.success('WhatsApp connected');
            onConnected(settings);
          } catch (e: unknown) {
            const msg =
              e && typeof e === 'object' && 'response' in e
                ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message || '')
                : '';
            toast.error(msg || 'Could not finish WhatsApp connection');
          } finally {
            setLoading(false);
          }
        })();
      },
      {
        config_id: config.configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
        },
      }
    );
  }, [clinicUuid, config, mode, onConnected, sdkReady]);

  const available = !!config?.enabled && sdkReady;

  return (
    <Button type="button" size="lg" disabled={disabled || loading || !available} onClick={startSignup}>
      {loading ? 'Connecting…' : 'Connect WhatsApp with Meta'}
    </Button>
  );
}
