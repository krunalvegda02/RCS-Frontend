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

// Razorpay payment thunks
export const createPaymentOrder = createAsyncThunkHandler(
  'wallet/createPaymentOrder',
  _post,
  'v1/payment/create-order'
);

export const verifyPayment = createAsyncThunkHandler(
  'wallet/verifyPayment',
  _post,
  'v1/payment/verify'
);

export const getPaymentHistory = createAsyncThunkHandler(
  'wallet/getPaymentHistory',
  _get,
  'v1/payment/history'
);

const initialState = {
  walletRequests: [],
  paymentHistory: [],
  userProfile: null,
  perMessageCharge: null,
  loading: {
    createRequest: false,
    requests: false,
    profile: false,
    createOrder: false,
    verifyPayment: false,
    paymentHistory: false,
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
        // Save perMessageCharge to state
        state.perMessageCharge = action.payload.data?.perMessageCharge || null;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error = action.payload;
      });

    // Create Payment Order
    builder
      .addCase(createPaymentOrder.pending, (state) => {
        state.loading.createOrder = true;
        state.error = null;
      })
      .addCase(createPaymentOrder.fulfilled, (state) => {
        state.loading.createOrder = false;
      })
      .addCase(createPaymentOrder.rejected, (state, action) => {
        state.loading.createOrder = false;
        state.error = action.payload;
      });

    // Verify Payment
    builder
      .addCase(verifyPayment.pending, (state) => {
        state.loading.verifyPayment = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading.verifyPayment = false;
        // Update user profile balance after successful payment
        if (state.userProfile && action.payload.data?.newBalance !== undefined) {
          state.userProfile.wallet.balance = action.payload.data.newBalance;
        }
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading.verifyPayment = false;
        state.error = action.payload;
      });

    // Get Payment History
    builder
      .addCase(getPaymentHistory.pending, (state) => {
        state.loading.paymentHistory = true;
        state.error = null;
      })
      .addCase(getPaymentHistory.fulfilled, (state, action) => {
        state.loading.paymentHistory = false;
        state.paymentHistory = action.payload.data?.payments || [];
      })
      .addCase(getPaymentHistory.rejected, (state, action) => {
        state.loading.paymentHistory = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = walletSlice.actions;
export default walletSlice.reducer;