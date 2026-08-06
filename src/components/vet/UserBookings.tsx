import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Video, X } from 'lucide-react';
import { Booking } from '../../types/scheduling';
import { useScheduling } from '@/context/SchedulingContext';
import { format } from 'date-fns';
import { LoadingState } from '@/components/ui/LoadingState';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface UserBookingsProps {
  userId: string;
}

export const UserBookings: React.FC<UserBookingsProps> = ({ userId }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const { getUserBookings, cancelBooking, isLoading } = useScheduling();

  useEffect(() => {
    loadBookings();
  }, [userId]);

  const loadBookings = async () => {
    try {
      const userBookings = await getUserBookings(userId);
      setBookings(userBookings.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ));
    } catch (error) {
      console.error('Failed to load bookings:', error);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
      await loadBookings(); // Reload bookings
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'no-show':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const isUpcoming = (booking: Booking) => {
    return new Date(booking.startTime) > new Date() && booking.status === 'scheduled';
  };

  const canCancel = (booking: Booking) => {
    const bookingTime = new Date(booking.startTime);
    const now = new Date();
    const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return booking.status === 'scheduled' && hoursUntilBooking > 24;
  };

  const startVideoCall = (booking: Booking) => {
    const meetingUrl = `https://meet.jit.si/vet-consultation-${booking.id}`;
    window.open(meetingUrl, '_blank');
  };

  const upcomingBookings = bookings.filter(isUpcoming);
  const pastBookings = bookings.filter(booking => !isUpcoming(booking));

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Appointments</h1>

      {/* Upcoming Appointments */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Upcoming Appointments</h2>
        {upcomingBookings.length > 0 ? (
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(booking.status)}`} />
                      <div>
                        <h3 className="font-semibold text-lg">
                          {booking.consultationType.charAt(0).toUpperCase() + booking.consultationType.slice(1)} Consultation
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(booking.startTime), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm font-medium mt-2">₹{booking.price.toLocaleString('en-IN')}</p>
                        {booking.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{booking.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{booking.status}</Badge>
                      {booking.status === 'scheduled' && (
                        <Button size="sm" onClick={() => startVideoCall(booking)}>
                          <Video className="h-4 w-4 mr-2" />
                          Join Call
                        </Button>
                      )}
                      {canCancel(booking) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this appointment? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleCancelBooking(booking.id)}>
                                Cancel Appointment
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              You don't have any upcoming appointments. 
              <Button variant="link" className="p-0 h-auto ml-1">
                Book a consultation now
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Past Appointments */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Past Appointments</h2>
        {pastBookings.length > 0 ? (
          <div className="space-y-4">
            {pastBookings.slice(0, 10).map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(booking.status)}`} />
                      <div>
                        <h3 className="font-semibold">
                          {booking.consultationType.charAt(0).toUpperCase() + booking.consultationType.slice(1)} Consultation
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(booking.startTime), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(booking.startTime), 'HH:mm')}
                          </span>
                        </div>
                        {booking.prescription && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Prescription: {booking.prescription}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{booking.status}</Badge>
                      <p className="text-sm font-medium">₹{booking.price.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              No past appointments found.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};