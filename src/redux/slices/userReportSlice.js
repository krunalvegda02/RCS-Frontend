import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunkHandler } from '../../helper/createAsyncThunkHandler';
import { _get } from '../../helper/apiClient';

export const getUserReport = createAsyncThunkHandler(
  'userReport/get',
  _get,
  (payload) => {
    const { userId, campaignPage = 1, transactionPage = 1 } = payload;
    const params = new URLSearchParams();
    params.append('campaignPage', campaignPage);
    params.append('transactionPage', transactionPage);
    params.append('campaignLimit', '5');
    params.append('transactionLimit', '5');
    return `auth/admin/user-report/${userId}?${params.toString()}`;
  }
);

export const getMyReport = createAsyncThunkHandler(
  'userReport/getMy',
  _get,
  (payload) => {
    const { campaignPage = 1, transactionPage = 1 } = payload;
    const params = new URLSearchParams();
    params.append('campaignPage', campaignPage);
    params.append('transactionPage', transactionPage);
    params.append('campaignLimit', '5');
    params.append('transactionLimit', '5');
    return `auth/user/my-report?${params.toString()}`;
  }
);

const userReportSlice = createSlice({
  name: 'userReport',
  initialState: {
    reportData: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearReport: (state) => {
      state.reportData = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUserReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reportData = action.payload.data;
      })
      .addCase(getUserReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getMyReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reportData = action.payload.data;
      })
      .addCase(getMyReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReport } = userReportSlice.actions;
export default userReportSlice.reducer;
