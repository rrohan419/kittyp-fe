import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  createDoctorSmartPhrase,
  deleteDoctorSmartPhrase,
  fetchDoctorSmartPhrases,
  updateDoctorSmartPhrase,
  type DoctorSmartPhrase,
} from '@/services/doctorSmartPhraseService';
import { clearUser } from './AuthSlice';
import type { RootState } from '../store/store';

type DoctorSmartPhrasesState = {
  doctorUuid: string | null;
  phrases: DoctorSmartPhrase[];
  loaded: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
};

const initialState: DoctorSmartPhrasesState = {
  doctorUuid: null,
  phrases: [],
  loaded: false,
  loading: false,
  saving: false,
  error: null,
};

export const loadDoctorSmartPhrases = createAsyncThunk<
  DoctorSmartPhrase[],
  string,
  { state: RootState; rejectValue: string }
>(
  'doctorSmartPhrases/load',
  async (_doctorUuid, { rejectWithValue }) => {
    try {
      return await fetchDoctorSmartPhrases();
    } catch {
      return rejectWithValue('Could not load your saved phrases. Please try again.');
    }
  },
  {
    condition: (doctorUuid, { getState }) => {
      const state = getState().doctorSmartPhrases;
      return !(state.doctorUuid === doctorUuid && (state.loaded || state.loading));
    },
  }
);

type PhraseMutation = { doctorUuid: string; phraseText: string };
type PhraseUpdate = PhraseMutation & { uuid: string };
type PhraseDelete = { doctorUuid: string; uuid: string };

export const createSmartPhrase = createAsyncThunk<
  DoctorSmartPhrase,
  PhraseMutation,
  { rejectValue: string }
>(
  'doctorSmartPhrases/create',
  async ({ phraseText }, { rejectWithValue }) => {
    try {
      return await createDoctorSmartPhrase(phraseText);
    } catch {
      return rejectWithValue('Could not save this phrase. Please try again.');
    }
  }
);

export const updateSmartPhrase = createAsyncThunk<
  DoctorSmartPhrase,
  PhraseUpdate,
  { rejectValue: string }
>(
  'doctorSmartPhrases/update',
  async ({ uuid, phraseText }, { rejectWithValue }) => {
    try {
      return await updateDoctorSmartPhrase(uuid, phraseText);
    } catch {
      return rejectWithValue('Could not update this phrase. Please try again.');
    }
  }
);

export const deleteSmartPhrase = createAsyncThunk<
  PhraseDelete,
  PhraseDelete,
  { rejectValue: string }
>(
  'doctorSmartPhrases/delete',
  async ({ uuid, doctorUuid }, { rejectWithValue }) => {
    try {
      await deleteDoctorSmartPhrase(uuid);
      return { uuid, doctorUuid };
    } catch {
      return rejectWithValue('Could not delete this phrase. Please try again.');
    }
  }
);

const doctorSmartPhrasesSlice = createSlice({
  name: 'doctorSmartPhrases',
  initialState,
  reducers: {
    clearSmartPhraseError(state) {
      state.error = null;
    },
    setSmartPhraseError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    clearDoctorSmartPhrases() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(clearUser, () => initialState)
      .addCase(loadDoctorSmartPhrases.pending, (state, action) => {
        if (state.doctorUuid !== action.meta.arg) {
          state.phrases = [];
          state.loaded = false;
        }
        state.doctorUuid = action.meta.arg;
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDoctorSmartPhrases.fulfilled, (state, action) => {
        if (state.doctorUuid !== action.meta.arg) return;
        state.phrases = action.payload;
        state.loaded = true;
        state.loading = false;
      })
      .addCase(loadDoctorSmartPhrases.rejected, (state, action) => {
        if (state.doctorUuid !== action.meta.arg) return;
        state.loading = false;
        state.error = action.payload || 'Could not load your saved phrases. Please try again.';
      })
      .addCase(createSmartPhrase.pending, (state, action) => {
        if (state.doctorUuid === action.meta.arg.doctorUuid) {
          state.saving = true;
          state.error = null;
        }
      })
      .addCase(createSmartPhrase.fulfilled, (state, action) => {
        if (state.doctorUuid !== action.meta.arg.doctorUuid) return;
        state.phrases.unshift(action.payload);
        state.saving = false;
      })
      .addCase(createSmartPhrase.rejected, (state, action) => {
        if (state.doctorUuid !== action.meta.arg.doctorUuid) return;
        state.saving = false;
        state.error = action.payload || 'Could not save this phrase. Please try again.';
      })
      .addCase(updateSmartPhrase.pending, (state, action) => {
        if (state.doctorUuid === action.meta.arg.doctorUuid) {
          state.saving = true;
          state.error = null;
        }
      })
      .addCase(updateSmartPhrase.fulfilled, (state, action) => {
        if (state.doctorUuid !== action.meta.arg.doctorUuid) return;
        state.phrases = state.phrases.map((phrase) =>
          phrase.uuid === action.payload.uuid ? action.payload : phrase
        );
        state.saving = false;
      })
      .addCase(updateSmartPhrase.rejected, (state, action) => {
        if (state.doctorUuid !== action.meta.arg.doctorUuid) return;
        state.saving = false;
        state.error = action.payload || 'Could not update this phrase. Please try again.';
      })
      .addCase(deleteSmartPhrase.pending, (state, action) => {
        if (state.doctorUuid === action.meta.arg.doctorUuid) {
          state.saving = true;
          state.error = null;
        }
      })
      .addCase(deleteSmartPhrase.fulfilled, (state, action) => {
        if (state.doctorUuid !== action.meta.arg.doctorUuid) return;
        state.phrases = state.phrases.filter((phrase) => phrase.uuid !== action.payload.uuid);
        state.saving = false;
      })
      .addCase(deleteSmartPhrase.rejected, (state, action) => {
        if (state.doctorUuid !== action.meta.arg.doctorUuid) return;
        state.saving = false;
        state.error = action.payload || 'Could not delete this phrase. Please try again.';
      });
  },
});

export const {
  clearSmartPhraseError,
  setSmartPhraseError,
  clearDoctorSmartPhrases,
} = doctorSmartPhrasesSlice.actions;
export default doctorSmartPhrasesSlice.reducer;
