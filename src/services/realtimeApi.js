import { createAsyncThunkHandler } from '../helper/createAsyncThunkHandler.jsx';
import { _get } from '../helper/apiClient.jsx';
import { buildUrlWithParams } from '../helper/helperFunction.js';

// Real-time API thunks using createAsyncThunkHandler
export const getRealTimeCampaignStats = createAsyncThunkHandler(
    'realtime/getCampaignStats',
    _get,
    (campaignId) => `realtime/campaign/${campaignId}/stats`
);

export const getLiveMessageFeed = createAsyncThunkHandler(
    'realtime/getMessageFeed',
    _get,
    ({ campaignId, limit = 50 }) => `realtime/campaign/${campaignId}/feed?limit=${limit}`
);

export const getRecentWebhookEvents = createAsyncThunkHandler(
    'realtime/getWebhookEvents',
    _get,
    ({ userId, limit = 20 }) => `realtime/user/${userId}/events?limit=${limit}`
);

export const getMessageStatusBreakdown = createAsyncThunkHandler(
    'realtime/getStatusBreakdown',
    _get,
    (campaignId) => `realtime/campaign/${campaignId}/breakdown`
);

export const getUserInteractionSummary = createAsyncThunkHandler(
    'realtime/getInteractionSummary',
    _get,
    (campaignId) => `realtime/campaign/${campaignId}/interactions`
);

// Campaign messages
export const getCampaignMessages = createAsyncThunkHandler(
    'campaigns/getMessages',
    _get,
    ({ campaignId, page = 1, limit = 20 }) => `v1/campaign-reports/campaign/${campaignId}/messages?page=${page}&limit=${limit}`
);

// Export all campaign messages (for Excel export)
export const getAllCampaignMessages = createAsyncThunkHandler(
    'campaigns/getAllMessages',
    _get,
    (campaignId) => `v1/campaign-reports/campaign/${campaignId}/messages/export`
);

// Export all campaigns (for Excel export)
export const getAllCampaigns = createAsyncThunkHandler(
    'campaigns/getAllCampaigns',
    _get,
    (userId) => `v1/campaign-reports/user/${userId}/export`
);