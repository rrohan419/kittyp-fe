import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Calendar, DollarSign, Save, AlertCircle, Eye } from 'lucide-react';
import { VetAvailability, VetProfile } from '@/types/scheduling';
import { WeeklyScheduleEditor } from './WeeklyScheduleEditor';
import { PricingSettings } from './PricingSettings';
import { AvailabilityPreview } from './AvailabilityPreview';
import { ExceptionDates } from './ExceptionDate';
import { useToast } from '@/hooks/use-toast';

interface VetAvailabilityManagerProps {
  vetId: string;
  currentAvailability?: VetAvailability[];
  vetProfile?: VetProfile;
}

export const VetAvailabilityManager: React.FC<VetAvailabilityManagerProps> = ({
  vetId,
  currentAvailability = [],
  vetProfile
}) => {
  const [availability, setAvailability] = useState<VetAvailability[]>(currentAvailability);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');
  const { toast } = useToast();

  useEffect(() => {
    // Initialize default availability if none exists
    if (availability.length === 0) {
      initializeDefaultAvailability();
    }
  }, []);

  const initializeDefaultAvailability = () => {
    const defaultAvailability: VetAvailability[] = [
      // Monday to Friday - General Practice
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `default-${i}`,
        vetId,
        dayOfWeek: i + 1, // Monday = 1, Friday = 5
        startTime: '09:00',
        endTime: '17:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        slotDuration: 30,
        price: 75,
        consultationType: 'general' as const,
        isActive: true
      }))
    ];
    setAvailability(defaultAvailability);
  };

  const handleAvailabilityChange = (newAvailability: VetAvailability[]) => {
    setAvailability(newAvailability);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Validate availability
      const validationErrors = validateAvailability(availability);
      if (validationErrors.length > 0) {
        toast("Validation Error");
        return;
      }

      // In real implementation, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast("Your availability has been saved successfully.");
      
      setHasUnsavedChanges(false);
    } catch (error) {
      toast("Failed to save availability. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const validateAvailability = (availability: VetAvailability[]): string[] => {
    const errors: string[] = [];
    
    // Check for overlapping time slots on the same day
    const groupedByDay = availability.reduce((acc, slot) => {
      if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
      acc[slot.dayOfWeek].push(slot);
      return acc;
    }, {} as Record<number, VetAvailability[]>);

    Object.entries(groupedByDay).forEach(([day, slots]) => {
      const sortedSlots = slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      for (let i = 0; i < sortedSlots.length - 1; i++) {
        const current = sortedSlots[i];
        const next = sortedSlots[i + 1];
        
        if (current.endTime > next.startTime) {
          errors.push(`Overlapping time slots on ${getDayName(parseInt(day))}`);
        }
      }
    });

    // Check for reasonable working hours
    availability.forEach(slot => {
      const startHour = parseInt(slot.startTime.split(':')[0]);
      const endHour = parseInt(slot.endTime.split(':')[0]);
      
      if (endHour - startHour > 12) {
        errors.push(`Very long working hours on ${getDayName(slot.dayOfWeek)} (${endHour - startHour} hours)`);
      }
      
      if (slot.price <= 0) {
        errors.push(`Invalid price for ${getDayName(slot.dayOfWeek)}`);
      }
    });

    return errors;
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const getAvailabilityStats = () => {
    const activeDays = new Set(availability.filter(a => a.isActive).map(a => a.dayOfWeek)).size;
    const totalHours = availability
      .filter(a => a.isActive)
      .reduce((total, slot) => {
        const start = parseInt(slot.startTime.split(':')[0]) + parseInt(slot.startTime.split(':')[1]) / 60;
        const end = parseInt(slot.endTime.split(':')[0]) + parseInt(slot.endTime.split(':')[1]) / 60;
        return total + (end - start);
      }, 0);
    
    const avgPrice = availability.length > 0 
      ? availability.reduce((sum, slot) => sum + slot.price, 0) / availability.length 
      : 0;

    return { activeDays, totalHours: Math.round(totalHours), avgPrice: Math.round(avgPrice) };
  };

  const stats = getAvailabilityStats();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Availability</h2>
          <p className="text-muted-foreground">Set your working hours, pricing, and consultation types</p>
        </div>
        <div className="flex items-center gap-4">
          {hasUnsavedChanges && (
            <Alert className="w-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>You have unsaved changes</AlertDescription>
            </Alert>
          )}
          <Button 
            onClick={handleSave} 
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

      {/* Quick Stats */}
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
                <p className="text-sm text-muted-foreground">Avg. Price</p>
                <p className="text-2xl font-bold">${stats.avgPrice}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Types</TabsTrigger>
          <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <WeeklyScheduleEditor
            availability={availability}
            onChange={handleAvailabilityChange}
          />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <PricingSettings
            availability={availability}
            onChange={handleAvailabilityChange}
          />
        </TabsContent>

        <TabsContent value="exceptions" className="space-y-4">
          <ExceptionDates
            vetId={vetId}
          />
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <AvailabilityPreview
            availability={availability}
            vetProfile={vetProfile}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};