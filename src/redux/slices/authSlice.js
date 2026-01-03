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

export const updatePassword = createAsyncThunkHandler(
  'auth/updatePassword',
  _put,
  'auth/update-password'
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
  user: null,
  token: null,
  isAuthenticated: false,
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

// Helper to initialize state from localStorage
const getInitialAuthState = () => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      const user = JSON.parse(userStr);
      return {
        ...initialState,
        user,
        token,
        isAuthenticated: true,
      };
    }
  } catch (error) {
    console.error('Error loading auth state:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  return initialState;
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialAuthState(),
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
      state.jioConfig = null;
      
      // Clear localStorage
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
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
        state.error = null;
        
        const token = action.payload.access_token || action.payload.token;
        const user = action.payload.user;
        
        if (token && user) {
          state.isAuthenticated = true;
          state.user = user;
          state.token = token;
          
          // Persist to localStorage
          try {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
          } catch (error) {
            console.error('Error saving to localStorage:', error);
          }
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        
        // Clear localStorage on login failure
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } catch (error) {
          console.error('Error clearing localStorage:', error);
        }
        
        // Check if account is deactivated
        if (action.payload?.deactivated) {
          state.error = 'Account is deactivated. Please contact administrator.';
        }
      })

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        
        const token = action.payload.access_token || action.payload.token;
        const user = action.payload.user;
        
        if (token && user) {
          state.isAuthenticated = true;
          state.user = user;
          state.token = token;
          
          // Persist to localStorage
          try {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
          } catch (error) {
            console.error('Error saving to localStorage:', error);
          }
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    // Refresh Token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        const token = action.payload.access_token || action.payload.token;
        if (token) {
          state.token = token;
          try {
            localStorage.setItem('token', token);
          } catch (error) {
            console.error('Error saving token:', error);
          }
        }
      })

    // Get Profile
    builder
      .addCase(fetchProfile.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.user = action.payload.data;
          try {
            localStorage.setItem('user', JSON.stringify(action.payload.data));
          } catch (error) {
            console.error('Error saving user:', error);
          }
        }
      })

    // Update Profile
    builder
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.user = action.payload.data;
          try {
            localStorage.setItem('user', JSON.stringify(action.payload.data));
          } catch (error) {
            console.error('Error saving user:', error);
          }
        }
      })

    // Update Password
    builder
      .addCase(updatePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Don't clear auth state on password update failure
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