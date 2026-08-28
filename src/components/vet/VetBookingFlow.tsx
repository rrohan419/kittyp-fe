import React, { useState } from 'react';
import { VetProfile, TimeSlot, Booking } from '../../types/scheduling';
import { VetList } from './VetList';
import { BookingForm } from './BookingForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { TimeSlotPicker } from './TimeSlotPicke';

interface VetBookingFlowProps {
  vets: VetProfile[];
  onBookingComplete?: (booking: Booking) => void;
}

type FlowStep = 'select-vet' | 'select-time' | 'booking-form' | 'confirmation';

export const VetBookingFlow: React.FC<VetBookingFlowProps> = ({
  vets,
  onBookingComplete
}) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('select-vet');
  const [selectedVet, setSelectedVet] = useState<VetProfile | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  const handleVetSelect = (vet: VetProfile) => {
    setSelectedVet(vet);
    setCurrentStep('select-time');
  };

  const handleSlotSelect = (slot: TimeSlot, date: Date) => {
    setSelectedSlot(slot);
    setSelectedDate(date);
    setCurrentStep('booking-form');
  };

  const handleBookingComplete = (booking: Booking) => {
    setCompletedBooking(booking);
    setCurrentStep('confirmation');
    onBookingComplete?.(booking);
  };

  const handleBackStep = () => {
    switch (currentStep) {
      case 'select-time':
        setCurrentStep('select-vet');
        setSelectedVet(null);
        break;
      case 'booking-form':
        setCurrentStep('select-time');
        setSelectedSlot(null);
        setSelectedDate(null);
        break;
      default:
        break;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'select-vet':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Choose a Veterinarian</h2>
            <VetList vets={vets} onSelectVet={handleVetSelect} />
          </div>
        );

      case 'select-time':
        return (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" onClick={handleBackStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h2 className="text-2xl font-bold">Select Time Slot</h2>
            </div>
            {selectedVet && (
              <TimeSlotPicker
                vet={selectedVet}
                onSlotSelect={handleSlotSelect}
                selectedSlot={selectedSlot}
              />
            )}
          </div>
        );

      case 'booking-form':
        return (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" onClick={handleBackStep}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h2 className="text-2xl font-bold">Complete Booking</h2>
            </div>
            {selectedVet && selectedSlot && selectedDate && (
              <BookingForm
                vet={selectedVet}
                selectedSlot={selectedSlot}
                selectedDate={selectedDate}
                onBookingComplete={handleBookingComplete}
                onCancel={handleBackStep}
              />
            )}
          </div>
        );

      case 'confirmation':
        return (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {completedBooking && (
                  <div className="text-center space-y-2">
                    <p><strong>Booking ID:</strong> {completedBooking.id}</p>
                    <p><strong>Vet:</strong> {selectedVet?.fullName}</p>
                    <p><strong>Date:</strong> {selectedDate && format(selectedDate, 'MMMM d, yyyy')}</p>
                    <p><strong>Time:</strong> {format(new Date(completedBooking.startTime), 'HH:mm')} - {format(new Date(completedBooking.endTime), 'HH:mm')}</p>
                    <p><strong>Total:</strong> ₹{completedBooking.price.toLocaleString('en-IN')}</p>
                  </div>
                )}
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    You will receive a confirmation email with meeting details shortly.
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setCurrentStep('select-vet');
                      setSelectedVet(null);
                      setSelectedSlot(null);
                      setSelectedDate(null);
                      setCompletedBooking(null);
                    }}
                  >
                    Book Another Consultation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {renderStepContent()}
    </div>
  );
};