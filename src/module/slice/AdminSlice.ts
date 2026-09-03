import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchAdminDashboardData } from '@/services/adminService';

interface AdminState {
    productCount: number;
    isDashboardLoading: boolean;
    totalOrderCount: number;
    totalUserCount: number;
    totalArticleCount: number;
    pendingDoctorsCount: number;
    clinicsCount: number;
}

const initialState: AdminState = {
    productCount: 0,
    isDashboardLoading: true,
    totalOrderCount: 0,
    totalUserCount: 0,
    totalArticleCount: 0,
    pendingDoctorsCount: 0,
    clinicsCount: 0,
};

export const initializeAdminDashboard = createAsyncThunk(
    'admin/initializeDashboard',
    async () => {
        try {
            return await fetchAdminDashboardData();
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
                state.pendingDoctorsCount = action.payload.pendingDoctorsCount ?? 0;
                state.clinicsCount = action.payload.clinicsCount ?? 0;
                state.isDashboardLoading = false;
            })
            .addCase(initializeAdminDashboard.rejected, (state) => {
                state.isDashboardLoading = false;
            });
    },
});

export default adminSlice.reducer; 