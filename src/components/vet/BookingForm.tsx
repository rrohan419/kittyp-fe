import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useScheduling } from '@/context/SchedulingContext';
import { format } from 'date-fns';
import { Booking, TimeSlot, VetProfile } from '../../types/scheduling';

const bookingSchema = z.object({
  petName: z.string().min(1, 'Pet name is required'),
  petType: z.string().min(1, 'Pet type is required'),
  petAge: z.string().min(1, 'Pet age is required'),
  symptoms: z.string().min(10, 'Please describe symptoms (min 10 characters)'),
  urgency: z.enum(['low', 'medium', 'high']),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  vet: VetProfile;
  selectedSlot: TimeSlot;
  selectedDate: Date;
  onBookingComplete: (booking: Booking) => void;
  onCancel: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  vet,
  selectedSlot,
  selectedDate,
  onBookingComplete,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { bookAppointment } = useScheduling();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      petName: '',
      petType: '',
      petAge: '',
      symptoms: '',
      urgency: 'medium',
      notes: '',
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    try {
      setIsSubmitting(true);
      
      // In a real app, you'd get the userId from auth context
      const userId = 'current-user-id'; // Replace with actual user ID
      
      const bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        vetId: vet.id,
        timeSlotId: selectedSlot.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        consultationType: selectedSlot.consultationType,
        status: 'scheduled',
        price: selectedSlot.price,
        paymentStatus: 'pending',
        notes: `Pet: ${data.petName} (${data.petType}, ${data.petAge})\nSymptoms: ${data.symptoms}\nUrgency: ${data.urgency}${data.notes ? `\nAdditional Notes: ${data.notes}` : ''}`,
      };

      const booking = await bookAppointment(bookingData);
      onBookingComplete(booking);
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSlotTime = () => {
    const start = new Date(selectedSlot.startTime);
    const end = new Date(selectedSlot.endTime);
    return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Consultation</CardTitle>
        <div className="text-sm text-muted-foreground">
          <p>Vet: {vet.fullName}</p>
          <p>Date: {format(selectedDate, 'MMMM d, yyyy')}</p>
          <p>Time: {formatSlotTime()}</p>
          <p>Price: ${selectedSlot.price}</p>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="petName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pet Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Buddy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="petType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pet Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pet type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cat">Cat</SelectItem>
                        <SelectItem value="dog">Dog</SelectItem>
                        <SelectItem value="bird">Bird</SelectItem>
                        <SelectItem value="rabbit">Rabbit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="petAge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pet Age</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2 years" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symptoms & Concerns</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe your pet's symptoms, behavior changes, or concerns..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information you'd like to share..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Booking...' : `Book Consultation - $${selectedSlot.price}`}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};