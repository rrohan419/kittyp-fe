import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Calendar, Save, AlertCircle, ChevronDown } from 'lucide-react';
import { VetAvailability, VetProfile } from '@/types/scheduling';
import { WeeklyScheduleEditor } from './WeeklyScheduleEditor';
import { PricingSettings } from './PricingSettings';
import { ExceptionDates } from './ExceptionDate';
import { toast } from 'sonner';
import {
  AvailabilityException,
  INR_DEFAULT_PRICES,
  saveMyAvailability,
} from '@/services/availabilityService';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VetAvailabilityManagerProps {
  vetId: string;
  currentAvailability?: VetAvailability[];
  currentExceptions?: AvailabilityException[];
  timezone?: string;
  slotDuration?: number;
  vetProfile?: VetProfile | null;
}

export const VetAvailabilityManager: React.FC<VetAvailabilityManagerProps> = ({
  vetId,
  currentAvailability = [],
  currentExceptions = [],
  timezone = 'Asia/Kolkata',
  slotDuration: initialSlotDuration = 30,
  vetProfile: _vetProfile,
}) => {
  const [availability, setAvailability] = useState<VetAvailability[]>(currentAvailability);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>(currentExceptions);
  const [slotDuration, setSlotDuration] = useState(initialSlotDuration);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    setAvailability(currentAvailability);
    setExceptions(currentExceptions);
    setHasUnsavedChanges(false);
  }, [currentAvailability, currentExceptions]);

  useEffect(() => {
    if (availability.length === 0 && currentAvailability.length === 0) {
      initializeDefaultAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeDefaultAvailability = () => {
    const tz = timezone || 'Asia/Kolkata';
    // Mon–Fri (1–5)
    const defaultAvailability: VetAvailability[] = Array.from({ length: 5 }, (_, i) => ({
      id: `default-${i}`,
      vetId,
      dayOfWeek: i + 1,
      startTime: '09:00',
      endTime: '17:00',
      timezone: tz,
      slotDuration,
      price: INR_DEFAULT_PRICES.general,
      consultationType: 'general',
      isActive: true,
    }));
    setAvailability(defaultAvailability);
    setHasUnsavedChanges(true);
  };

  const handleAvailabilityChange = (newAvailability: VetAvailability[]) => {
    setAvailability(newAvailability);
    setHasUnsavedChanges(true);
  };

  const handleExceptionsChange = (next: AvailabilityException[]) => {
    setExceptions(next);
    setHasUnsavedChanges(true);
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const validateAvailability = (slots: VetAvailability[]): string[] => {
    const errors: string[] = [];
    const groupedByDay = slots.reduce((acc, slot) => {
      if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
      acc[slot.dayOfWeek].push(slot);
      return acc;
    }, {} as Record<number, VetAvailability[]>);

    Object.entries(groupedByDay).forEach(([day, daySlots]) => {
      const sortedSlots = [...daySlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 0; i < sortedSlots.length - 1; i++) {
        if (sortedSlots[i].endTime > sortedSlots[i + 1].startTime) {
          errors.push(`Overlapping time slots on ${getDayName(parseInt(day, 10))}`);
        }
      }
    });
    return errors;
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const validationErrors = validateAvailability(availability);
      if (validationErrors.length > 0) {
        toast.error(validationErrors[0]);
        return;
      }

      const generalPrice =
        availability.find((s) => s.consultationType === 'general' && s.isActive)?.price ??
        availability.find((s) => s.isActive)?.price;

      await saveMyAvailability({
        weeklySchedule: availability.map((slot) => ({
          ...slot,
          vetId,
          timezone: slot.timezone || timezone,
          slotDuration: slot.slotDuration || slotDuration,
        })),
        exceptions,
        timezone,
        slotDurationMinutes: slotDuration,
        bufferMinutes: 0,
        consultationFee: generalPrice,
      });

      toast.success('Availability saved');
      setHasUnsavedChanges(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save availability');
    } finally {
      setIsLoading(false);
    }
  };

  const stats = (() => {
    const activeDays = new Set(availability.filter((a) => a.isActive).map((a) => a.dayOfWeek)).size;
    const totalHours = availability
      .filter((a) => a.isActive)
      .reduce((total, slot) => {
        const start =
          parseInt(slot.startTime.split(':')[0], 10) +
          parseInt(slot.startTime.split(':')[1], 10) / 60;
        const end =
          parseInt(slot.endTime.split(':')[0], 10) + parseInt(slot.endTime.split(':')[1], 10) / 60;
        return total + (end - start);
      }, 0);
    return { activeDays, totalHours: Math.round(totalHours) };
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Availability</h2>
          <p className="text-muted-foreground">Set when you are available (Monday–Sunday).</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {hasUnsavedChanges && (
            <Alert className="w-auto py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Unsaved changes</AlertDescription>
            </Alert>
          )}
          <Button onClick={() => void handleSave()} disabled={isLoading || !hasUnsavedChanges}>
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-md">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active days</p>
              <p className="text-xl font-bold">{stats.activeDays}</p>
            </div>
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Weekly hours</p>
              <p className="text-xl font-bold">{stats.totalHours}h</p>
            </div>
            <Clock className="h-6 w-6 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="max-w-xs">
            <Label>Slot duration</Label>
            <Select
              value={String(slotDuration)}
              onValueChange={(v) => {
                setSlotDuration(Number(v));
                setHasUnsavedChanges(true);
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Timezone: {timezone}</p>
          </div>

          <WeeklyScheduleEditor availability={availability} onChange={handleAvailabilityChange} />
        </CardContent>
      </Card>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-2">
            <span className="text-sm font-medium">More options (exceptions & pricing)</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium">Time off / exceptions</p>
              <ExceptionDates
                vetId={vetId}
                exceptions={exceptions}
                onChange={handleExceptionsChange}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium">Consultation pricing (INR)</p>
              <PricingSettings availability={availability} onChange={handleAvailabilityChange} />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
