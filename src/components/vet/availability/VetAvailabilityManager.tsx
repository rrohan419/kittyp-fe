import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Calendar, IndianRupee, Save, AlertCircle } from 'lucide-react';
import { VetAvailability, VetProfile } from '@/types/scheduling';
import { WeeklyScheduleEditor } from './WeeklyScheduleEditor';
import { PricingSettings } from './PricingSettings';
import { AvailabilityPreview } from './AvailabilityPreview';
import { ExceptionDates } from './ExceptionDate';
import { toast } from 'sonner';
import {
  AvailabilityException,
  formatInr,
  INR_DEFAULT_PRICES,
  saveMyAvailability,
} from '@/services/availabilityService';

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
  slotDuration = 30,
  vetProfile,
}) => {
  const [availability, setAvailability] = useState<VetAvailability[]>(currentAvailability);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>(currentExceptions);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');

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

      toast.success('Availability saved (prices in INR)');
      setHasUnsavedChanges(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save availability');
    } finally {
      setIsLoading(false);
    }
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

    slots.forEach((slot) => {
      if (slot.price <= 0) {
        errors.push(`Invalid INR price for ${getDayName(slot.dayOfWeek)}`);
      }
    });

    return errors;
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const getAvailabilityStats = () => {
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

    const avgPrice =
      availability.length > 0
        ? availability.reduce((sum, slot) => sum + slot.price, 0) / availability.length
        : 0;

    return { activeDays, totalHours: Math.round(totalHours), avgPrice: Math.round(avgPrice) };
  };

  const stats = getAvailabilityStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Manage Availability</h2>
          <p className="text-muted-foreground">
            Set working hours and consultation prices in INR (₹)
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {hasUnsavedChanges && (
            <Alert className="w-auto py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>You have unsaved changes</AlertDescription>
            </Alert>
          )}
          <Button
            onClick={() => void handleSave()}
            disabled={isLoading || !hasUnsavedChanges}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Days</p>
                <p className="text-2xl font-bold">{stats.activeDays}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Weekly Hours</p>
                <p className="text-2xl font-bold">{stats.totalHours}h</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Price (INR)</p>
                <p className="text-2xl font-bold">{formatInr(stats.avgPrice)}</p>
              </div>
              <IndianRupee className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Types</TabsTrigger>
          <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <WeeklyScheduleEditor availability={availability} onChange={handleAvailabilityChange} />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <PricingSettings availability={availability} onChange={handleAvailabilityChange} />
        </TabsContent>

        <TabsContent value="exceptions" className="space-y-4">
          <ExceptionDates
            vetId={vetId}
            exceptions={exceptions}
            onChange={handleExceptionsChange}
          />
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <AvailabilityPreview availability={availability} vetProfile={vetProfile ?? undefined} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
