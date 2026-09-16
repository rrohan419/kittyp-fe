import { useCallback, useEffect, useState } from 'react';

export const OTP_RESEND_SECONDS = 30;

export function useOtpResendCooldown(seconds = OTP_RESEND_SECONDS) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) {
      return undefined;
    }
    const id = window.setTimeout(() => setRemaining((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [remaining]);

  const start = useCallback(() => setRemaining(seconds), [seconds]);
  const reset = useCallback(() => setRemaining(0), []);

  return {
    remaining,
    coolingDown: remaining > 0,
    start,
    reset,
  };
}

export function otpSendButtonLabel(busy: boolean, remaining: number, idle: string): string {
  if (busy) {
    return 'Sending…';
  }
  if (remaining > 0) {
    return `Resend in ${remaining}s`;
  }
  return idle;
}
