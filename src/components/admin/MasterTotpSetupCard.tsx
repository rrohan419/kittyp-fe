import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CopyableId } from '@/components/ui/CopyableId';
import { QrCodeImage } from '@/components/admin/QrCodeImage';
import { fetchMasterTotpEnrollment, type MasterTotpEnrollment } from '@/services/adminService';
import {
  isMasterTotpSetupDone,
  markMasterTotpSetupDone,
  setupKeyFromOtpauth,
} from '@/utils/otpauth';
import { parseApiErrorMessage } from '@/utils/validation';

export function MasterTotpSetupCard() {
  const [enrollment, setEnrollment] = useState<MasterTotpEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchMasterTotpEnrollment();
      setEnrollment(next);
      const key = setupKeyFromOtpauth(next.otpauthUri);
      setShowQr(!isMasterTotpSetupDone(key));
    } catch (err) {
      setEnrollment(null);
      setError(parseApiErrorMessage(err, 'Could not load authenticator setup.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const uri = enrollment?.otpauthUri ?? null;
  const setupKey = setupKeyFromOtpauth(uri);

  const markDone = () => {
    if (setupKey) markMasterTotpSetupDone(setupKey);
    setShowQr(false);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          Master authenticator
        </CardTitle>
        <CardDescription>
          Scan once on the admin phone. That 6-digit code is the SMS OTP fallback when SMS Gate
          fails.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading setup…
          </div>
        ) : null}

        {error ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        ) : null}

        {!loading && !error && enrollment && !enrollment.enabled ? (
          <p className="text-sm text-muted-foreground">
            Not configured. Set <span className="font-mono">KITTYP_MASTER_TOTP_SECRET</span> on
            the server, restart, then reload this page to scan the QR.
          </p>
        ) : null}

        {!loading && !error && enrollment?.enabled && uri && !showQr ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              Setup Auth success
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowQr(true)}>
              Show QR
            </Button>
          </div>
        ) : null}

        {!loading && !error && enrollment?.enabled && uri && showQr ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Anyone with this code can pass phone OTP checks. Keep the authenticator private. Do
              not screenshot or share the QR.
            </p>
            <QrCodeImage value={uri} label="Master authenticator QR" />
            <p className="text-sm">
              <span className="text-muted-foreground">Account:</span> {enrollment.issuer}:
              {enrollment.account}
              <span className="text-muted-foreground"> · </span>
              {enrollment.periodSeconds}s · {enrollment.digits} digits
            </p>
            {setupKey ? (
              <CopyableId
                label="Setup key"
                value={setupKey}
                hint="Paste this in Google Authenticator or Authy if you cannot scan."
              />
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(uri);
                toast.success('Copied setup URI');
              }}
            >
              Copy setup URI
            </Button>
            <div className="rounded-lg border border-border p-3 space-y-2">
              <p className="text-sm font-medium">Finished scanning this QR?</p>
              <Button type="button" size="sm" onClick={markDone}>
                Done
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
