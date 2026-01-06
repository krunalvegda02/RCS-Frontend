import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler.jsx';
import { _get, _post, _put, _delete } from '../../helper/apiClient.jsx';
import { buildUrlWithParams } from '../../helper/helperFunction.js';

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
  (payload) => buildUrlWithParams('admin/campaigns', payload || {})
);

export const getCampaignMessages = createAsyncThunkHandler(
  'campaigns/getMessages',
  _get,
  (payload) => {
    const { campaignId, ...params } = payload;
    return buildUrlWithParams(`admin/campaigns/${campaignId}/messages`, params);
  }
);

export const getAllCampaignMessagesForExport = createAsyncThunkHandler(
  'campaigns/getAllMessagesForExport',
  _get,
  (payload) => `admin/campaigns/${payload.campaignId}/messages/all`
);

export const getAllCampaignsForExport = createAsyncThunkHandler(
  'campaigns/getAllCampaignsForExport',
  _get,
  (payload) => buildUrlWithParams('admin/campaigns/export/all', payload || {})
);

// Contact batch thunks
export const uploadContactBatch = createAsyncThunkHandler(
  'campaigns/uploadBatch',
  _post,
  'campaigns/batches/upload'
);

export const processContactBatch = createAsyncThunkHandler(
  'campaigns/processBatch',
  _post,
  (payload) => `campaigns/batches/${payload.batchId}/process`
);

export const getContactBatchesWithData = createAsyncThunkHandler(
  'campaigns/getBatchesWithData',
  _get,
  (payload) => buildUrlWithParams(`campaigns/batches/${payload.campaignId}/with-data`, { page: payload.page || 1, limit: payload.limit || 10 })
);

export const getContactBatches = createAsyncThunkHandler(
  'campaigns/getBatches',
  _get,
  (payload) => buildUrlWithParams(`campaigns/batches/${payload.campaignId}`, { limit: payload.limit || 1000 })
);

export const getReachableUsers = createAsyncThunkHandler(
  'campaigns/getReachableUsers',
  _get,
  (payload) => buildUrlWithParams(`campaigns/batches/${payload.campaignId}/reachable-users`, { page: payload.page || 1, limit: payload.limit || 50, batchNumber: payload.batchNumber })
);

export const getAllContactsFromBatches = createAsyncThunkHandler(
  'campaigns/getAllContacts',
  _get,
  (payload) => buildUrlWithParams(`campaigns/batches/${payload.campaignId}/contacts`, { page: payload.page || 1, limit: payload.limit || 50 })
);

export const deleteContactFromBatch = createAsyncThunkHandler(
  'campaigns/deleteContact',
  _delete,
  (payload) => `campaigns/batches/${payload.campaignId}/contacts/${payload.phoneNumber}`
);

// Accurate count thunks
export const getAccurateCounts = createAsyncThunkHandler(
  'campaigns/getAccurateCounts',
  _get,
  (payload) => `campaigns/${payload.id}/accurate-counts`
);

export const syncContactBatches = createAsyncThunkHandler(
  'campaigns/syncBatches',
  _post,
  (payload) => `campaigns/${payload.id}/sync-batches`
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
  contactBatches: [],
  batchStats: { total: 0, rcsCapable: 0, notCapable: 0 },
  reachableUsers: [],
  reachableUsersPagination: { page: 1, limit: 50, total: 0, pages: 0 },
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
    setBatchStats: (state, action) => {
      state.batchStats = action.payload;
    },
    clearContactBatches: (state) => {
      state.contactBatches = [];
      state.batchStats = { total: 0, rcsCapable: 0, notCapable: 0 };
    },
    clearAllContacts: (state) => {
      state.allContacts = [];
    },
    clearReachableUsers: (state) => {
      state.reachableUsers = [];
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
        state.capabilityResults = action.payload; // Store full response with success, data, summary
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
      })

    // Upload Contact Batch
    builder
      .addCase(uploadContactBatch.fulfilled, (state, action) => {
        const newBatch = action.payload.data;
        const exists = state.contactBatches.some(batch => batch._id === newBatch._id);
        if (!exists) {
          state.contactBatches.unshift(newBatch);
        }
      })

    // Process Contact Batch
    builder
      .addCase(processContactBatch.fulfilled, (state, action) => {
        const updatedBatch = action.payload.data;
        const index = state.contactBatches.findIndex(batch => batch._id === updatedBatch._id);
        if (index !== -1) {
          state.contactBatches[index] = updatedBatch;
        }
      })

    // Get Contact Batches With Data
    builder
      .addCase(getContactBatchesWithData.fulfilled, (state, action) => {
        const newBatches = action.payload.data || [];
        state.contactBatches = newBatches;
        
        if (newBatches.length > 0) {
          const total = newBatches.reduce((sum, batch) => sum + batch.totalContacts, 0);
          const rcsCapable = newBatches.reduce((sum, batch) => {
            // Count from apiResponse if available (batch API)
            if (batch.apiResponse && batch.apiResponse.length > 0) {
              const totalReachable = batch.apiResponse.reduce((acc, chunk) => {
                return acc + (chunk.reachableUsers ? chunk.reachableUsers.length : 0);
              }, 0);
              return sum + totalReachable;
            }
            // Count from capabilityResults if available (sequential API)
            if (batch.capabilityResults && batch.capabilityResults.length > 0) {
              const capableCount = batch.capabilityResults.filter(r => r.isCapable).length;
              return sum + capableCount;
            }
            return sum + (batch.rcsCapableCount || 0);
          }, 0);
          const checkedCount = newBatches.reduce((sum, batch) => sum + (batch.processedContacts || batch.totalContacts), 0);
          const notCapable = checkedCount - rcsCapable;
          
          state.batchStats = { total, rcsCapable, notCapable };
        }
      })

    // Get Contact Batches
    builder
      .addCase(getContactBatches.fulfilled, (state, action) => {
        const newBatches = action.payload.data || [];
        state.contactBatches = newBatches;
        
        if (newBatches.length > 0) {
          const total = newBatches.reduce((sum, batch) => sum + batch.totalContacts, 0);
          const rcsCapable = newBatches.reduce((sum, batch) => sum + (batch.rcsCapableCount || 0), 0);
          const checkedCount = newBatches.reduce((sum, batch) => sum + (batch.processedContacts || 0), 0);
          const notCapable = checkedCount - rcsCapable;
          
          state.batchStats = { total, rcsCapable, notCapable };
        }
      })

    // Get Reachable Users
    builder
      .addCase(getReachableUsers.fulfilled, (state, action) => {
        state.reachableUsers = action.payload.data || [];
        state.reachableUsersPagination = action.payload.pagination || state.reachableUsersPagination;
      })

    // Get All Contacts From Batches
    builder
      .addCase(getAllContactsFromBatches.fulfilled, (state, action) => {
        state.allContacts = action.payload.data || [];
        state.contactsPagination = action.payload.pagination || state.contactsPagination;
      });
  },
});

export const { 
  clearError, 
  setCurrentCampaign, 
  clearCurrentCampaign, 
  clearCapabilityResults,
  clearCampaignMessages,
  setBatchStats,
  clearContactBatches,
  clearAllContacts,
  clearReachableUsers
} = campaignSlice.actions;
export default campaignSlice.reducer;