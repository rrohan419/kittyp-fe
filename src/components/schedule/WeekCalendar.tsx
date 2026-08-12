import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  setHours,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DAY_START_HOUR,
  DAY_END_HOUR,
  HOUR_PX,
  WeekCalEvent,
  doctorColor,
  eventLayout,
  statusTone,
  withLanes,
} from './weekCalendarUtils';

export type WeekCalendarDoctor = {
  doctorUuid: string;
  name: string;
};

type Props = {
  events: WeekCalEvent[];
  weekAnchor: Date;
  onWeekAnchorChange: (d: Date) => void;
  loading?: boolean;
  onEventClick?: (ev: WeekCalEvent) => void;
  emptyLabel?: string;
  /** Shown as color legend above the grid when provided. */
  doctors?: WeekCalendarDoctor[];
};

export function WeekCalendar({
  events,
  weekAnchor,
  onWeekAnchorChange,
  loading,
  onEventClick,
  emptyLabel = 'No appointments this week.',
  doctors,
}: Props) {
  const weekStart = startOfWeek(weekAnchor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekAnchor, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const today = startOfDay(new Date());
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);
  const todayEvents = events
    .filter((e) => isSameDay(e.start, today))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const legendDoctors = (doctors || []).filter((d) => d.doctorUuid && d.name);

  return (
    <div>
      {legendDoctors.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3">
          <span className="text-xs text-muted-foreground mr-1">Doctors</span>
          {legendDoctors.map((d) => {
            const color = doctorColor(d.doctorUuid);
            return (
              <span
                key={d.doctorUuid}
                className="inline-flex items-center gap-1.5 text-xs text-foreground"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0 border"
                  style={{
                    backgroundColor: color?.bg,
                    borderColor: color?.border,
                  }}
                />
                {d.name.replace(/^Dr\.?\s*/i, '')}
              </span>
            );
          })}
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full shrink-0 border border-border bg-muted" />
            Unassigned
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Mon–Sun · {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onWeekAnchorChange(addDays(weekAnchor, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => onWeekAnchorChange(startOfDay(new Date()))}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onWeekAnchorChange(addDays(weekAnchor, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[720px] border border-border rounded-xl overflow-hidden">
            <div
              className="grid border-b border-border bg-muted/40"
              style={{ gridTemplateColumns: `56px repeat(7, minmax(0, 1fr))` }}
            >
              <div className="border-r border-border" />
              {weekDays.map((d) => (
                <div
                  key={d.toISOString()}
                  className={cn(
                    'px-1 py-2 text-center border-r border-border last:border-r-0',
                    isSameDay(d, today) && 'bg-primary/10'
                  )}
                >
                  <p className="text-[10px] uppercase text-muted-foreground">{format(d, 'EEE')}</p>
                  <p className={cn('text-sm font-semibold', isSameDay(d, today) && 'text-primary')}>
                    {format(d, 'd')}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid" style={{ gridTemplateColumns: `56px repeat(7, minmax(0, 1fr))` }}>
              <div className="border-r border-border bg-muted/20">
                {hours.map((h) => (
                  <div
                    key={h}
                    className="border-b border-border/60 text-[10px] text-muted-foreground pr-1 text-right pt-0.5"
                    style={{ height: HOUR_PX }}
                  >
                    {format(setHours(today, h), 'h a')}
                  </div>
                ))}
              </div>
              {weekDays.map((d) => {
                const dayEvs = withLanes(events.filter((e) => isSameDay(e.start, d)));
                return (
                  <div
                    key={d.toISOString()}
                    className={cn(
                      'relative border-r border-border last:border-r-0',
                      isSameDay(d, today) && 'bg-primary/[0.03]'
                    )}
                    style={{ height: hours.length * HOUR_PX }}
                  >
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-b border-border/50"
                        style={{ top: (h - DAY_START_HOUR) * HOUR_PX, height: HOUR_PX }}
                      />
                    ))}
                    {dayEvs.map((ev) => {
                      const layout = eventLayout(ev, d);
                      if (!layout) return null;
                      const color = doctorColor(ev.doctorUuid);
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => onEventClick?.(ev)}
                          className={cn(
                            'absolute rounded border px-1 py-0.5 text-[10px] leading-tight shadow-sm overflow-hidden z-10 text-left hover:brightness-110',
                            !color && statusTone(ev.status)
                          )}
                          style={{
                            top: layout.top,
                            height: layout.height,
                            left: `calc(${layout.leftPct}% + 2px)`,
                            width: `calc(${layout.widthPct}% - 4px)`,
                            ...(color
                              ? {
                                  backgroundColor: color.bg,
                                  borderColor: color.border,
                                  color: color.text,
                                }
                              : {}),
                          }}
                          title={`${ev.title} · ${format(ev.start, 'p')}`}
                        >
                          <p className="font-semibold truncate">{ev.title}</p>
                          <p className="opacity-90 truncate">{format(ev.start, 'h:mm a')}</p>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Today&apos;s appointments</p>
          {todayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments today.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {todayEvents.map((ev) => {
                const color = doctorColor(ev.doctorUuid);
                return (
                  <Badge
                    key={`today-${ev.id}`}
                    variant="outline"
                    className={cn(
                      'cursor-pointer text-[11px] border font-normal',
                      !color && statusTone(ev.status)
                    )}
                    style={
                      color
                        ? {
                            backgroundColor: color.bg,
                            borderColor: color.border,
                            color: color.text,
                          }
                        : undefined
                    }
                    onClick={() => onEventClick?.(ev)}
                  >
                    {ev.title} · {format(ev.start, 'h:mm a')}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
