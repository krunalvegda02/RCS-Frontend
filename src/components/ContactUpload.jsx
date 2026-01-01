import React, { useState } from 'react';
import { Card, Button, Upload, Alert, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { resetUpload, checkBatchCapability } from '../redux/slices/contactUploadSlice';
import * as XLSX from 'xlsx';

const ContactUpload = ({ onContactsReady }) => {
  const dispatch = useDispatch();
  const { isBatchChecking, batchResults } = useSelector(state => state.contactUpload);

  // Handle batch capability check
  const handleBatchCheck = async (file) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        const phoneNumbers = [];
        data.forEach((row, idx) => {
          if (idx === 0) return;
          row.forEach(cell => {
            if (cell) {
              let num = String(cell).replace(/\D/g, '');
              if (num.length === 10) phoneNumbers.push(num);
            }
          });
        });

        if (phoneNumbers.length === 0) {
          message.error('No valid phone numbers found');
          return;
        }

        const result = await dispatch(checkBatchCapability(phoneNumbers));
        
        if (result.payload?.success) {
          const allContacts = result.payload.data.results.map(r => ({
            id: `${r.phoneNumber}_${Date.now()}`,
            number: `+91${r.phoneNumber}`,
            capable: r.isCapable,
            status: r.isCapable ? 'RCS' : 'SMS'
          }));
          
          if (allContacts.length > 0 && onContactsReady) {
            onContactsReady(allContacts);
          }
          
          const rcsCount = allContacts.filter(c => c.capable).length;
            const apiUsed = result.payload.performance?.apiUsed || 'batch';
          message.success(`${allContacts.length} contacts processed (${rcsCount} RCS capable) in ${result.payload.performance.totalTime}ms using ${apiUsed} API`);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      message.error('Upload failed: ' + error.message);
    }
    return false;
  };

  return (
    <Card title="Upload Contacts" size="small">
      <Upload 
        beforeUpload={handleBatchCheck} 
        accept=".xlsx,.xls,.csv" 
        showUploadList={false}
      >
        <Button 
          icon={<UploadOutlined />} 
          loading={isBatchChecking} 
          block
        >
          Upload & Check Capability
        </Button>
      </Upload>

      {batchResults && (
        <div style={{ marginTop: 16 }}>
          <Alert
            message="Upload Complete!"
            description={`${batchResults.data.results.filter(r => r.isCapable).length} RCS contacts found in ${batchResults.performance.totalTime}ms using ${batchResults.performance.apiUsed || 'batch'} API`}
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, textAlign: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, color: '#52c41a' }}>
                {batchResults.data.results.filter(r => r.isCapable).length}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>RCS Capable</div>
            </div>
            <div>
              <div style={{ fontSize: 20, color: '#1890ff' }}>
                {batchResults.data.results.filter(r => r.cached).length}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>Cached</div>
            </div>
            <div>
              <div style={{ fontSize: 20, color: '#fa8c16' }}>
                {batchResults.performance.totalTime}ms
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>Total Time</div>
            </div>
            <div>
              <div style={{ fontSize: 16, color: '#722ed1', fontWeight: 'bold' }}>
                {batchResults.performance.apiUsed || 'batch'}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>API Used</div>
            </div>
          </div>
          
          <Button 
            onClick={() => dispatch(resetUpload())} 
            block
            size="small"
          >
            Upload New File
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ContactUpload;