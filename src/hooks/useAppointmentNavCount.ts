import { useEffect, useState } from 'react';
import { format, isValid, parseISO, startOfDay } from 'date-fns';
import { fetchClinicVisits, type ClinicBookingModel, type ClinicVisitModel } from '@/services/clinicService';
import { fetchMyDoctorBookings, fetchMyDoctorVisits } from '@/services/visitService';
import { ROLES } from '@/utils/roles';

const ACTIVE_VISIT = new Set(['WAITLIST', 'CHECKED_IN', 'IN_PROGRESS']);
const CLOSED_BOOKING = new Set(['CANCELLED', 'NO_SHOW', 'COMPLETED']);

function countOpenAppointments(visits: ClinicVisitModel[], bookings: ClinicBookingModel[]): number {
  const cutoff = Date.now() - 60 * 60 * 1000;
  let n = visits.filter((v) => ACTIVE_VISIT.has(v.status)).length;
  for (const booking of bookings) {
    const status = (booking.status || '').toUpperCase();
    if (CLOSED_BOOKING.has(status) || !booking.slotStart) continue;
    const start = parseISO(booking.slotStart);
    if (!isValid(start) || start.getTime() < cutoff) continue;
    n += 1;
  }
  return n;
}

/** Live count for the Appointments nav badge. 0 when none — never a placeholder. */
export function useAppointmentNavCount(
  role: string | null | undefined,
  clinicUuid: string | null | undefined
): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const isDoctor = role === ROLES.DOCTOR;
    const isClinic = role === ROLES.CLINIC_ADMIN || role === ROLES.CLINIC_STAFF;
    if (!isDoctor && !isClinic) {
      setCount(0);
      return;
    }
    if (isClinic && !clinicUuid) {
      setCount(0);
      return;
    }

    let cancelled = false;
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd');

    const load = async () => {
      try {
        let next = 0;
        if (isDoctor) {
          const [visits, bookings] = await Promise.all([
            fetchMyDoctorVisits({ date: today, clinicUuid: clinicUuid || undefined }),
            fetchMyDoctorBookings({ date: today, clinicUuid: clinicUuid || undefined }).catch(
              () => [] as ClinicBookingModel[]
            ),
          ]);
          next = countOpenAppointments(visits, bookings);
        } else if (clinicUuid) {
          const visits = await fetchClinicVisits(clinicUuid, { date: today });
          next = visits.filter((v) => ACTIVE_VISIT.has(v.status)).length;
        }
        if (!cancelled) setCount(next);
      } catch {
        if (!cancelled) setCount(0);
      }
    };

    void load();
    const interval = setInterval(() => void load(), 30000);
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [role, clinicUuid]);

  return count;
}
