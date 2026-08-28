import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import { VetProfile, TimeSlot } from '../../types/scheduling';
import { useScheduling } from '@/context/SchedulingContext';
import { format } from 'date-fns';
import { LoadingState } from '@/components/ui/LoadingState';

interface TimeSlotPickerProps {
  vet: VetProfile;
  onSlotSelect: (slot: TimeSlot, date: Date) => void;
  selectedSlot?: TimeSlot;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  vet,
  onSlotSelect,
  selectedSlot
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const { getAvailableSlots, isLoading } = useScheduling();

  useEffect(() => {
    if (selectedDate && vet.id) {
      loadAvailableSlots();
    }
  }, [selectedDate, vet.id]);

  const loadAvailableSlots = async () => {
    if (!selectedDate) return;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const slots = await getAvailableSlots(vet.id, dateStr);
    setAvailableSlots(slots);
  };

  const formatSlotTime = (slot: TimeSlot) => {
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
  };

  const isSlotSelected = (slot: TimeSlot) => {
    return selectedSlot?.id === slot.id;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date()}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Available Times - {format(selectedDate, 'MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState />
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant={isSlotSelected(slot) ? "default" : "outline"}
                    className="h-auto flex-col p-3"
                    onClick={() => onSlotSelect(slot, selectedDate)}
                  >
                    <span className="font-medium">{formatSlotTime(slot)}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm">₹{slot.price.toLocaleString('en-IN')}</span>
                      <Badge variant="secondary" className="text-xs">
                        {slot.consultationType}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No available slots for this date.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};