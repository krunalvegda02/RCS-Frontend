import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler.jsx';
import { _get, _post } from '../../helper/apiClient.jsx';

// Async thunks using helper functions
export const fetchDashboardStats = createAsyncThunkHandler(
  'dashboard/fetchStats',
  _get,
  (userId) => `dashboard/stats/${userId}`
);

export const fetchRecentOrders = createAsyncThunkHandler(
  'dashboard/fetchRecentOrders',
  _get,
  (userId) => `dashboard/recent-campaigns/${userId}`
);

export const addWalletRequest = createAsyncThunkHandler(
  'dashboard/addWalletRequest',
  _post,
  'dashboard/wallet-request'
);

const initialState = {
  stats: {
    totalCampaigns: 0,
    sendtoteltemplet: 0,
    totalMessages: 0,
    totalSuccessCount: 0,
    totalFailedCount: 0,
    pendingMessages: 0,
    sentMessages: 0,
    failedMessages: 0
  },
  recentOrders: [],
  loading: {
    stats: false,
    orders: false,
    wallet: false
  },
  error: {
    stats: null,
    orders: null,
    wallet: null
  }
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = { stats: null, orders: null, wallet: null };
    },
    resetDashboard: () => initialState
  },
  extraReducers: (builder) => {
    // Fetch stats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading.stats = true;
        state.error.stats = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        // Handle both response.data and response.data.data structures
        const data = action.payload.data || action.payload;
        state.stats = {
          ...initialState.stats,
          ...data
        };
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error.stats = action.payload;
      })
      
    // Fetch recent orders
      .addCase(fetchRecentOrders.pending, (state) => {
        state.loading.orders = true;
        state.error.orders = null;
      })
      .addCase(fetchRecentOrders.fulfilled, (state, action) => {
        state.loading.orders = false;
        // Handle both response.data and response.data.data structures
        const data = action.payload.data || action.payload;
        state.recentOrders = Array.isArray(data) ? data : [];
      })
      .addCase(fetchRecentOrders.rejected, (state, action) => {
        state.loading.orders = false;
        state.error.orders = action.payload;
      })
      
    // Add wallet request
      .addCase(addWalletRequest.pending, (state) => {
        state.loading.wallet = true;
        state.error.wallet = null;
      })
      .addCase(addWalletRequest.fulfilled, (state) => {
        state.loading.wallet = false;
      })
      .addCase(addWalletRequest.rejected, (state, action) => {
        state.loading.wallet = false;
        state.error.wallet = action.payload;
      });
  }
});

export const { clearErrors, resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;