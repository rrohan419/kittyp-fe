import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export function useTickingNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function remainingUntil(now: Date, next: Date): string | null {
  const mins = Math.round((next.getTime() - now.getTime()) / 60_000);
  if (mins <= 0) return null;
  if (mins < 60) return `${mins}m left`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m left` : `${h}h left`;
}

type Props = {
  top: number;
  now: Date;
  nextStartsAt?: Date | null;
};

/** Current time in the hour gutter, aligned with the now line. */
export function NowGutterMark({ top, now }: { top: number; now: Date }) {
  return (
    <div
      className="absolute right-0.5 z-20 pointer-events-none -translate-y-1/2"
      style={{ top }}
    >
      <span className="rounded bg-background px-0.5 text-[10px] font-semibold leading-none text-rose-500">
        {format(now, 'h:mm')}
      </span>
    </div>
  );
}

/** Current-time needle on today's calendar column. */
export function NowIndicator({ top, now, nextStartsAt }: Props) {
  const label = format(now, 'h:mm a');
  const remain = nextStartsAt ? remainingUntil(now, nextStartsAt) : null;
  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top }}
      role="img"
      aria-label={remain ? `Current time ${label}, ${remain} until next appointment` : `Current time ${label}`}
    >
      <div className="relative flex items-center h-0">
        <span className="absolute -left-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-background shadow-sm" />
        <div className="h-[2px] w-full bg-rose-500 shadow-[0_0_0_1px_hsl(var(--background)/0.4)]" />
        {remain ? (
          <span className="absolute -top-2.5 right-0.5 rounded bg-rose-500 px-1 py-px text-[9px] font-semibold leading-4 text-white whitespace-nowrap">
            {remain}
          </span>
        ) : null}
      </div>
    </div>
  );
}
