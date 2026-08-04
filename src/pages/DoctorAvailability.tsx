import { SchedulingProvider } from '@/context/SchedulingContext';
import { VetAvailabilityManager } from '@/components/vet/availability/VetAvailabilityManager';

export default function DoctorAvailability() {
  const vetId = 'vet1';
  return (
    <SchedulingProvider>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Manage Availability</h1>
        <VetAvailabilityManager vetId={vetId} currentAvailability={undefined} vetProfile={null} />
      </div>
    </SchedulingProvider>
  );
}
