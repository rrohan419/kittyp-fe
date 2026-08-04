import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Calendar as CalendarIcon, Clock, DollarSign } from 'lucide-react';
import { VetAvailability, VetProfile, TimeSlot } from '@/types/scheduling';
import { format, addDays, startOfWeek } from 'date-fns';
import { utcToZonedTime, formatInTimeZone } from 'date-fns-tz';
import { generateTimeSlots } from '@/utils/timezone';

interface AvailabilityPreviewProps {
  availability: VetAvailability[];
  vetProfile?: VetProfile;
}

export const AvailabilityPreview: React.FC<AvailabilityPreviewProps> = ({
  availability,
  vetProfile
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const getAvailabilityForDate = (date: Date): TimeSlot[] => {
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.filter(slot => 
      slot.dayOfWeek === dayOfWeek && slot.isActive
    );

    const allSlots: TimeSlot[] = [];
    
    dayAvailability.forEach(avail => {
      const slots = generateTimeSlots(
        avail.startTime,
        avail.endTime,
        avail.slotDuration,
        date,
        avail.timezone
      );

      slots.forEach((slotStart, index) => {
        const slotEnd = new Date(slotStart.getTime() + avail.slotDuration * 60000);
        
        allSlots.push({
          id: `preview-${avail.id}-${index}`,
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          isBooked: false, // This is just a preview
          vetId: avail.vetId,
          timezone: avail.timezone,
          price: avail.price,
          consultationType: avail.consultationType
        });
      });
    });

    return allSlots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  const getWeekAvailability = () => {
    const startDate = startOfWeek(selectedDate);
    const weekData = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, i);
      const slots = getAvailabilityForDate(date);
      weekData.push({
        date,
        dayName: format(date, 'EEEE'),
        shortDay: format(date, 'EEE'),
        slots,
        totalSlots: slots.length,
        totalRevenue: slots.reduce((sum, slot) => sum + slot.price, 0)
      });
    }

    return weekData;
  };

  const getConsultationTypeColor = (type: string) => {
    const colors = {
      general: 'bg-blue-500',
      emergency: 'bg-red-500',
      'follow-up': 'bg-green-500',
      specialist: 'bg-purple-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const formatSlotTime = (slot: TimeSlot) => {
    const timezone = slot.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const zonedStart = utcToZonedTime(new Date(slot.startTime), timezone);
    return formatInTimeZone(zonedStart, timezone, 'HH:mm');
  };

  const weekData = getWeekAvailability();
  const selectedDateSlots = getAvailabilityForDate(selectedDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Availability Preview
          </CardTitle>
          <p className="text-muted-foreground">
            This is how your availability will appear to patients
          </p>
        </CardHeader>
      </Card>

      {/* Preview Mode Selector */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'calendar' | 'list')}>
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">Week Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Available Slots */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Available Slots - {format(selectedDate, 'MMMM d, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDateSlots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedDateSlots.map(slot => (
                        <div
                          key={slot.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              {formatSlotTime(slot)}
                            </span>
                            <span className="font-bold text-primary">
                              ${slot.price}
                            </span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${getConsultationTypeColor(slot.consultationType)} text-white text-xs`}
                          >
                            {slot.consultationType}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No available slots for this date</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            {weekData.map(day => (
              <Card key={day.date.toISOString()} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{day.shortDay}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {format(day.date, 'MMM d')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Slots:</span>
                    <span className="font-medium">{day.totalSlots}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Revenue:</span>
                    <span className="font-medium text-green-600">${day.totalRevenue}</span>
                  </div>

                  {day.slots.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Time Range:</p>
                      <p className="text-sm font-medium">
                        {formatSlotTime(day.slots[0])} - {formatSlotTime(day.slots[day.slots.length - 1])}
                      </p>
                    </div>
                  )}

                  {day.slots.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      No availability
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Week Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Week Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {weekData.reduce((sum, day) => sum + day.totalSlots, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Slots</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${weekData.reduce((sum, day) => sum + day.totalRevenue, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Potential Revenue</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {weekData.filter(day => day.totalSlots > 0).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Days</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};