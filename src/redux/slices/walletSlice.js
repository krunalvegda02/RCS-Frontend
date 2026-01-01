import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get, _post } from '../../helper/apiClient';

// Async thunks for wallet operations
export const createWalletRequest = createAsyncThunkHandler(
  'wallet/createWalletRequest',
  _post,
  'v1/wallet/request'
);

export const getUserWalletRequests = createAsyncThunkHandler(
  'wallet/getUserWalletRequests',
  _get,
  'v1/wallet/my-requests'
);

export const getUserProfile = createAsyncThunkHandler(
  'wallet/getUserProfile',
  _get,
  'v1/auth/profile'
);

const initialState = {
  walletRequests: [],
  userProfile: null,
  loading: {
    createRequest: false,
    requests: false,
    profile: false,
  },
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create Wallet Request
    builder
      .addCase(createWalletRequest.pending, (state) => {
        state.loading.createRequest = true;
        state.error = null;
      })
      .addCase(createWalletRequest.fulfilled, (state, action) => {
        state.loading.createRequest = false;
        state.walletRequests.unshift(action.payload.data);
      })
      .addCase(createWalletRequest.rejected, (state, action) => {
        state.loading.createRequest = false;
        state.error = action.payload;
      });

    // Get User Wallet Requests
    builder
      .addCase(getUserWalletRequests.pending, (state) => {
        state.loading.requests = true;
        state.error = null;
      })
      .addCase(getUserWalletRequests.fulfilled, (state, action) => {
        state.loading.requests = false;
        state.walletRequests = action.payload.requests;
      })
      .addCase(getUserWalletRequests.rejected, (state, action) => {
        state.loading.requests = false;
        state.error = action.payload;
      });

    // Get User Profile
    builder
      .addCase(getUserProfile.pending, (state) => {
        state.loading.profile = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.userProfile = action.payload.data;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = walletSlice.actions;
export default walletSlice.reducer;