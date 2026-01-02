import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler.jsx';
import { _get, _post, _put, _delete } from '../../helper/apiClient.jsx';

// Campaign thunks
export const getAllCampaigns = createAsyncThunkHandler(
  'campaigns/getAll',
  _get,
  'campaigns'
);

export const getCampaignById = createAsyncThunkHandler(
  'campaigns/getById',
  _get,
  (payload) => `campaigns/${payload.id}`
);

export const createCampaign = createAsyncThunkHandler(
  'campaigns/create',
  _post,
  'campaigns'
);

export const sendBulkMessage = createAsyncThunkHandler(
  'campaigns/sendBulk',
  _post,
  'campaigns/send-bulk'
);

export const checkCapability = createAsyncThunkHandler(
  'campaigns/checkCapability',
  _post,
  'campaigns/check-capability'
);

export const getCampaignStats = createAsyncThunkHandler(
  'campaigns/getStats',
  _get,
  (payload) => `campaigns/${payload.id}/stats`
);

export const pauseCampaign = createAsyncThunkHandler(
  'campaigns/pause',
  _post,
  (payload) => `campaigns/${payload.id}/pause`
);

export const startCampaign = createAsyncThunkHandler(
  'campaigns/start',
  _post,
  (payload) => `campaigns/${payload.id}/start`
);

export const deleteCampaign = createAsyncThunkHandler(
  'campaigns/delete',
  _delete,
  (payload) => `campaigns/${payload.id}`
);

// Admin campaign thunks
export const getAllCampaignsForAdmin = createAsyncThunkHandler(
  'campaigns/getAllForAdmin',
  _get,
  'admin/campaigns'
);

export const getCampaignMessages = createAsyncThunkHandler(
  'campaigns/getMessages',
  _get,
  (payload) => `admin/campaigns/${payload.campaignId}/messages?page=${payload.page || 1}&limit=${payload.limit || 20}`
);

const initialState = {
  campaigns: [],
  adminCampaigns: [],
  currentCampaign: null,
  campaignMessages: [],
  loading: {
    campaigns: false,
    adminCampaigns: false,
    messages: false,
    sending: false,
  },
  error: null,
  messageError: null,
  capabilityResults: [],
  stats: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  messagesPagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
};

const campaignSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.messageError = null;
    },
    setCurrentCampaign: (state, action) => {
      state.currentCampaign = action.payload;
    },
    clearCurrentCampaign: (state) => {
      state.currentCampaign = null;
    },
    clearCapabilityResults: (state) => {
      state.capabilityResults = [];
    },
    clearCampaignMessages: (state) => {
      state.campaignMessages = [];
    },
  },
  extraReducers: (builder) => {
    // Get All Campaigns
    builder
      .addCase(getAllCampaigns.pending, (state) => {
        state.loading.campaigns = true;
        state.error = null;
      })
      .addCase(getAllCampaigns.fulfilled, (state, action) => {
        state.loading.campaigns = false;
        state.campaigns = action.payload.data;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(getAllCampaigns.rejected, (state, action) => {
        state.loading.campaigns = false;
        state.error = action.payload;
      })

    // Get All Campaigns For Admin
    builder
      .addCase(getAllCampaignsForAdmin.pending, (state) => {
        state.loading.adminCampaigns = true;
        state.error = null;
      })
      .addCase(getAllCampaignsForAdmin.fulfilled, (state, action) => {
        state.loading.adminCampaigns = false;
        state.adminCampaigns = action.payload.data;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(getAllCampaignsForAdmin.rejected, (state, action) => {
        state.loading.adminCampaigns = false;
        state.error = action.payload;
      })

    // Get Campaign Messages
    builder
      .addCase(getCampaignMessages.pending, (state) => {
        state.loading.messages = true;
        state.error = null;
      })
      .addCase(getCampaignMessages.fulfilled, (state, action) => {
        state.loading.messages = false;
        state.campaignMessages = action.payload.data;
        state.messagesPagination = action.payload.pagination || state.messagesPagination;
      })
      .addCase(getCampaignMessages.rejected, (state, action) => {
        state.loading.messages = false;
        state.error = action.payload;
      })

    // Get Campaign By ID
    builder
      .addCase(getCampaignById.pending, (state) => {
        state.loading.campaigns = true;
        state.error = null;
      })
      .addCase(getCampaignById.fulfilled, (state, action) => {
        state.loading.campaigns = false;
        state.currentCampaign = action.payload.data;
      })
      .addCase(getCampaignById.rejected, (state, action) => {
        state.loading.campaigns = false;
        state.error = action.payload;
      })

    // Create Campaign
    builder
      .addCase(createCampaign.pending, (state) => {
        state.loading.campaigns = true;
        state.error = null;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.loading.campaigns = false;
        state.campaigns.unshift(action.payload.data);
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.loading.campaigns = false;
        state.error = action.payload;
      })

    // Send Bulk Message
    builder
      .addCase(sendBulkMessage.pending, (state) => {
        state.loading.sending = true;
        state.messageError = null;
      })
      .addCase(sendBulkMessage.fulfilled, (state, action) => {
        state.loading.sending = false;
        state.campaigns.unshift(action.payload.data);
      })
      .addCase(sendBulkMessage.rejected, (state, action) => {
        state.loading.sending = false;
        state.messageError = action.payload;
      })

    // Check Capability
    builder
      .addCase(checkCapability.pending, (state) => {
        state.loading.campaigns = true;
        state.error = null;
      })
      .addCase(checkCapability.fulfilled, (state, action) => {
        state.loading.campaigns = false;
        state.capabilityResults = action.payload.data;
      })
      .addCase(checkCapability.rejected, (state, action) => {
        state.loading.campaigns = false;
        state.error = action.payload;
      })

    // Get Campaign Stats
    builder
      .addCase(getCampaignStats.fulfilled, (state, action) => {
        state.stats = action.payload.data;
      })

    // Pause Campaign
    builder
      .addCase(pauseCampaign.fulfilled, (state, action) => {
        const index = state.campaigns.findIndex(c => c._id === action.payload.data._id);
        if (index !== -1) {
          state.campaigns[index] = action.payload.data;
        }
        if (state.currentCampaign?._id === action.payload.data._id) {
          state.currentCampaign = action.payload.data;
        }
      })

    // Start Campaign
    builder
      .addCase(startCampaign.fulfilled, (state, action) => {
        const index = state.campaigns.findIndex(c => c._id === action.payload.data._id);
        if (index !== -1) {
          state.campaigns[index] = action.payload.data;
        }
        if (state.currentCampaign?._id === action.payload.data._id) {
          state.currentCampaign = action.payload.data;
        }
      })

    // Delete Campaign
    builder
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.campaigns = state.campaigns.filter(c => c._id !== action.meta.arg.id);
      });
  },
});

export const { 
  clearError, 
  setCurrentCampaign, 
  clearCurrentCampaign, 
  clearCapabilityResults,
  clearCampaignMessages 
} = campaignSlice.actions;
export default campaignSlice.reducer;