import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchProductByUuid, Product } from '@/services/productService';

interface FavoriteProduct {
    id: string;
    name: string;
    price: number;
    image: string;
}

interface ProductState {
    currentProduct: Product | null;
    isLoading: boolean;
    error: string | null;
    favorites: FavoriteProduct[];
}

const initialState: ProductState = {
    currentProduct: null,
    isLoading: false,
    error: null,
    favorites: JSON.parse(localStorage.getItem('favorites') || '[]')
};

export const fetchProduct = createAsyncThunk(
    'product/fetchProduct',
    async (uuid: string) => {
        const response = await fetchProductByUuid(uuid);
        return response.data;
    }
);

export const productSlice = createSlice({
    name: 'product',
    initialState,
    reducers: {
        addToFavorites: (state, action: PayloadAction<FavoriteProduct>) => {
            state.favorites.push(action.payload);
            localStorage.setItem('favorites', JSON.stringify(state.favorites));
        },
        removeFromFavorites: (state, action: PayloadAction<string>) => {
            state.favorites = state.favorites.filter(item => item.id !== action.payload);
            localStorage.setItem('favorites', JSON.stringify(state.favorites));
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProduct.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchProduct.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentProduct = action.payload;
                state.error = null;
            })
            .addCase(fetchProduct.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to fetch product';
            });
    },
});

export const { addToFavorites, removeFromFavorites } = productSlice.actions;
export default productSlice.reducer; 