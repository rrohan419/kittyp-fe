import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { sendPasswordResetCode, verifyPasswordResetCode, resetPassword } from '@/services/authService';
import { otpSendButtonLabel, useOtpResendCooldown } from '@/hooks/useOtpResendCooldown';
import { parseApiErrorMessage } from '@/utils/validation';

/**
 * Logged-in password change using the existing email OTP + /auth/password-reset APIs
 * (no current-password endpoint on BE).
 */
export default function ChangePasswordCard({ email }: { email: string }) {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const resend = useOtpResendCooldown();

  const sendCode = async () => {
    if (!email) {
      toast.error('No account email on file');
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetCode(email);
      setSent(true);
      resend.start();
      toast.success('Verification code sent', {
        description: 'Check your email for the 6-digit code.',
      });
    } catch (e) {
      toast.error(parseApiErrorMessage(e, 'Could not send code'));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error('Enter the 6-digit code from your email');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const okCode = await verifyPasswordResetCode(code.trim(), email);
      if (!okCode) {
        toast.error('Invalid or expired code');
        return;
      }
      const ok = await resetPassword(code.trim(), password, email);
      if (!ok) {
        toast.error('Could not update password');
        return;
      }
      toast.success('Password updated');
      setCode('');
      setPassword('');
      setConfirm('');
      setSent(false);
      resend.reset();
    } catch (e) {
      toast.error(parseApiErrorMessage(e, 'Could not update password'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t pt-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Change password</h3>
        <p className="text-sm text-muted-foreground mt-1">
          We email a verification code to <span className="font-medium text-foreground">{email}</span>, then you set a new password.
        </p>
      </div>
      {!sent ? (
        <Button type="button" variant="outline" disabled={busy || !email} onClick={() => void sendCode()}>
          {busy ? 'Sending…' : 'Email me a code'}
        </Button>
      ) : (
        <div className="space-y-3 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="chg-pw-code">Verification code</Label>
            <Input
              id="chg-pw-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chg-pw-new">New password</Label>
            <Input
              id="chg-pw-new"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              8–72 characters with upper, lower, digit, and special character.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="chg-pw-confirm">Confirm password</Label>
            <Input
              id="chg-pw-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={() => void submit()}>
              {busy ? 'Updating…' : 'Update password'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy || resend.coolingDown}
              onClick={() => void sendCode()}
            >
              {otpSendButtonLabel(busy, resend.remaining, 'Resend code')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
