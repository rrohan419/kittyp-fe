import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getCurrentUser, validateToken } from '@/services/authService';
import { UserProfile, PetProfile } from '@/services/authService';
import { addPet, AddPet, deletePet, editPet, UpdatePet, fetchUserDetail, saveUserFcmToken } from '@/services/UserService';
import { toast } from 'sonner';
import type { AppRole } from '@/utils/roles';
import { getAuthItem, removeAuthItem, setAuthItem } from '@/utils/authStorage';

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  petsLoading: boolean;
  saving: boolean;
  /** Active session role for multi-role users */
  activeRole: AppRole | null;
  /** Active clinic context for clinic admins with multiple clinics */
  activeClinicId: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  petsLoading: false,
  saving: false,
  activeRole: (getAuthItem('role') as AppRole | null) || null,
  activeClinicId: getAuthItem('activeClinicId') || null,
};

// Async thunk to validate token and get user
export const validateAndSetUser = createAsyncThunk(
  'auth/validateAndSetUser',
  async (_, { rejectWithValue }) => {
    const tokenAtStart = getAuthItem('access_token');
    if (!tokenAtStart) {
      return rejectWithValue('No access token');
    }
    try {
      const user = await getCurrentUser();
      // Another login may have replaced credentials while /user/me was in flight
      if (getAuthItem('access_token') !== tokenAtStart) {
        return rejectWithValue('Stale auth validation');
      }
      if (!user) {
        return rejectWithValue('Authentication failed');
      }
      return user;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Pet management async thunks
export const addPetToUser = createAsyncThunk(
  'auth/add/pet',
  async ({ petDto }: { petDto: AddPet }, { dispatch }) => {
    try {
      const response = await addPet(petDto);
      
      // Refresh user data from server to ensure consistency
      const updatedUser = await fetchUserDetail();
      dispatch(setUser(updatedUser));
      
      toast.success("Pet Added Successfully", {
        description: `${petDto.name} has been added to your profile.`
      });
      return response;
    } catch (err) {
      toast.error("Failed to add pet.");
      throw err;
    }
  }
);

export const removePetFromUser = createAsyncThunk(
  'auth/remove/pet',
  async (petUuid: string, { dispatch }) => {
    try {
      await deletePet(petUuid);
      
      // Refresh user data from server to ensure consistency
      const updatedUser = await fetchUserDetail();
      dispatch(setUser(updatedUser));
      
      toast.success("Pet Removed Successfully");
    } catch (err) {
      toast.error("Failed to remove pet.");
      throw err;
    }
  }
);

export const updatePetInUser = createAsyncThunk(
  'auth/update/pet',
  async (updatePetDto: UpdatePet, { dispatch }) => {
    try {
      const updatedPet = await editPet(updatePetDto);
      
      // Refresh user data from server to ensure consistency
      const updatedUser = await fetchUserDetail();
      dispatch(setUser(updatedUser));
      
      toast.success("Pet Updated Successfully", {
        description: `${updatedPet.name} has been updated.`
      });
      return updatedPet;
    } catch (err) {
      toast.error("Failed to update pet.");
      throw err;
    }
  }
);

export const addFcmTokenToUser = createAsyncThunk(
  'auth/user/fcm-token',
  async (fcmToken: string, { dispatch }) => {
    try {
      const updatedUser = await saveUserFcmToken(fcmToken);
      
      dispatch(setUser(updatedUser));
      
    } catch (err) {
      console.error('❌ AuthSlice: FCM token update failed:', err);
      toast.error("Failed to update FCM token.");
      throw err;
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      const payload = action.payload;
      if (payload && typeof payload === 'object' && 'accessToken' in payload) {
        const { accessToken: _omit, ...safe } = payload;
        state.user = safe;
      } else {
        state.user = payload;
      }
      state.isAuthenticated = !!action.payload;
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.activeRole = null;
      state.activeClinicId = null;
    },
    setActiveRole: (state, action: PayloadAction<AppRole | null>) => {
      state.activeRole = action.payload;
      if (action.payload) {
        setAuthItem('role', action.payload);
      } else {
        removeAuthItem('role');
      }
    },
    setActiveClinic: (state, action: PayloadAction<string | null>) => {
      state.activeClinicId = action.payload;
      if (action.payload) {
        setAuthItem('activeClinicId', action.payload);
      } else {
        removeAuthItem('activeClinicId');
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setPetsLoading: (state, action) => {
      state.petsLoading = action.payload;
    },
    setSaving: (state, action) => {
      state.saving = action.payload;
    },
    // Pet management reducers (for optimistic updates if needed)
    addUserPet: (state, action) => {
      if (state.user) {
        state.user.ownerPets.push(action.payload);
      }
    },
    removeUserPet: (state, action) => {
      if (state.user) {
        state.user.ownerPets = state.user.ownerPets.filter(pet => pet.uuid !== action.payload);
      }
    },
    updateUserPet: (state, action) => {
      if (state.user) {
        const { uuid, ...petData } = action.payload;
        state.user.ownerPets = state.user.ownerPets.map(pet => 
          pet.uuid === uuid ? { ...pet, ...petData } : pet
        );
      }
    },
    setUserPets: (state, action) => {
      if (state.user) {
        state.user.ownerPets = action.payload;
        state.petsLoading = false;
      }
    },
    setUserFcmToken: (state, action) => {
      if (state.user) {
        state.user.fcmToken = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(validateAndSetUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validateAndSetUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.error = null;
      })
      .addCase(validateAndSetUser.rejected, (state, action) => {
        state.loading = false;
        // A superseded in-flight /user/me must not wipe a newer login
        if (action.payload === 'Stale auth validation') {
          return;
        }
        state.user = null;
        state.isAuthenticated = false;
        state.error = (action.payload as string) || 'Authentication failed';
      })
      // Pet management loading states
      .addCase(addPetToUser.pending, (state) => {
        state.saving = true;
      })
      .addCase(addPetToUser.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(addPetToUser.rejected, (state) => {
        state.saving = false;
      })
      .addCase(removePetFromUser.pending, (state) => {
        state.saving = true;
      })
      .addCase(removePetFromUser.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(removePetFromUser.rejected, (state) => {
        state.saving = false;
      })
      .addCase(updatePetInUser.pending, (state) => {
        state.saving = true;
      })
      .addCase(updatePetInUser.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updatePetInUser.rejected, (state) => {
        state.saving = false;
      })
      .addCase(addFcmTokenToUser.pending, (state) => {
        state.saving = true;
      })
      .addCase(addFcmTokenToUser.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(addFcmTokenToUser.rejected, (state) => {
        state.saving = false;
      })
  },
});

export const { 
  setUser, 
  clearUser,
  setActiveRole,
  setActiveClinic,
  setLoading, 
  setError, 
  setPetsLoading, 
  setSaving,
  addUserPet,
  removeUserPet,
  updateUserPet,
  setUserPets,
  setUserFcmToken
} = authSlice.actions;

// Add async thunk to update user profile
export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (updatedUser: UserProfile, { dispatch }) => {
    try {
      dispatch(setUser(updatedUser));
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }
);

export default authSlice.reducer; 