import * as React from 'react';
import { format, startOfDay } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar, type CalendarProps } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatIsoDate, parseIsoDate, toDateBound } from '@/utils/isoDate';

export type DatePickerProps = {
  /** `yyyy-MM-dd`, or empty when unset. */
  value?: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: string | Date;
  max?: string | Date;
  disablePast?: boolean;
  disableFuture?: boolean;
  className?: string;
  captionLayout?: CalendarProps['captionLayout'];
  calendarProps?: Omit<
    CalendarProps,
    'mode' | 'selected' | 'onSelect' | 'disabled' | 'month' | 'onMonthChange' | 'startMonth' | 'endMonth'
  >;
};

export function DatePicker({
  value,
  onChange,
  id,
  placeholder = 'Pick a date',
  disabled,
  min,
  max,
  disablePast,
  disableFuture,
  className,
  captionLayout = 'dropdown',
  calendarProps,
}: DatePickerProps) {
  const selected = parseIsoDate(value);
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(selected ?? startOfDay(new Date()));

  React.useEffect(() => {
    if (selected) setMonth(selected);
  }, [value]);

  const today = startOfDay(new Date());
  const minBound = latestDate(disablePast ? today : undefined, toDateBound(min));
  const maxBound = earliestDate(disableFuture ? today : undefined, toDateBound(max));
  const startMonth = minBound ?? new Date(today.getFullYear() - 40, 0, 1);
  const endMonth = maxBound ?? new Date(today.getFullYear() + 2, 11, 31);

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !selected && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, 'PPP') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[200] w-auto p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => {
          const target = event.target as HTMLElement | null;
          if (target?.closest("[data-radix-select-content]")) {
            event.preventDefault();
          }
        }}
        onFocusOutside={(event) => {
          const target = event.target as HTMLElement | null;
          if (target?.closest("[data-radix-select-content]")) {
            event.preventDefault();
          }
        }}
      >
        <Calendar
          {...calendarProps}
          mode="single"
          selected={selected}
          month={month}
          onMonthChange={setMonth}
          captionLayout={captionLayout}
          hideNavigation={captionLayout !== 'label'}
          startMonth={startMonth}
          endMonth={endMonth}
          onSelect={(date) => {
            onChange(date ? formatIsoDate(date) : '');
            if (date) setOpen(false);
          }}
          disabled={(date) => {
            const day = startOfDay(date);
            if (minBound && day < minBound) return true;
            if (maxBound && day > maxBound) return true;
            return false;
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function latestDate(...dates: (Date | undefined)[]): Date | undefined {
  const valid = dates.filter((d): d is Date => Boolean(d));
  if (!valid.length) return undefined;
  return new Date(Math.max(...valid.map((d) => d.getTime())));
}

function earliestDate(...dates: (Date | undefined)[]): Date | undefined {
  const valid = dates.filter((d): d is Date => Boolean(d));
  if (!valid.length) return undefined;
  return new Date(Math.min(...valid.map((d) => d.getTime())));
}
