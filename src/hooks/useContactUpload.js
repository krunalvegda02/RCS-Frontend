import { useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { checkBatchCapability, resetUpload as resetUploadAction } from '../redux/slices/contactUploadSlice';

export const useContactUpload = () => {
  const dispatch = useDispatch();
  const uploadState = useSelector(state => state.contactUpload);

  // Check batch capability
  const checkCapability = async (phoneNumbers) => {
    try {
      const result = await dispatch(checkBatchCapability(phoneNumbers)).unwrap();
      
      if (result.success) {
        const rcsCount = result.data.results.filter(r => r.isCapable).length;
        message.success(`${result.data.totalNumbers} contacts checked (${rcsCount} RCS capable) in ${result.performance.totalTime}ms`);
        return { success: true, results: result.data.results };
      }
    } catch (error) {
      message.error('Capability check failed: ' + error);
      return { success: false, error };
    }
  };

  // Reset state
  const resetUpload = () => {
    dispatch(resetUploadAction());
  };

  return {
    uploadState,
    checkCapability,
    resetUpload
  };
};