import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  dashboardVisitSurfaceClass,
  routineVisitBadgeClass,
  urgentVisitBadgeClass,
} from '@/utils/visitUrgency';
import { visitStatusLabel } from '@/utils/visitStatus';

type Props = {
  time: string;
  title: string;
  subtitle?: string;
  urgent?: boolean;
  status?: string;
  onClick?: () => void;
  action?: ReactNode;
};

/** Aligned dashboard row: time · name · Urgent/Routine. Color is not the only signal. */
export function DashboardAppointmentRow({
  time,
  title,
  subtitle,
  urgent = false,
  status,
  onClick,
  action,
}: Props) {
  const label = `${urgent ? 'Urgent' : 'Routine'} visit: ${title}`;
  const state = (status || '').toUpperCase();
  const isCancelled = state === 'CANCELLED';
  const isNoShow = state === 'NO_SHOW';
  const closedSurface = isCancelled
    ? 'border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-900/60'
    : isNoShow
      ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40'
      : null;
  const closedBadge = isCancelled
    ? 'border-slate-400 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
    : 'border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200';
  const body = (
    <>
      <span
        className={cn(
          'w-[4.75rem] shrink-0 text-sm font-semibold tabular-nums',
          closedSurface
            ? 'text-muted-foreground'
            : urgent
              ? 'text-rose-700 dark:text-rose-300'
              : 'text-sky-700 dark:text-sky-300'
        )}
      >
        {time}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate font-medium text-sm text-foreground',
            isCancelled && 'line-through text-muted-foreground'
          )}
        >
          {title}
        </span>
        {subtitle ? (
          <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
        ) : null}
      </span>
      <span className="flex items-center justify-end gap-1.5 shrink-0">
        {closedSurface ? null : (
          <Badge className={urgent ? urgentVisitBadgeClass : routineVisitBadgeClass}>
            {urgent ? 'Urgent' : 'Routine'}
          </Badge>
        )}
        {status ? (
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] font-normal',
              closedSurface ? closedBadge : 'hidden sm:inline-flex'
            )}
          >
            {visitStatusLabel(status)}
          </Badge>
        ) : null}
      </span>
    </>
  );

  return (
    <div
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5',
        closedSurface ?? dashboardVisitSurfaceClass(urgent)
      )}
    >
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {body}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3" aria-label={label}>
          {body}
        </div>
      )}
      {action}
    </div>
  );
}
