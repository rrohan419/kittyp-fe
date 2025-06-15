import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/module/store/store';
import { toast } from 'sonner';
import { Product } from '@/services/productService';
import { FavoriteProduct, fetchFavorites, addToFavorites, removeFromFavorites } from '@/services/favoritesService';

export interface FavoritesState {
  items: FavoriteProduct[];
  loading: boolean;
  error: string | null;
  totalElements: number;
  currentPage: number;
  totalPages: number;
  selectedCategory: string | null;
}

const initialState: FavoritesState = {
  items: [],
  loading: false,
  error: null,
  totalElements: 0,
  currentPage: 1,
  totalPages: 0,
  selectedCategory: null
};

// Async thunks
export const fetchFavoritesThunk = createAsyncThunk(
  'favorites/fetchFavorites',
  async ({ userUuid, page = 1, size = 10, category = null }: { userUuid: string; page?: number; size?: number; category?: string | null }, { rejectWithValue }) => {
    try {
      const pageNumber = Math.max(1, page || 1);
      const response = await fetchFavorites(userUuid, pageNumber, size, category || undefined);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const addToFavoritesThunk = createAsyncThunk(
  'favorites/addToFavorites',
  async ({ userUuid, product, category }: { userUuid: string; product: Product; category?: string }, { rejectWithValue }) => {
    try {
      await addToFavorites(userUuid, product.uuid, category);
      return product;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const removeFromFavoritesThunk = createAsyncThunk(
  'favorites/removeFromFavorites',
  async ({ userUuid, productUuid }: { userUuid: string; productUuid: string }, { rejectWithValue }) => {
    try {
      await removeFromFavorites(userUuid, productUuid);
      return productUuid;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Slice
const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    setCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
      state.currentPage = 1; // Reset page when category changes
    },
    clearFavorites: (state) => {
      state.items = [];
      state.totalElements = 0;
      state.currentPage = 1;
      state.totalPages = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Favorites
      .addCase(fetchFavoritesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavoritesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.models;
        state.totalElements = action.payload.totalElements;
        state.currentPage = action.payload.isFirst ? 1 : state.currentPage;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchFavoritesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error('Failed to fetch favorites');
      })
      // Add to Favorites
      .addCase(addToFavoritesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToFavoritesThunk.fulfilled, (state, action) => {
        state.loading = false;
        const favoriteProduct: FavoriteProduct = {
          uuid: action.payload.uuid,
          name: action.payload.name,
          description: action.payload.description,
          price: action.payload.price,
          category: action.payload.category,
          imageUrls: action.payload.productImageUrls,
          currency: action.payload.currency
        };
        state.items.push(favoriteProduct);
        state.totalElements += 1;
        toast.success('Added to favorites');
      })
      .addCase(addToFavoritesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error('Failed to add to favorites');
      })
      // Remove from Favorites
      .addCase(removeFromFavoritesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromFavoritesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.uuid !== action.payload);
        state.totalElements -= 1;
        toast.success('Removed from favorites');
      })
      .addCase(removeFromFavoritesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error('Failed to remove from favorites');
      });
  }
});

// Selectors
export const selectFavorites = (state: RootState) => state.favoritesReducer.items;
export const selectFavoritesLoading = (state: RootState) => state.favoritesReducer.loading;
export const selectFavoritesError = (state: RootState) => state.favoritesReducer.error;

// Memoized selectors
export const selectFavoritesPagination = createSelector(
  (state: RootState) => state.favoritesReducer.totalElements,
  (state: RootState) => state.favoritesReducer.currentPage,
  (state: RootState) => state.favoritesReducer.totalPages,
  (totalElements, currentPage, totalPages) => ({
    totalElements,
    currentPage,
    totalPages
  })
);

export const selectFavoritesCategory = (state: RootState) => state.favoritesReducer.selectedCategory;

export const { setCategory, clearFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer; 