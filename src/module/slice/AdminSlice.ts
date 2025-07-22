import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchFilteredOrders } from '@/services/orderService';
import { fetchProductCount } from '@/services/productService';
import { fetchAdminDashboardData } from '@/services/adminService';

interface AdminState {
    productCount: number;
    isDashboardLoading: boolean;
    totalOrderCount: number;
    totalUserCount: number;
    totalArticleCount: number;
}

const initialState: AdminState = {
    productCount: 0,
    isDashboardLoading: true,
    totalOrderCount: 0,
    totalUserCount: 0,
    totalArticleCount:0,
};



export const initializeAdminDashboard = createAsyncThunk(
    'admin/initializeDashboard',
    async (_, { dispatch }) => {
        try {
            // const dashboardData = await fetchProductCount(true);
            // const orderTotalNumber = await fetchFilteredOrders(1, 5, {
            //     orderNumber: null,
            //     orderStatus: null,
            //     userUuid: null,
            //     searchText: null
            // });
            const adminDashboardData = await fetchAdminDashboardData();

            return adminDashboardData;
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
                state.totalUserCount = action.payload.usersCount;
                state.totalArticleCount = action.payload.articleCount;
                state.isDashboardLoading = false;
            })
            .addCase(initializeAdminDashboard.rejected, (state) => {
                state.isDashboardLoading = false;
            });
    },
});

export default adminSlice.reducer; 