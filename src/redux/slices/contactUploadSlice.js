import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { _post } from '../../helper/apiClient';

// Batch capability check
export const checkBatchCapability = createAsyncThunk(
  'contactUpload/checkBatchCapability',
  async (phoneNumbers, { rejectWithValue }) => {
    try {
      const response = await _post('v1/messaging/usersBatchget', {
        phoneNumbers
      }, {}, localStorage.getItem('token'));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const contactUploadSlice = createSlice({
  name: 'contactUpload',
  initialState: {
    isBatchChecking: false,
    batchResults: null,
    error: null
  },
  reducers: {
    resetUpload: (state) => {
      state.isBatchChecking = false;
      state.batchResults = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Batch capability check
      .addCase(checkBatchCapability.pending, (state) => {
        state.isBatchChecking = true;
        state.error = null;
      })
      .addCase(checkBatchCapability.fulfilled, (state, action) => {
        state.isBatchChecking = false;
        state.batchResults = action.payload;
      })
      .addCase(checkBatchCapability.rejected, (state, action) => {
        state.isBatchChecking = false;
        state.error = action.payload;
      });
  }
});

export const { resetUpload } = contactUploadSlice.actions;
export default contactUploadSlice.reducer;