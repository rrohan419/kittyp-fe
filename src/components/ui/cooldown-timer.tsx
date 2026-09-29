import { Timer } from 'lucide-react';

type CooldownTimerProps = {
  seconds: number;
  label?: string;
};

export function CooldownTimer({ seconds, label = 'Retry in' }: CooldownTimerProps) {
  if (seconds <= 0) return null;

  return (
    <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
      <Timer className="h-4 w-4" aria-hidden="true" />
      {label} {seconds}s
    </span>
  );
}
