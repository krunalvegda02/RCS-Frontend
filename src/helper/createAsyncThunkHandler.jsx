import { createAsyncThunk } from "@reduxjs/toolkit";
import { buildUrlWithParams } from './helperFunction';

// Create async thunk handler without importing apiClient to avoid circular dependency
export const createAsyncThunkHandler = (typePrefix, apiMethod, urlResolver, isMultipart = false) =>
  createAsyncThunk(typePrefix, async (payload, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;

      const url = typeof urlResolver === "function" ? urlResolver(payload) : urlResolver;
      
      // Check if payload is FormData first
      const isFormData = payload instanceof FormData;
      
      let requestData;
      
      if (isFormData) {
        // Don't process FormData, pass it directly
        requestData = payload;
      } else if (typeof payload === 'object' && payload !== null) {
        // Extract params that are already in the URL path
        const urlString = String(url);
        const paramsInUrl = {};
        
        if (urlString.includes(payload.userId)) paramsInUrl.userId = true;
        if (urlString.includes(payload.campaignId)) paramsInUrl.campaignId = true;
        if (urlString.includes(payload.id)) paramsInUrl.id = true;
        if (urlString.includes(payload.batchId)) paramsInUrl.batchId = true;
        if (urlString.includes(payload.phoneNumber)) paramsInUrl.phoneNumber = true;
        
        // Only exclude params that are actually in the URL
        const { userId, campaignId, id, batchId, phoneNumber, ...rest } = payload;
        requestData = {
          ...rest,
          ...(paramsInUrl.userId ? {} : { userId }),
          ...(paramsInUrl.campaignId ? {} : { campaignId }),
          ...(paramsInUrl.id ? {} : { id }),
          ...(paramsInUrl.batchId ? {} : { batchId }),
          ...(paramsInUrl.phoneNumber ? {} : { phoneNumber })
        };
      } else {
        requestData = payload;
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      };
      
      const response = await apiMethod(url, requestData, config);
      
      if (response.data.success) {
        return response.data;
      } else {
        console.error(`❌ [AsyncThunk] ${typePrefix} - API returned success=false:`, response.data.message);
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error(`❌ [AsyncThunk] ${typePrefix} - Error:`, error.message);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  });

/*
  export const fetchItems = createAsyncThunkHandler(
    "items/fetchAll", // Type prefix
    _get,             // API method
    "/items"          // Static endpoint or resolver function
  );

  export const createItem = createAsyncThunkHandler(
    "items/create",
    _post,
    "/items"
  );
  
  export const updateItem = createAsyncThunkHandler(
    "items/update",
    _patch,
    (payload) => `/items/${payload.data.id}` // Dynamic endpoint based on payload
  );
  export const deleteItem = createAsyncThunkHandler(
    "items/delete",
    _delete,
    (payload) => `/items/${payload.data.id}`
  );

  builder
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateItem.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.data.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload.data.id);
      });
    
  */