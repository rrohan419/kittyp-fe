import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { META_APP_ID, META_CONFIG_ID } from '@/config/env';
import {
  facebookLoginEditSettingsHint,
  isEmbeddedSignupFinish,
  isFacebookMessageOrigin,
  parseEmbeddedSignupMessage,
  pickEmbeddedSignupId,
} from '@/utils/whatsappEmbeddedSignup';

export type WhatsAppEmbeddedSignupPayload = {
  code: string;
  wabaId: string;
  phoneNumberId: string;
};

type FbLoginResponse = {
  authResponse?: { code?: string };
  status?: string;
};

type EmbeddedSignupIds = {
  wabaId: string;
  phoneNumberId: string;
};

declare global {
  interface Window {
    FB?: {
      init: (opts: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
        fedCM: false;
      }) => void;
      login: (
        cb: (res: FbLoginResponse) => void,
        opts: {
          config_id: string;
          response_type: string;
          override_default_response_type: boolean;
          extras: { setup: Record<string, never>; sessionInfoVersion: string };
        }
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

const SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js';
const SDK_ID = 'facebook-jssdk';
const IDS_WAIT_MS = 8000;

function loadFacebookSdk(appId: string): void {
  const init = () => {
    window.FB?.init({
      appId,
      cookie: true,
      xfbml: true,
      version: 'v21.0',
      // Login for Business / Embedded Signup is not supported by FedCM yet.
      // Chrome otherwise shows "localhost can't continue using facebook.com".
      fedCM: false,
    });
  };

  if (window.FB) {
    init();
    return;
  }

  const existing = document.getElementById(SDK_ID);
  if (existing) {
    window.fbAsyncInit = init;
    return;
  }

  window.fbAsyncInit = init;
  const script = document.createElement('script');
  script.id = SDK_ID;
  script.async = true;
  script.src = SDK_SRC;
  document.body.appendChild(script);
}

export function WhatsAppEmbeddedSignupButton({
  onSuccess,
}: {
  onSuccess: (data: WhatsAppEmbeddedSignupPayload) => Promise<void>;
}) {
  const codeRef = useRef<string | null>(null);
  const idsRef = useRef<EmbeddedSignupIds | null>(null);
  const submittingRef = useRef(false);
  const waitTimerRef = useRef<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  const clearWait = () => {
    if (waitTimerRef.current != null) {
      window.clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  };

  const trySubmit = useCallback(async () => {
    const code = codeRef.current;
    const ids = idsRef.current;
    if (!code || !ids || submittingRef.current) {
      return;
    }
    clearWait();
    submittingRef.current = true;
    setBusy(true);
    try {
      await onSuccess({
        code,
        wabaId: ids.wabaId,
        phoneNumberId: ids.phoneNumberId,
      });
      codeRef.current = null;
      idsRef.current = null;
      toast.success('WhatsApp connected');
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string; detailedMessage?: string } }; message?: string };
      toast.error(
        ax.response?.data?.detailedMessage ||
          ax.response?.data?.message ||
          ax.message ||
          'WhatsApp Embedded Signup failed'
      );
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }, [onSuccess]);

  useEffect(() => {
    if (!META_APP_ID || !META_CONFIG_ID) {
      return;
    }
    loadFacebookSdk(META_APP_ID);
    const readyCheck = window.setInterval(() => {
      if (window.FB) {
        setSdkReady(true);
        window.clearInterval(readyCheck);
      }
    }, 200);

    const onMessage = (event: MessageEvent) => {
      if (!isFacebookMessageOrigin(event.origin)) {
        return;
      }
      const payload = parseEmbeddedSignupMessage(event.data);
      if (!payload || payload.type !== 'WA_EMBEDDED_SIGNUP') {
        return;
      }
      if (payload.event === 'CANCEL') {
        clearWait();
        toast.error('WhatsApp signup cancelled');
        return;
      }
      if (payload.event === 'ERROR') {
        clearWait();
        toast.error('WhatsApp signup failed');
        return;
      }
      if (!isEmbeddedSignupFinish(payload.event)) {
        return;
      }
      const wabaId = pickEmbeddedSignupId(payload, 'waba_id');
      const phoneNumberId = pickEmbeddedSignupId(payload, 'phone_number_id');
      if (!wabaId || !phoneNumberId) {
        clearWait();
        toast.error(
          wabaId
            ? 'Meta returned a WhatsApp account but no phone number. Choose Edit Settings and add a number.'
            : 'Meta did not return WhatsApp IDs. Choose Edit Settings and finish WhatsApp setup.'
        );
        return;
      }
      idsRef.current = { wabaId, phoneNumberId };
      void trySubmit();
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.clearInterval(readyCheck);
      window.removeEventListener('message', onMessage);
      if (waitTimerRef.current != null) {
        window.clearTimeout(waitTimerRef.current);
      }
    };
  }, [trySubmit]);

  const envReady = Boolean(META_APP_ID && META_CONFIG_ID);
  const httpsReady = typeof window !== 'undefined' && window.location.protocol === 'https:';

  const connect = () => {
    if (!httpsReady) {
      toast.error('Open https://localhost:8080 to connect WhatsApp');
      return;
    }
    if (!envReady) {
      toast.error('WhatsApp connect is not configured');
      return;
    }
    if (!window.FB) {
      toast.error('Facebook SDK is still loading');
      return;
    }
    codeRef.current = null;
    idsRef.current = null;
    clearWait();
    window.FB.login(
      (response) => {
        const code = response.authResponse?.code?.trim();
        if (!code) {
          toast.error(facebookLoginEditSettingsHint());
          return;
        }
        codeRef.current = code;
        void trySubmit();
        waitTimerRef.current = window.setTimeout(() => {
          if (submittingRef.current || idsRef.current) {
            return;
          }
          toast.error(facebookLoginEditSettingsHint());
        }, IDS_WAIT_MS);
      },
      {
        config_id: META_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: { setup: {}, sessionInfoVersion: '3' },
      }
    );
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="w-full sm:w-auto bg-[#1877F2] hover:bg-[#166fe5] text-white"
        disabled={busy || !envReady || !httpsReady || !sdkReady}
        onClick={connect}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? 'Connecting…' : 'Connect with Meta'}
      </Button>
      <p className="text-xs text-muted-foreground">
        {!httpsReady
          ? 'Open https://localhost:8080 to connect WhatsApp (Facebook requires HTTPS).'
          : envReady
            ? 'If Facebook says KittyP is already linked, choose Edit Settings (not Continue) and finish WhatsApp setup.'
            : 'WhatsApp connect is not configured'}
      </p>
    </div>
  );
}
