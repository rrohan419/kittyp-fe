import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchFilteredOrders, OrderFilterRequest, Order, OrderApiResponse, fetchSuccessfullOrderCount } from '@/services/orderService';

interface OrderState {
  totalOrderCount: number;
  orders: Order[];
  currentPage: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  isLoading: boolean;
  isLoadingOrders: boolean;
  error: string | null;
}

const initialState: OrderState = {
  totalOrderCount: 0,
  orders: [],
  currentPage: 1,
  totalPages: 0,
  isFirst: true,
  isLast: true,
  isLoading: false,
  isLoadingOrders: false,
  error: null,
};

export const fetchTotalOrderCount = createAsyncThunk(
  'order/fetchTotalCount',
  async () => {
    try {
            
      const response = await fetchSuccessfullOrderCount();
      return response.data;
    } catch (error) {
      console.error('Error fetching total order count:', error);
      throw error;
    }
  }
);

export const fetchOrders = createAsyncThunk(
  'order/fetchOrders',
  async ({ page, size, filters }: { page: number; size: number; filters: OrderFilterRequest }) => {
    try {
      const response: OrderApiResponse = await fetchFilteredOrders(page, size, filters);
      return {
        orders: response.data.models,
        totalElements: response.data.totalElements,
        totalPages: response.data.totalPages,
        isFirst: response.data.isFirst,
        isLast: response.data.isLast,
        currentPage: page
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearOrderCount: (state) => {
      state.totalOrderCount = 0;
      state.error = null;
    },
    clearOrders: (state) => {
      state.orders = [];
      state.currentPage = 1;
      state.totalPages = 0;
      state.isFirst = true;
      state.isLast = true;
      state.error = null;
    },
    setOrderCount: (state, action) => {
      state.totalOrderCount = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    updateOrderStatus: (state, action) => {
      const { orderNumber, status } = action.payload;
      const order = state.orders.find(o => o.orderNumber === orderNumber);
      if (order) {
        order.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Total count actions
      .addCase(fetchTotalOrderCount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTotalOrderCount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.totalOrderCount = action.payload;
        state.error = null;
      })
      .addCase(fetchTotalOrderCount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch order count';
        state.totalOrderCount = 0;
      })
      // Orders list actions
      .addCase(fetchOrders.pending, (state) => {
        state.isLoadingOrders = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoadingOrders = false;
        state.orders = action.payload.orders;
        state.totalOrderCount = action.payload.totalElements;
        state.totalPages = action.payload.totalPages;
        state.isFirst = action.payload.isFirst;
        state.isLast = action.payload.isLast;
        state.currentPage = action.payload.currentPage;
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoadingOrders = false;
        state.error = action.error.message || 'Failed to fetch orders';
        state.orders = [];
      });
  },
});

export const { 
  clearOrderCount, 
  clearOrders, 
  setOrderCount, 
  setCurrentPage, 
  updateOrderStatus 
} = orderSlice.actions;
export default orderSlice.reducer; 