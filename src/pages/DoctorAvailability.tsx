import { useEffect, useState } from 'react';
import { SchedulingProvider } from '@/context/SchedulingContext';
import { VetAvailabilityManager } from '@/components/vet/availability/VetAvailabilityManager';
import { Loader2 } from 'lucide-react';
import {
  AvailabilityException,
  fetchMyAvailability,
} from '@/services/availabilityService';
import { fetchMyDoctorProfile } from '@/services/doctorVerificationService';
import { VetAvailability, VetProfile } from '@/types/scheduling';
import { useAppSelector } from '@/module/store/hooks';
import { toast } from 'sonner';

export default function DoctorAvailability() {
  const user = useAppSelector((s) => s.authReducer.user);
  const [loading, setLoading] = useState(true);
  const [doctorUuid, setDoctorUuid] = useState('');
  const [schedule, setSchedule] = useState<VetAvailability[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [slotDuration, setSlotDuration] = useState(30);
  const [vetProfile, setVetProfile] = useState<VetProfile | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [availability, profile] = await Promise.all([
          fetchMyAvailability(),
          fetchMyDoctorProfile().catch(() => null),
        ]);
        setDoctorUuid(availability.doctorUuid);
        setSchedule(
          (availability.weeklySchedule || []).map((slot) => ({
            ...slot,
            vetId: availability.doctorUuid,
            timezone: slot.timezone || availability.timezone || 'Asia/Kolkata',
          }))
        );
        setExceptions(availability.exceptions || []);
        setTimezone(availability.timezone || 'Asia/Kolkata');
        setSlotDuration(availability.slotDurationMinutes || 30);

        const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Doctor';
        setVetProfile({
          id: availability.doctorUuid,
          fullName: `Dr. ${fullName}`,
          specialization: profile?.specialization?.replace(/_/g, ' '),
          consultationPrice: scheduleAvg(availability.weeklySchedule),
          isVerified: profile?.status === 'VERIFIED' || profile?.status === 'PUBLISHED',
        });
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Failed to load availability');
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.firstName, user?.lastName]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading availability…
      </div>
    );
  }

  return (
    <SchedulingProvider>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <VetAvailabilityManager
          vetId={doctorUuid}
          currentAvailability={schedule}
          currentExceptions={exceptions}
          timezone={timezone}
          slotDuration={slotDuration}
          vetProfile={vetProfile}
        />
      </div>
    </SchedulingProvider>
  );
}

function scheduleAvg(slots?: VetAvailability[]): number | undefined {
  if (!slots?.length) return undefined;
  return Math.round(slots.reduce((sum, s) => sum + (s.price || 0), 0) / slots.length);
}
