import { ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/module/store/hooks';
import {
  getAvailableSlots,
  getUserBookings,
  getVetBookings,
  searchVets,
  bookAppointment,
  cancelBooking,
  SchedulingState,
} from '@/module/slice/SchedulingSlice';
import { Booking, BookingFilters } from '../types/scheduling';

interface SchedulingProviderProps {
  children: ReactNode;
}

export const SchedulingProvider: React.FC<SchedulingProviderProps> = ({ children }) => {
  return <>{children}</>;
};

export const useScheduling = () => {
  const dispatch = useAppDispatch();
  const scheduling = useAppSelector((state) => state.scheduling) as SchedulingState;

  return {
    vets: scheduling.vets,
    availableSlots: scheduling.availableSlots,
    userBookings: scheduling.userBookings,
    vetBookings: scheduling.vetBookings,
    isLoading: scheduling.isLoading,
    error: scheduling.error,
    searchVets: (filters: BookingFilters) => dispatch(searchVets(filters)).unwrap(),
    getAvailableSlots: (vetId: string, date: string) => dispatch(getAvailableSlots({ vetId, date })).unwrap(),
    bookAppointment: (data: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => dispatch(bookAppointment(data)).unwrap(),
    cancelBooking: (bookingId: string) => dispatch(cancelBooking(bookingId)).unwrap(),
    getUserBookings: (userId: string) => dispatch(getUserBookings(userId)).unwrap(),
    getVetBookings: (vetId: string) => dispatch(getVetBookings(vetId)).unwrap(),
  };
};
