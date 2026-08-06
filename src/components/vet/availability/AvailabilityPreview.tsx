import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarDays,
  IndianRupee,
} from 'lucide-react';
import { VetAvailability, VetProfile, TimeSlot } from '@/types/scheduling';
import {
  addDays,
  format,
  isSameDay,
  isToday,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { generateTimeSlots } from '@/utils/timezone';
import { cn } from '@/lib/utils';
import { formatInr } from '@/services/availabilityService';

interface AvailabilityPreviewProps {
  availability: VetAvailability[];
  vetProfile?: VetProfile;
}

const TYPE_STYLES: Record<string, string> = {
  general: 'bg-sky-500/15 text-sky-700 border-sky-200',
  emergency: 'bg-rose-500/15 text-rose-700 border-rose-200',
  'follow-up': 'bg-emerald-500/15 text-emerald-700 border-emerald-200',
  specialist: 'bg-violet-500/15 text-violet-700 border-violet-200',
};

export const AvailabilityPreview: React.FC<AvailabilityPreviewProps> = ({
  availability,
  vetProfile,
}) => {
  const [weekAnchor, setWeekAnchor] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i));
  }, [weekAnchor]);

  const getAvailabilityForDate = (date: Date): TimeSlot[] => {
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.filter(
      (slot) => slot.dayOfWeek === dayOfWeek && slot.isActive
    );

    const allSlots: TimeSlot[] = [];

    dayAvailability.forEach((avail) => {
      const tz = avail.timezone || 'Asia/Kolkata';
      const slots = generateTimeSlots(
        avail.startTime,
        avail.endTime,
        avail.slotDuration,
        date,
        tz
      );

      slots.forEach((slotStart, index) => {
        const slotEnd = new Date(slotStart.getTime() + avail.slotDuration * 60000);
        allSlots.push({
          id: `preview-${avail.id}-${format(date, 'yyyy-MM-dd')}-${index}`,
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          isBooked: false,
          vetId: avail.vetId,
          timezone: tz,
          price: avail.price,
          consultationType: avail.consultationType,
        });
      });
    });

    return allSlots.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  };

  const slotsByDay = useMemo(() => {
    const map = new Map<string, TimeSlot[]>();
    weekDays.forEach((day) => {
      map.set(format(day, 'yyyy-MM-dd'), getAvailabilityForDate(day));
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDays, availability]);

  const selectedKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedSlots = slotsByDay.get(selectedKey) ?? [];

  const weekStats = useMemo(() => {
    let totalSlots = 0;
    let totalRevenue = 0;
    let activeDays = 0;
    slotsByDay.forEach((slots) => {
      if (slots.length > 0) activeDays += 1;
      totalSlots += slots.length;
      totalRevenue += slots.reduce((sum, s) => sum + s.price, 0);
    });
    return { totalSlots, totalRevenue, activeDays };
  }, [slotsByDay]);

  const formatSlotRange = (slot: TimeSlot) => {
    const tz = slot.timezone || 'Asia/Kolkata';
    const start = formatInTimeZone(new Date(slot.startTime), tz, 'h:mm a');
    const end = formatInTimeZone(new Date(slot.endTime), tz, 'h:mm a');
    return `${start} – ${end}`;
  };

  const goPrevWeek = () => {
    const next = addDays(weekAnchor, -7);
    setWeekAnchor(next);
    if (
      selectedDate < next ||
      selectedDate >= addDays(next, 7)
    ) {
      setSelectedDate(next);
    }
  };

  const goNextWeek = () => {
    const next = addDays(weekAnchor, 7);
    setWeekAnchor(next);
    if (
      selectedDate < next ||
      selectedDate >= addDays(next, 7)
    ) {
      setSelectedDate(next);
    }
  };

  const goThisWeek = () => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    setWeekAnchor(start);
    setSelectedDate(startOfDay(new Date()));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Patient preview</h3>
          <p className="text-sm text-muted-foreground">
            {vetProfile?.fullName
              ? `How slots look for patients booking ${vetProfile.fullName}`
              : 'Tap a day to see open consultation slots'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goThisWeek}>
            This week
          </Button>
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={goPrevWeek}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium min-w-[9.5rem] text-center tabular-nums">
              {format(weekAnchor, 'd MMM')} – {format(addDays(weekAnchor, 6), 'd MMM')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={goNextWeek}
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Week day picker */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const slots = slotsByDay.get(key) ?? [];
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const hasSlots = slots.length > 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(startOfDay(day))}
              className={cn(
                'relative flex flex-col items-center gap-1 rounded-xl px-1 py-3 sm:py-3.5 transition-colors border text-center',
                selected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : hasSlots
                    ? 'bg-card border-border hover:border-primary/40 hover:bg-muted/40'
                    : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50'
              )}
            >
              <span
                className={cn(
                  'text-[10px] sm:text-xs font-medium uppercase tracking-wide',
                  selected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                )}
              >
                {format(day, 'EEE')}
              </span>
              <span className="text-base sm:text-lg font-semibold tabular-nums leading-none">
                {format(day, 'd')}
              </span>
              <span
                className={cn(
                  'text-[10px] tabular-nums',
                  selected ? 'text-primary-foreground/75' : 'text-muted-foreground'
                )}
              >
                {hasSlots ? `${slots.length} slots` : 'Off'}
              </span>
              {today && !selected && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day slots */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-muted/20">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarDays className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">
                {format(selectedDate, 'EEEE, d MMMM yyyy')}
                {isToday(selectedDate) && (
                  <Badge variant="secondary" className="ml-2 text-[10px] align-middle">
                    Today
                  </Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedSlots.length > 0
                  ? `${selectedSlots.length} open slot${selectedSlots.length === 1 ? '' : 's'}`
                  : 'No consultations scheduled this day'}
              </p>
            </div>
          </div>
          {selectedSlots.length > 0 && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <IndianRupee className="h-3.5 w-3.5" />
              From {formatInr(Math.min(...selectedSlots.map((s) => s.price)))}
            </p>
          )}
        </div>

        <CardContent className="p-5">
          {selectedSlots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {selectedSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3.5 py-3 hover:border-primary/35 transition-colors"
                >
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {formatSlotRange(slot)}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        'capitalize text-[10px] font-medium border',
                        TYPE_STYLES[slot.consultationType] ||
                          'bg-muted text-muted-foreground'
                      )}
                    >
                      {slot.consultationType.replace('-', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm font-bold text-primary shrink-0 tabular-nums">
                    {formatInr(slot.price)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">Day off</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                No active hours for this weekday. Add them under Weekly Schedule, then save.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compact week summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
          <p className="text-xl font-bold text-foreground tabular-nums">{weekStats.totalSlots}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Slots this week</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
          <p className="text-xl font-bold text-foreground tabular-nums">{weekStats.activeDays}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Active days</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
          <p className="text-xl font-bold text-foreground tabular-nums">
            {formatInr(weekStats.totalRevenue)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Potential INR</p>
        </div>
      </div>
    </div>
  );
};
