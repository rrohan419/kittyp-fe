import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchFilteredOrders } from '@/services/orderService';
import { fetchProductCount } from '@/services/productService';

interface AdminState {
    productCount: number;
    isDashboardLoading: boolean;
    totalOrderCount: number;
}

const initialState: AdminState = {
    productCount: 0,
    isDashboardLoading: true,
    totalOrderCount: 0,
};

export const initializeAdminDashboard = createAsyncThunk(
    'admin/initializeDashboard',
    async (_, { dispatch }) => {
        try {
            const dashboardData = await fetchProductCount(true);
            const orderTotalNumber = await fetchFilteredOrders(1, 5, {
                orderNumber: null,
                orderStatus: null,
                userUuid: null
            });
            
            return {
                productCount: dashboardData.data,
                totalOrders: orderTotalNumber.data.totalElements
            };
        } catch (error) {
            console.error('Failed to initialize admin dashboard:', error);
            throw error;
        }
    }
);

export const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(initializeAdminDashboard.pending, (state) => {
                state.isDashboardLoading = true;
            })
            .addCase(initializeAdminDashboard.fulfilled, (state, action) => {
                state.productCount = action.payload.productCount;
                state.totalOrderCount = action.payload.totalOrders;
                state.isDashboardLoading = false;
            })
            .addCase(initializeAdminDashboard.rejected, (state) => {
                state.isDashboardLoading = false;
            });
    },
});

export default adminSlice.reducer; 