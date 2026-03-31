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
// Campaign messages
export const getCampaignMessages = createAsyncThunkHandler(
    'campaigns/getMessages',
    _get,
    (params) => {
        const { campaignId, ...queryParams } = params;
        return buildUrlWithParams(`v1/campaign-reports/campaign/${campaignId}/messages`, {
            page: 1,
            limit: 20,
            ...queryParams
        });
    }
);

// Export all campaign messages (for Excel export)
export const getAllCampaignMessages = createAsyncThunkHandler(
    'campaigns/getAllMessages',
    _get,
    (campaignId) => {
        // Handle both string and object inputs
        const id = typeof campaignId === 'object' && campaignId !== null 
            ? (campaignId.campaignId || campaignId.id || campaignId)
            : campaignId;
        return `v1/campaign-reports/campaign/${id}/messages/export`;
    },
    false // Not multipart
);

// Export all campaigns (for Excel export)
export const getAllCampaigns = createAsyncThunkHandler(
    'campaigns/getAllCampaigns',
    _get,
    (userId) => `v1/campaign-reports/user/${userId}/export`
);