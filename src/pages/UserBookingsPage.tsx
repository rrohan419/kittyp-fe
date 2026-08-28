import React from 'react';
import { UserBookings } from '@/components/vet/UserBookings';
import { SchedulingProvider } from '@/context/SchedulingContext';

export const UserBookingsPage: React.FC = () => {
  // In a real app, you'd get the user ID from authentication context
  const userId = 'user1'; // Replace with actual user ID from auth

  return (
    <SchedulingProvider>
      <UserBookings userId={userId} />
    </SchedulingProvider>
  );
};