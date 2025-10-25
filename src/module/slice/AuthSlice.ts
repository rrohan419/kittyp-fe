import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCurrentUser, validateToken } from '@/services/authService';
import { UserProfile, PetProfile } from '@/services/authService';
import { addPet, AddPet, deletePet, editPet, UpdatePet, fetchUserDetail, saveUserFcmToken } from '@/services/UserService';
import { toast } from 'sonner';

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  petsLoading: boolean;
  saving: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  petsLoading: false,
  saving: false,
};

// Async thunk to validate token and get user
export const validateAndSetUser = createAsyncThunk(
  'auth/validateAndSetUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await getCurrentUser();
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
      console.log('🔄 AuthSlice: Starting FCM token update...');
      const updatedUser = await saveUserFcmToken(fcmToken);
      
      console.log('🔄 AuthSlice: Dispatching setUser with updated user...');
      dispatch(setUser(updatedUser));
      
      console.log('✅ AuthSlice: FCM token update completed successfully');
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
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
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
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload as string || 'Authentication failed';
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