import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get, _post, _put, _delete } from '../../helper/apiClient';

// Async thunks for admin operations
export const createUser = createAsyncThunkHandler(
  'admin/createUser',
  _post,
  'auth/admin/create-user'
);

export const getAllUsers = createAsyncThunkHandler(
  'admin/getAllUsers',
  _get,
  (payload) => {
    const { page = 1, limit = 10, role, isActive, search } = payload || {};
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (role) params.append('role', role);
    if (isActive !== undefined) params.append('isActive', isActive);
    if (search) params.append('search', search);
    return `auth/admin/users?${params.toString()}`;
  }
);

export const updateUser = createAsyncThunkHandler(
  'admin/updateUser',
  _put,
  (payload) => `auth/admin/user/${payload.userId}`
);

export const updateWallet = createAsyncThunkHandler(
  'admin/updateWallet',
  _put,
  (payload) => `auth/admin/wallet/${payload.userId}`
);

export const updateUserPassword = createAsyncThunkHandler(
  'admin/updateUserPassword',
  _put,
  (payload) => `auth/admin/password/${payload.userId}`
);

export const getUserTransactionHistory = createAsyncThunkHandler(
  'admin/getUserTransactionHistory',
  _get,
  (payload) => {
    const { userId, page = 1, limit = 20 } = payload;
    return `auth/admin/transactions/${userId}?page=${page}&limit=${limit}`;
  }
);

export const getWalletRequests = createAsyncThunkHandler(
  'admin/getWalletRequests',
  _get,
  'v1/wallet/admin/requests'
);

export const approveWalletRequest = createAsyncThunkHandler(
  'admin/approveWalletRequest',
  _put,
  (payload) => `v1/wallet/admin/approve/${payload.requestId}`
);

export const rejectWalletRequest = createAsyncThunkHandler(
  'admin/rejectWalletRequest',
  _put,
  (payload) => `v1/wallet/admin/reject/${payload.requestId}`
);

export const deleteWalletRequest = createAsyncThunkHandler(
  'admin/deleteWalletRequest',
  _delete,
  (payload) => `v1/wallet/admin/delete/${payload.requestId}`
);

const initialState = {
  users: [],
  transactions: [],
  walletRequests: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  loading: {
    users: false,
    createUser: false,
    updateUser: false,
    updateWallet: false,
    updatePassword: false,
    transactions: false,
    walletRequests: false,
    approveRequest: false,
    rejectRequest: false,
    deleteRequest: false,
  },
  error: null,
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    totalWallet: 0,
  },
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUsersFilter: (state, action) => {
      state.filter = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Create User
    builder
      .addCase(createUser.pending, (state) => {
        state.loading.createUser = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading.createUser = false;
        // Add new user to the beginning of the list
        state.users.unshift(action.payload.data);
        // Update stats
        state.stats.totalUsers += 1;
        if (action.payload.data.isActive) {
          state.stats.activeUsers += 1;
        }
        state.stats.totalWallet += action.payload.data.wallet?.balance || 0;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading.createUser = false;
        state.error = action.payload;
      });

    // Get All Users
    builder
      .addCase(getAllUsers.pending, (state) => {
        state.loading.users = true;
        state.error = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading.users = false;
        state.users = action.payload.data;
        state.pagination = action.payload.pagination;
        
        // Calculate stats
        state.stats.totalUsers = action.payload.data.length;
        state.stats.activeUsers = action.payload.data.filter(u => u.isActive).length;
        state.stats.totalWallet = action.payload.data.reduce((sum, u) => sum + (u.wallet?.balance || 0), 0);
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading.users = false;
        state.error = action.payload;
      });

    // Update User
    builder
      .addCase(updateUser.pending, (state) => {
        state.loading.updateUser = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading.updateUser = false;
        // Update user in the list
        const userIndex = state.users.findIndex(u => u._id === action.payload.data._id);
        if (userIndex !== -1) {
          state.users[userIndex] = { ...state.users[userIndex], ...action.payload.data };
        }
        // Recalculate stats
        state.stats.activeUsers = state.users.filter(u => u.isActive).length;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading.updateUser = false;
        state.error = action.payload;
      });

    // Update Wallet
    builder
      .addCase(updateWallet.pending, (state) => {
        state.loading.updateWallet = true;
        state.error = null;
      })
      .addCase(updateWallet.fulfilled, (state, action) => {
        state.loading.updateWallet = false;
        // Update user in the list
        const userIndex = state.users.findIndex(u => u._id === action.payload.data.userId);
        if (userIndex !== -1) {
          state.users[userIndex].wallet = {
            ...state.users[userIndex].wallet,
            balance: action.payload.data.newBalance
          };
        }
        // Recalculate total wallet
        state.stats.totalWallet = state.users.reduce((sum, u) => sum + (u.wallet?.balance || 0), 0);
      })
      .addCase(updateWallet.rejected, (state, action) => {
        state.loading.updateWallet = false;
        state.error = action.payload;
      });

    // Update User Password
    builder
      .addCase(updateUserPassword.pending, (state) => {
        state.loading.updatePassword = true;
        state.error = null;
      })
      .addCase(updateUserPassword.fulfilled, (state) => {
        state.loading.updatePassword = false;
      })
      .addCase(updateUserPassword.rejected, (state, action) => {
        state.loading.updatePassword = false;
        state.error = action.payload;
      });

    // Get User Transaction History
    builder
      .addCase(getUserTransactionHistory.pending, (state) => {
        state.loading.transactions = true;
        state.error = null;
      })
      .addCase(getUserTransactionHistory.fulfilled, (state, action) => {
        state.loading.transactions = false;
        // Handle both direct transactions array and nested wallet.transactions
        state.transactions = action.payload.data.transactions || action.payload.data || [];
      })
      .addCase(getUserTransactionHistory.rejected, (state, action) => {
        state.loading.transactions = false;
        state.error = action.payload;
      });

    // Get Wallet Requests
    builder
      .addCase(getWalletRequests.pending, (state) => {
        state.loading.walletRequests = true;
        state.error = null;
      })
      .addCase(getWalletRequests.fulfilled, (state, action) => {
        state.loading.walletRequests = false;
        state.walletRequests = action.payload.requests;
      })
      .addCase(getWalletRequests.rejected, (state, action) => {
        state.loading.walletRequests = false;
        state.error = action.payload;
      });

    // Approve Wallet Request
    builder
      .addCase(approveWalletRequest.pending, (state) => {
        state.loading.approveRequest = true;
        state.error = null;
      })
      .addCase(approveWalletRequest.fulfilled, (state, action) => {
        state.loading.approveRequest = false;
        const requestId = action.meta.arg.requestId;
        const requestIndex = state.walletRequests.findIndex(r => r._id === requestId);
        if (requestIndex !== -1) {
          state.walletRequests[requestIndex].status = 'approved';
        }
      })
      .addCase(approveWalletRequest.rejected, (state, action) => {
        state.loading.approveRequest = false;
        state.error = action.payload;
      });

    // Reject Wallet Request
    builder
      .addCase(rejectWalletRequest.pending, (state) => {
        state.loading.rejectRequest = true;
        state.error = null;
      })
      .addCase(rejectWalletRequest.fulfilled, (state, action) => {
        state.loading.rejectRequest = false;
        const requestId = action.meta.arg.requestId;
        const requestIndex = state.walletRequests.findIndex(r => r._id === requestId);
        if (requestIndex !== -1) {
          state.walletRequests[requestIndex].status = 'rejected';
        }
      })
      .addCase(rejectWalletRequest.rejected, (state, action) => {
        state.loading.rejectRequest = false;
        state.error = action.payload;
      });

    // Delete Wallet Request
    builder
      .addCase(deleteWalletRequest.pending, (state) => {
        state.loading.deleteRequest = true;
        state.error = null;
      })
      .addCase(deleteWalletRequest.fulfilled, (state, action) => {
        state.loading.deleteRequest = false;
        const requestId = action.meta.arg.requestId;
        state.walletRequests = state.walletRequests.filter(r => r._id !== requestId);
      })
      .addCase(deleteWalletRequest.rejected, (state, action) => {
        state.loading.deleteRequest = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setUsersFilter } = adminSlice.actions;
export default adminSlice.reducer;