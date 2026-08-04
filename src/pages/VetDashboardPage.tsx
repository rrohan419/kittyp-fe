import React from 'react';
import { VetDashboard } from '@/components/vet/VetDashboard';
import { SchedulingProvider } from '@/context/SchedulingContext';

export const VetDashboardPage: React.FC = () => {
  // In a real app, you'd get the vet ID from authentication context
  const vetId = 'vet1'; // Replace with actual vet ID from auth

  return (
    <SchedulingProvider>
      <VetDashboard vetId={vetId} />
    </SchedulingProvider>
  );
};