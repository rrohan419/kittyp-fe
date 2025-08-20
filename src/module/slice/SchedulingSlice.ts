import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { VetProfile, TimeSlot, Booking, BookingFilters } from '@/types/scheduling';
import { schedulingService } from '@/services/schedulingService';

interface SchedulingState {
  vets: VetProfile[];
  availableSlots: TimeSlot[];
  userBookings: Booking[];
  vetBookings: Booking[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SchedulingState = {
  vets: [],
  availableSlots: [],
  userBookings: [],
  vetBookings: [],
  isLoading: false,
  error: null,
};

// Async Thunks
export const searchVets = createAsyncThunk('scheduling/searchVets', async (filters: BookingFilters, { rejectWithValue }) => {
  try {
    return await schedulingService.searchVets(filters);
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to search vets');
  }
});

export const getAvailableSlots = createAsyncThunk('scheduling/getAvailableSlots', async ({ vetId, date }: { vetId: string, date: string }, { rejectWithValue }) => {
  try {
    return await schedulingService.getAvailableSlots(vetId, date);
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to get available slots');
  }
});

export const bookAppointment = createAsyncThunk('scheduling/bookAppointment', async (data: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
  try {
    return await schedulingService.bookAppointment(data);
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to book appointment');
  }
});

export const cancelBooking = createAsyncThunk('scheduling/cancelBooking', async (bookingId: string, { rejectWithValue }) => {
  try {
    await schedulingService.cancelBooking(bookingId);
    return bookingId;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to cancel booking');
  }
});

export const getUserBookings = createAsyncThunk('scheduling/getUserBookings', async (userId: string, { rejectWithValue }) => {
  try {
    return await schedulingService.getUserBookings(userId);
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to get user bookings');
  }
});

export const getVetBookings = createAsyncThunk('scheduling/getVetBookings', async (vetId: string, { rejectWithValue }) => {
  try {
    return await schedulingService.getVetBookings(vetId);
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to get vet bookings');
  }
});

// Slice
const schedulingSlice = createSlice({
  name: 'scheduling',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(searchVets.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchVets.fulfilled, (state, action: PayloadAction<VetProfile[]>) => {
        state.vets = action.payload;
        state.isLoading = false;
      })
      .addCase(searchVets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(getAvailableSlots.fulfilled, (state, action: PayloadAction<TimeSlot[]>) => {
        state.availableSlots = action.payload;
        state.isLoading = false;
      })
      .addCase(getAvailableSlots.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAvailableSlots.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(bookAppointment.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bookAppointment.fulfilled, (state, action: PayloadAction<Booking>) => {
        state.userBookings.push(action.payload);
        state.isLoading = false;
      })
      .addCase(bookAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(cancelBooking.fulfilled, (state, action: PayloadAction<string>) => {
        state.userBookings = state.userBookings.map(booking =>
          booking.id === action.payload ? { ...booking, status: 'cancelled' as const } : booking
        );
        state.isLoading = false;
      })

      .addCase(getUserBookings.fulfilled, (state, action: PayloadAction<Booking[]>) => {
        state.userBookings = action.payload;
        state.isLoading = false;
      })

      .addCase(getVetBookings.fulfilled, (state, action: PayloadAction<Booking[]>) => {
        state.vetBookings = action.payload;
        state.isLoading = false;
      });
  },
});

export default schedulingSlice.reducer;