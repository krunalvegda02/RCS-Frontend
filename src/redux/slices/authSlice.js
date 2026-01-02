import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler.jsx';
import { _get, _post, _put } from '../../helper/apiClient.jsx';
import { buildUrlWithParams } from '../../helper/helperFunction.js';

// Auth thunks
export const loginUser = createAsyncThunkHandler(
  'auth/login',
  _post,
  'auth/login'
);

export const registerUser = createAsyncThunkHandler(
  'auth/register',
  _post,
  'auth/register'
);

export const refreshToken = createAsyncThunkHandler(
  'auth/refreshToken',
  _post,
  'auth/refresh-token'
);

export const fetchProfile = createAsyncThunkHandler(
  'auth/fetchProfile',
  _get,
  'auth/profile'
);

export const updateProfile = createAsyncThunkHandler(
  'auth/updateProfile',
  _put,
  'auth/profile'
);

export const updateJioConfig = createAsyncThunkHandler(
  'auth/updateJioConfig',
  _put,
  'auth/jio-config'
);

export const fetchJioConfig = createAsyncThunkHandler(
  'auth/fetchJioConfig',
  _get,
  'auth/jio-config'
);

// Admin thunks
export const createUser = createAsyncThunkHandler(
  'auth/createUser',
  _post,
  'auth/admin/create-user'
);

export const fetchAllUsers = createAsyncThunkHandler(
  'auth/fetchAllUsers',
  _get,
  (payload) => buildUrlWithParams('auth/admin/users', payload)
);

export const updateUserWallet = createAsyncThunkHandler(
  'auth/updateUserWallet',
  _put,
  (payload) => `auth/admin/wallet/${payload.userId}`
);

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token') && !!localStorage.getItem('user'),
  loading: false,
  error: null,
  jioConfig: null,
  users: [],
  usersLoading: false,
  usersError: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token; // FIXED: Use token instead of jio_token
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    updateWalletBalance: (state, action) => {
      if (state.user) {
        state.user.wallet = { ...state.user.wallet, balance: action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
      state.usersError = null;
    },
    resetLoading: (state) => {
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        // Handle both token and access_token from backend
        const token = action.payload.access_token || action.payload.token;
        state.token = token;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        // Handle both token and access_token from backend
        const token = action.payload.access_token || action.payload.token;
        state.token = token;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Refresh Token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token; // FIXED: Use token instead of data.token
        localStorage.setItem('token', action.payload.token); // FIXED: Use token instead of data.token
      })

    // Get Profile
    builder
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload.data;
      })

    // Update Profile
    builder
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.data;
      })

    // Jio Config
    builder
      .addCase(updateJioConfig.fulfilled, (state, action) => {
        state.jioConfig = action.payload.data;
      })
      .addCase(fetchJioConfig.fulfilled, (state, action) => {
        state.jioConfig = action.payload.data;
      })

    // Create User (Admin)
    builder
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.unshift(action.payload.data);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Get All Users (Admin)
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload;
      })

    // Update Wallet (Admin)
    builder
      .addCase(updateUserWallet.fulfilled, (state, action) => {
        const userId = action.payload.data.userId;
        const userIndex = state.users.findIndex(u => u._id === userId);
        if (userIndex !== -1) {
          state.users[userIndex].wallet.balance = action.payload.data.newBalance;
        }
        if (state.user?._id === userId) {
          state.user.wallet.balance = action.payload.data.newBalance;
        }
      });
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUser, updateWalletBalance, clearError, resetLoading } = authSlice.actions;
export default authSlice.reducer;