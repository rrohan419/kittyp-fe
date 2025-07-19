import { deleteProductAdmin, fetchFilteredProducts, FetchProducts, Product, ProductApiResponse, ProductDto, updateProductAdmin } from "@/services/productService";
import { createAsyncThunk, createSlice, isRejectedWithValue, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "sonner";

interface AdminProductState {
    products: Product[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    isLoading: boolean;
    isFirst: boolean;
    isLast: boolean;
    error: string | null;
}

const initialState: AdminProductState = {
    products: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 1,
    isLoading: false,
    isFirst: null,
    isLast: null,
    error: null,
};

export const fetchAdminProducts = createAsyncThunk('adminProduct/fetch',
    async (params: FetchProducts, { rejectWithValue }) => {
        try {
            const response = await fetchFilteredProducts(params);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'failed to fetch products!');
        }
    }
)

export const updateAdminProduct = createAsyncThunk(
    'adminProduct/update',
    async (
        { productUuid, productUpdateDTo }: { productUuid: string; productUpdateDTo: ProductDto },
        { rejectWithValue }
    ) => {
        try {
            const response = await updateProductAdmin(productUuid, productUpdateDTo);
            toast.success("Product updated");
            return response.data as Product; // return updated product
        } catch (error: any) {
            toast.warning("Failed to update Product");
            return rejectWithValue(error.message || "Failed to update Product");
        }
    }
);


export const deleteAdminProduct = createAsyncThunk('adminProduct/delete',
    async ({productUuid}: { productUuid: string; }) => {
        try {
            await deleteProductAdmin(productUuid);
            toast.success("Product deleted");
            return productUuid;

        } catch (err) {
            toast.error("Failed to delete product");
            // return isRejectedWithValue("Failed to delete product");
        }
    }
)

export const adminProductSlice = createSlice({
    name: 'adminProducts',
    initialState,
    reducers: {
        setCurrentPage(state, action: PayloadAction<number>) {
            state.currentPage = action.payload;
        },
        updateProduct(state, action: PayloadAction<Product>) {
            const index = state.products.findIndex(product => product.uuid === action.payload.uuid);
            if (index !== -1) {
                state.products[index] = action.payload;
            }
        },
        deleteProduct(state, action: PayloadAction<string>) {
            state.products = state.products.filter(product => product.uuid !== action.payload);
        }

    },
    extraReducers: (builder) => {
        builder
            // Fetch Admin Products
            .addCase(fetchAdminProducts.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAdminProducts.fulfilled, (state, action: PayloadAction<ProductApiResponse>) => {
                state.products = action.payload.data.models;
                state.totalElements = action.payload.data.totalElements;
                state.totalPages = action.payload.data.totalPages;
                state.isFirst = action.payload.data.isFirst;
                state.isLast = action.payload.data.isLast;
                state.isLoading = false;
            })
            .addCase(fetchAdminProducts.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Delete Admin Product
            .addCase(deleteAdminProduct.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteAdminProduct.fulfilled, (state, action: PayloadAction<string>) => {
                state.products = state.products.filter(product => product.uuid !== action.payload);
                state.isLoading = false;
                toast.success("Product deleted");
              })
              .addCase(deleteAdminProduct.rejected, (state, action) => {
                state.isLoading = false;
                toast.error(action.payload as string || "Failed to delete product");
              })

            // Update Admin Product
            .addCase(updateAdminProduct.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateAdminProduct.fulfilled, (state, action: PayloadAction<Product>) => {
                const index = state.products.findIndex(product => product.uuid === action.payload.uuid);
                if (index !== -1) {
                    state.products[index] = action.payload;
                }
                state.isLoading = false;
                toast.success("Product updated");
            })
            .addCase(updateAdminProduct.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                toast.error(action.payload as string || "Failed to update product");
            });
    }

});

export const { setCurrentPage, updateProduct, deleteProduct } = adminProductSlice.actions;
export default adminProductSlice.reducer;