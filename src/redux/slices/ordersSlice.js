import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler.jsx';
import { _get, _delete, _post } from '../../helper/apiClient.jsx';
import { 
  getRealTimeCampaignStats, 
  getLiveMessageFeed, 
  getMessageStatusBreakdown, 
  getUserInteractionSummary,
  getCampaignMessages,
  getAllCampaignMessages,
  getAllCampaigns
} from '../../services/realtimeApi';

// Async thunks for orders using helper functions
export const fetchOrders = createAsyncThunkHandler(
  'orders/fetchOrders',
  _get,
  (payload) => {
    const { userId } = payload;
    return `v1/campaign-reports/user/${userId}`;
  }
);

export const deleteOrder = createAsyncThunkHandler(
  'orders/deleteOrder',
  _delete,
  (payload) => `v1/campaign-reports/${payload}`
);

export const syncCampaignStats = createAsyncThunkHandler(
  'orders/syncCampaignStats',
  _post,
  (payload) => `v1/campaigns/${payload.campaignId}/sync-stats`
);

// Export the real-time thunks from realtimeApi
export const fetchRealTimeStats = getRealTimeCampaignStats;
export const fetchLiveMessageFeed = getLiveMessageFeed;
export const fetchMessageBreakdown = getMessageStatusBreakdown;
export const fetchUserInteractions = getUserInteractionSummary;
export const fetchCampaignMessages = getCampaignMessages;
export const fetchAllCampaignMessages = getAllCampaignMessages;
export const fetchAllCampaigns = getAllCampaigns;

const initialState = {
  orders: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  selectedOrder: null,
  orderDetails: null,
  campaignMessages: [],
  messagesPagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  realTimeStats: {},
  liveMessageFeeds: {},
  messageBreakdowns: {},
  userInteractions: {},
  liveEvents: [],
  socketConnected: false,
  loading: {
    orders: false,
    realTimeStats: false,
    messages: false,
    delete: false,
    syncStats: false,
  },
  error: {
    orders: null,
    realTimeStats: null,
    messages: null,
    delete: null,
    syncStats: null,
  }
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setSelectedOrder: (state, action) => {
      state.selectedOrder = action.payload;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
      state.orderDetails = null;
    },
    addLiveEvent: (state, action) => {
      state.liveEvents = [action.payload, ...state.liveEvents.slice(0, 19)];
    },
    updateRealTimeStats: (state, action) => {
      const { campaignId, stats } = action.payload;
      state.realTimeStats[campaignId] = {
        ...state.realTimeStats[campaignId],
        ...stats,
        lastUpdated: new Date().toISOString()
      };
    },
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload;
    },
    updateCampaignFromSocket: (state, action) => {
      const { campaignId, status, completedAt } = action.payload;
      // Update the order in the orders array if it exists
      const orderIndex = state.orders.findIndex(order => order._id === campaignId);
      if (orderIndex !== -1) {
        state.orders[orderIndex] = {
          ...state.orders[orderIndex],
          status: status || state.orders[orderIndex].status,
          completedAt: completedAt || state.orders[orderIndex].completedAt,
          lastSocketUpdate: new Date().toISOString()
        };
      }
      
      // Also update selected order if it matches
      if (state.selectedOrder && state.selectedOrder._id === campaignId) {
        state.selectedOrder = {
          ...state.selectedOrder,
          status: status || state.selectedOrder.status,
          completedAt: completedAt || state.selectedOrder.completedAt,
          lastSocketUpdate: new Date().toISOString()
        };
      }
    },
    clearErrors: (state) => {
      state.error = {
        orders: null,
        realTimeStats: null,
        messages: null,
        delete: null,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading.orders = true;
        state.error.orders = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading.orders = false;
        state.orders = action.payload.data || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading.orders = false;
        state.error.orders = action.payload;
      })

    // Delete order
    builder
      .addCase(deleteOrder.pending, (state) => {
        state.loading.delete = true;
        state.error.delete = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.orders = state.orders.filter(order => order._id !== action.payload);
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading.delete = false;
        state.error.delete = action.payload;
      })

    // Real-time stats
    builder
      .addCase(fetchRealTimeStats.pending, (state) => {
        state.loading.realTimeStats = true;
        state.error.realTimeStats = null;
      })
      .addCase(fetchRealTimeStats.fulfilled, (state, action) => {
        state.loading.realTimeStats = false;
        // Extract campaignId from the URL in the action meta
        const campaignId = action.meta.arg;
        state.realTimeStats[campaignId] = {
          ...action.payload.data,
          lastUpdated: new Date().toISOString()
        };
      })
      .addCase(fetchRealTimeStats.rejected, (state, action) => {
        state.loading.realTimeStats = false;
        state.error.realTimeStats = action.payload;
      })

    // Live message feed
    builder
      .addCase(fetchLiveMessageFeed.fulfilled, (state, action) => {
        const campaignId = action.meta.arg.campaignId;
        state.liveMessageFeeds[campaignId] = action.payload.data;
      })

    // Message breakdown
    builder
      .addCase(fetchMessageBreakdown.fulfilled, (state, action) => {
        const campaignId = action.meta.arg;
        state.messageBreakdowns[campaignId] = action.payload.data;
      })

    // User interactions
    builder
      .addCase(fetchUserInteractions.fulfilled, (state, action) => {
        const campaignId = action.meta.arg;
        state.userInteractions[campaignId] = action.payload.data;
      })

    // Campaign messages
    builder
      .addCase(fetchCampaignMessages.pending, (state) => {
        state.loading.messages = true;
        state.error.messages = null;
      })
      .addCase(fetchCampaignMessages.fulfilled, (state, action) => {
        state.loading.messages = false;
        state.campaignMessages = action.payload.data || [];
        state.messagesPagination = action.payload.pagination || {};
      })
      .addCase(fetchCampaignMessages.rejected, (state, action) => {
        state.loading.messages = false;
        state.error.messages = action.payload;
      })

    // Sync campaign stats
    builder
      .addCase(syncCampaignStats.pending, (state, action) => {
        state.loading.syncStats = action.meta.arg.campaignId;
        state.error.syncStats = null;
      })
      .addCase(syncCampaignStats.fulfilled, (state, action) => {
        state.loading.syncStats = false;
        const campaignId = action.meta.arg.campaignId;
        // Update the campaign in orders array with fresh stats
        const orderIndex = state.orders.findIndex(order => order._id === campaignId);
        if (orderIndex !== -1 && action.payload.data) {
          state.orders[orderIndex] = {
            ...state.orders[orderIndex],
            ...action.payload.data,
            lastStatsUpdate: new Date().toISOString()
          };
        }
      })
      .addCase(syncCampaignStats.rejected, (state, action) => {
        state.loading.syncStats = false;
        state.error.syncStats = action.payload;
      });
  },
});

export const { 
  setSelectedOrder, 
  clearSelectedOrder, 
  addLiveEvent, 
  updateRealTimeStats,
  setSocketConnected,
  updateCampaignFromSocket,
  clearErrors 
} = ordersSlice.actions;

export default ordersSlice.reducer;