import axiosInstance from '@/config/axionInstance';
import { Booking, BookingFilters, TimeSlot, VetProfile } from '../types/scheduling';

export const schedulingService = {
  async searchVets(filters: BookingFilters): Promise<VetProfile[]> {
    const response = await axiosInstance.post('/vet/search', filters);
    return response.data?.data || [];
  },

  async getAvailableSlots(vetId: string, date: string): Promise<TimeSlot[]> {
    const response = await axiosInstance.get(`/vet/${vetId}/slots?date=${encodeURIComponent(date)}`);
    return response.data?.data || [];
  },

  async bookAppointment(data: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    const response = await axiosInstance.post('/booking', data);
    return response.data?.data;
  },

  async cancelBooking(bookingId: string): Promise<void> {
    await axiosInstance.delete(`/booking/${bookingId}`);
  },

  async getUserBookings(userId: string): Promise<Booking[]> {
    const response = await axiosInstance.get(`/booking/user/${userId}`);
    return response.data?.data || [];
  },

  async getVetBookings(vetId: string): Promise<Booking[]> {
    const response = await axiosInstance.get(`/booking/vet/${vetId}`);
    return response.data?.data || [];
  },
};
