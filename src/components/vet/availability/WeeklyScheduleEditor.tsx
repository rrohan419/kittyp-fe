import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Copy, Clock } from 'lucide-react';
import { VetAvailability } from '@/types/scheduling';

interface WeeklyScheduleEditorProps {
  availability: VetAvailability[];
  onChange: (availability: VetAvailability[]) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const CONSULTATION_TYPES = [
  { value: 'general', label: 'General Consultation', color: 'bg-blue-500' },
  { value: 'emergency', label: 'Emergency', color: 'bg-red-500' },
  { value: 'follow-up', label: 'Follow-up', color: 'bg-green-500' },
  { value: 'specialist', label: 'Specialist', color: 'bg-purple-500' },
];

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const time = `${hour.toString().padStart(2, '0')}:${minute}`;
  const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit' 
  });
  return { value: time, label: displayTime };
});

export const WeeklyScheduleEditor: React.FC<WeeklyScheduleEditorProps> = ({
  availability,
  onChange
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday by default

  const getAvailabilityForDay = (dayOfWeek: number): VetAvailability[] => {
    return availability.filter(slot => slot.dayOfWeek === dayOfWeek);
  };

  const addTimeSlot = (dayOfWeek: number) => {
    const existingSlotsForDay = getAvailabilityForDay(dayOfWeek);
    const lastSlot = existingSlotsForDay[existingSlotsForDay.length - 1];
    
    const newSlot: VetAvailability = {
      id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      vetId: availability[0]?.vetId || 'current-vet',
      dayOfWeek,
      startTime: lastSlot ? lastSlot.endTime : '09:00',
      endTime: lastSlot ? 
        (parseInt(lastSlot.endTime.split(':')[0]) + 1).toString().padStart(2, '0') + ':00' 
        : '17:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      slotDuration: 30,
      price: 75,
      consultationType: 'general',
      isActive: true
    };

    onChange([...availability, newSlot]);
  };

  const updateTimeSlot = (slotId: string, updates: Partial<VetAvailability>) => {
    const updatedAvailability = availability.map(slot =>
      slot.id === slotId ? { ...slot, ...updates } : slot
    );
    onChange(updatedAvailability);
  };

  const removeTimeSlot = (slotId: string) => {
    const updatedAvailability = availability.filter(slot => slot.id !== slotId);
    onChange(updatedAvailability);
  };

  const copyDaySchedule = (fromDay: number, toDay: number) => {
    const slotsFromDay = getAvailabilityForDay(fromDay);
    const newSlots = slotsFromDay.map(slot => ({
      ...slot,
      id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dayOfWeek: toDay
    }));

    // Remove existing slots for the target day and add new ones
    const filteredAvailability = availability.filter(slot => slot.dayOfWeek !== toDay);
    onChange([...filteredAvailability, ...newSlots]);
  };

  const toggleDayActive = (dayOfWeek: number, isActive: boolean) => {
    const updatedAvailability = availability.map(slot =>
      slot.dayOfWeek === dayOfWeek ? { ...slot, isActive } : slot
    );
    onChange(updatedAvailability);
  };

  const isDayActive = (dayOfWeek: number): boolean => {
    const daySlots = getAvailabilityForDay(dayOfWeek);
    return daySlots.length > 0 && daySlots.some(slot => slot.isActive);
  };

  const getConsultationType = (type: string) => {
    return CONSULTATION_TYPES.find(t => t.value === type) || CONSULTATION_TYPES[0];
  };

  return (
    <div className="space-y-6">
      {/* Day Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Weekly Schedule Editor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map(day => {
              const isActive = isDayActive(day.value);
              const isSelected = selectedDay === day.value;
              
              return (
                <Button
                  key={day.value}
                  variant={isSelected ? "default" : "outline"}
                  className={`p-4 h-auto flex-col ${!isActive ? 'opacity-50' : ''}`}
                  onClick={() => setSelectedDay(day.value)}
                >
                  <span className="font-medium">{day.short}</span>
                  <span className="text-xs">
                    {getAvailabilityForDay(day.value).length} slots
                  </span>
                  {isActive && (
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1" />
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label} Schedule
            </CardTitle>
            <div className="flex items-center gap-2">
              <Switch
                checked={isDayActive(selectedDay)}
                onCheckedChange={(checked) => toggleDayActive(selectedDay, checked)}
              />
              <Label>Active</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {getAvailabilityForDay(selectedDay).map((slot, index) => (
            <div key={slot.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={getConsultationType(slot.consultationType).color}>
                  {getConsultationType(slot.consultationType).label}
                </Badge>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={slot.isActive}
                    onCheckedChange={(checked) => updateTimeSlot(slot.id, { isActive: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTimeSlot(slot.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Select
                    value={slot.startTime}
                    onValueChange={(value) => updateTimeSlot(slot.id, { startTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(time => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>End Time</Label>
                  <Select
                    value={slot.endTime}
                    onValueChange={(value) => updateTimeSlot(slot.id, { endTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(time => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Slot Duration (min)</Label>
                  <Select
                    value={slot.slotDuration.toString()}
                    onValueChange={(value) => updateTimeSlot(slot.id, { slotDuration: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Consultation Type</Label>
                  <Select
                    value={slot.consultationType}
                    onValueChange={(value) => updateTimeSlot(slot.id, { consultationType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONSULTATION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Button onClick={() => addTimeSlot(selectedDay)} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Add Time Slot
            </Button>
            
            {selectedDay !== 1 && (
              <Button
                variant="outline"
                onClick={() => copyDaySchedule(1, selectedDay)} // Copy from Monday
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Monday
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                // Copy Monday schedule to all weekdays
                const mondaySlots = getAvailabilityForDay(1);
                if (mondaySlots.length > 0) {
                  [2, 3, 4, 5].forEach(day => copyDaySchedule(1, day));
                }
              }}
            >
              Copy Mon-Fri
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                // Clear weekend
                const filteredAvailability = availability.filter(slot => 
                  slot.dayOfWeek !== 0 && slot.dayOfWeek !== 6
                );
                onChange(filteredAvailability);
              }}
            >
              Clear Weekend
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                // Set all to inactive
                const updatedAvailability = availability.map(slot => ({
                  ...slot,
                  isActive: false
                }));
                onChange(updatedAvailability);
              }}
            >
              Disable All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};