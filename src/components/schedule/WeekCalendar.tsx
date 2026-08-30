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
import { calendarBlockClass, isUrgentVisit } from '@/utils/visitUrgency';
import {
  doctorCalendarBlockClass,
  doctorCalendarSwatchClass,
  doctorDisplayName,
  doctorUrgentStripeClass,
} from './doctorCalendarColor';
import { NowGutterMark, NowIndicator, useTickingNow } from './NowIndicator';
import {
  HOUR_PX,
  WeekCalEvent,
  eventLayout,
  nowLineOffsetPx,
  slotStartFromHourClick,
  visibleHourRange,
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
  /** Click an empty hour cell (snaps to :00 or :30) to book that slot. */
  onSlotClick?: (start: Date) => void;
  emptyLabel?: string;
  /** Shown as color legend above the grid when provided. */
  doctors?: WeekCalendarDoctor[];
};

function eventToneLabel(
  ev: WeekCalEvent,
  urgent: boolean,
  colorByDoctor: boolean,
  doctors?: WeekCalendarDoctor[]
): string {
  if (!colorByDoctor) return urgent ? `Urgent visit: ${ev.title}` : `Routine visit: ${ev.title}`;
  const name = doctorDisplayName(ev, doctors);
  const doctorBit = name ? `Dr. ${name}` : 'Unassigned';
  const urgency = urgent ? 'Urgent visit' : 'Routine visit';
  return `${urgency}: ${ev.title} · ${doctorBit}`;
}

export function WeekCalendar({
  events,
  weekAnchor,
  onWeekAnchorChange,
  loading,
  onEventClick,
  onSlotClick,
  emptyLabel = 'No appointments this week.',
  doctors,
}: Props) {
  const now = useTickingNow();
  const weekStart = startOfWeek(weekAnchor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekAnchor, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const today = startOfDay(now);
  const todayInWeek = weekDays.some((d) => isSameDay(d, today));
  const hourRange = visibleHourRange(events, todayInWeek ? now : undefined);
  const nowTop = todayInWeek ? nowLineOffsetPx(now, hourRange) : null;
  const nextTodayStart =
    events
      .filter((e) => isSameDay(e.start, today) && e.start.getTime() > now.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0]?.start ?? null;
  const hours = Array.from(
    { length: hourRange.endHour - hourRange.startHour },
    (_, i) => hourRange.startHour + i
  );
  const todayEvents = events
    .filter((e) => isSameDay(e.start, today))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const doctorList = doctors ?? [];
  const colorByDoctor = doctorList.length > 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
        {colorByDoctor ? (
          <>
            {doctorList.map((d) => (
              <span
                key={d.doctorUuid}
                className="inline-flex items-center gap-1.5 text-xs text-foreground"
              >
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-sm shrink-0 border',
                    doctorCalendarSwatchClass(d.doctorUuid)
                  )}
                />
                {d.name}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-sm shrink-0 border border-border bg-muted',
                  doctorUrgentStripeClass
                )}
              />
              Urgent
            </span>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
              <span className={cn('h-2.5 w-2.5 rounded-sm shrink-0 border', calendarBlockClass(false))} />
              Routine
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
              <span className={cn('h-2.5 w-2.5 rounded-sm shrink-0 border', calendarBlockClass(true))} />
              Urgent
            </span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Mon–Sun · {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
          {onSlotClick ? ' · Click an empty time to book' : ''}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            title="Previous week"
            aria-label="Previous week"
            onClick={() => onWeekAnchorChange(addDays(weekAnchor, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={isSameDay(weekAnchor, today) ? 'secondary' : 'outline'}
            size="sm"
            className="h-8"
            title="Jump to this week"
            onClick={() => onWeekAnchorChange(startOfDay(new Date()))}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            title="Next week"
            aria-label="Next week"
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
      ) : (
        <div className="overflow-x-auto">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center pb-3">{emptyLabel}</p>
          ) : null}
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
              <div className="relative border-r border-border bg-muted/20">
                {hours.map((h) => (
                  <div
                    key={h}
                    className="border-b border-border/60 text-[10px] text-muted-foreground pr-1 text-right pt-0.5"
                    style={{ height: HOUR_PX }}
                  >
                    {format(setHours(today, h), 'h a')}
                  </div>
                ))}
                {nowTop != null ? <NowGutterMark top={nowTop} now={now} /> : null}
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
                    {hours.map((h) =>
                      onSlotClick ? (
                        <button
                          key={h}
                          type="button"
                          className="absolute left-0 right-0 border-b border-border/50 hover:bg-primary/10 focus-visible:bg-primary/15 focus-visible:outline-none"
                          style={{ top: (h - hourRange.startHour) * HOUR_PX, height: HOUR_PX }}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            onSlotClick(slotStartFromHourClick(d, h, e.clientY - rect.top));
                          }}
                          aria-label={`Book ${format(d, 'EEE MMM d')} at ${format(setHours(d, h), 'h a')}`}
                        />
                      ) : (
                        <div
                          key={h}
                          className="absolute left-0 right-0 border-b border-border/50"
                          style={{ top: (h - hourRange.startHour) * HOUR_PX, height: HOUR_PX }}
                        />
                      )
                    )}
                    {nowTop != null && isSameDay(d, today) ? (
                      <NowIndicator top={nowTop} now={now} nextStartsAt={nextTodayStart} />
                    ) : null}
                    {dayEvs.map((ev) => {
                      const layout = eventLayout(ev, d, hourRange);
                      if (!layout) return null;
                      const urgent = isUrgentVisit(ev.visit?.urgency);
                      const tone = eventToneLabel(ev, urgent, colorByDoctor, doctors);
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(ev);
                          }}
                          className={cn(
                            'absolute box-border rounded border px-1 py-0.5 text-[10px] leading-tight shadow-sm overflow-hidden text-left hover:brightness-110',
                            colorByDoctor
                              ? cn(
                                  doctorCalendarBlockClass(ev.doctorUuid),
                                  urgent && doctorUrgentStripeClass
                                )
                              : calendarBlockClass(urgent)
                          )}
                          style={{
                            top: layout.top,
                            height: layout.height,
                            left: `calc(${layout.leftPct}% + 2px)`,
                            width: `calc(${layout.widthPct}% - 4px)`,
                            zIndex: 10 + ev.lane,
                          }}
                          title={`${tone} · ${format(ev.start, 'p')}`}
                          aria-label={tone}
                        >
                          <p className="font-semibold truncate">
                            {urgent ? `Urgent · ${ev.title}` : ev.title}
                          </p>
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
                const urgent = isUrgentVisit(ev.visit?.urgency);
                const tone = eventToneLabel(ev, urgent, colorByDoctor, doctors);
                return (
                  <Badge
                    key={`today-${ev.id}`}
                    variant="outline"
                    className={cn(
                      'cursor-pointer text-[11px] border font-normal',
                      colorByDoctor
                        ? cn(
                            doctorCalendarBlockClass(ev.doctorUuid),
                            urgent && doctorUrgentStripeClass
                          )
                        : calendarBlockClass(urgent)
                    )}
                    onClick={() => onEventClick?.(ev)}
                    aria-label={tone}
                  >
                    {urgent ? 'Urgent · ' : 'Routine · '}
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
