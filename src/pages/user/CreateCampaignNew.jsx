import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Row, Col, Input, Upload, Empty, message, Breadcrumb, Select, Modal, Form, Table, Tag, Spin, Progress } from 'antd';
import { SendOutlined, UploadOutlined, DownloadOutlined, HomeOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { THEME_CONSTANTS } from '../../theme';
import { fetchUserTemplates } from '../../redux/slices/templateSlice';
import { checkCapability, createCampaign, uploadContactBatch, processContactBatch, getContactBatches, getAllContactsFromBatches, sendBulkMessage, clearContactBatches, deleteContactFromBatch } from '../../redux/slices/campaignSlice';
import RCSMessagePreview from '../../components/RCSMesagePreview';
import RCSCampaignTimeWarning from '../../components/RCSCampaignTimeWarning';

// Add keyframes for spinner animation
const spinnerStyle = document.createElement('style');
spinnerStyle.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinnerStyle);

const PaginatedContactList = ({ campaignId, totalContacts }) => {
  const [contacts, setContacts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    if (campaignId) {
      loadContacts();
    }
  }, [campaignId, currentPage]);

  const dispatch = useDispatch();

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await dispatch(getAllContactsFromBatches({ campaignId, page: currentPage, limit: pageSize })).unwrap();
      setContacts(response.data);
    } catch (error) {
      message.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (phoneNumber) => {
    try {
      await dispatch(deleteContactFromBatch({ campaignId, phoneNumber })).unwrap();
      message.success('Contact deleted');
      loadContacts();
    } catch (error) {
      message.error('Failed to delete contact');
    }
  };

  return (
    <Table
      dataSource={contacts}
      loading={loading}
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: totalContacts,
        onChange: (page) => setCurrentPage(page),
        showSizeChanger: false,
        showTotal: (total) => `Total ${total} contacts`
      }}
      rowKey={(record) => record.phoneNumber}
      columns={[
        {
          title: 'SN',
          key: 'sn',
          width: 60,
          render: (_, __, index) => (currentPage - 1) * pageSize + index + 1
        },
        {
          title: 'Phone',
          dataIndex: 'phoneNumber',
          key: 'phoneNumber',
          render: (phone) => <span style={{ fontFamily: 'monospace' }}>+91{phone}</span>
        },
        {
          title: 'Status',
          dataIndex: 'isRcsCapable',
          key: 'status',
          render: (capable) => {
            if (capable === true) return <Tag color="green">✓ RCS Ready</Tag>;
            if (capable === false) return <Tag color="red">✗ Not Capable</Tag>;
            return <Tag color="orange">Checking...</Tag>;
          }
        },
        {
          title: 'Action',
          key: 'action',
          width: 100,
          render: (_, record) => (
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.phoneNumber)}
            >
              Clear
            </Button>
          )
        }
      ]}
    />
  );
};

export default function CreateCampaignNew() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { userTemplates, loading: templatesLoading } = useSelector(state => state.templates);
  const { batchStats: reduxBatchStats } = useSelector(state => state.campaigns);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [campaignName, setCampaignName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [manualContactModal, setManualContactModal] = useState(false);
  const [manualContactForm] = Form.useForm();
  const [campaignId, setCampaignId] = useState(null);
  const [processingBatches, setProcessingBatches] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [batchStats, setBatchStats] = useState({ total: 0, rcsCapable: 0, notCapable: 0 });
  const [batchProgress, setBatchProgress] = useState(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [processingManual, setProcessingManual] = useState(false);
  const [finalStatsSet, setFinalStatsSet] = useState(false);
  // const [verifyingSync, setVerifyingSync] = useState(false);

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchUserTemplates({ userId: user._id, page: 1, limit: 1000 }));
    }
  }, [user?._id, dispatch]);

  useEffect(() => {
    if (campaignId && !processingBatches) {
      const interval = setInterval(() => {
        dispatch(getContactBatches({ campaignId, limit: 1000 }));
      }, 500);
      dispatch(getContactBatches({ campaignId, limit: 1000 }));
      return () => clearInterval(interval);
    }
  }, [campaignId, processingBatches, dispatch]);

  useEffect(() => {
    if (reduxBatchStats && !uploading && !processingManual && !finalStatsSet) {
      setBatchStats(reduxBatchStats);
    }
  }, [reduxBatchStats, uploading, processingManual, finalStatsSet]);

  const handleExcelUpload = async (file) => {
    console.log('[Upload] handleExcelUpload called with file:', file?.name);
    
    if (!selectedTemplate) {
      message.error('Please select a template first');
      return false;
    }

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        const imported = [];
        const seen = new Set();

        for (let row of data) {
          if (!row || row.length === 0) continue;
          row.forEach((cell) => {
            if (!cell) return;
            let num = String(cell).trim().replace(/[\s\-()\.]/g, '').replace(/[^\d+]/g, '');
            if (num.startsWith('+91')) num = num.substring(3);
            else if (num.startsWith('91') && num.length > 10) num = num.substring(2);
            else if (num.startsWith('0')) num = num.substring(1);
            if (/^\d{10}$/.test(num) && !seen.has(num)) {
              seen.add(num);
              imported.push(num);
            }
          });
        }

        if (imported.length === 0) {
          message.error('No valid phone numbers found');
          setUploading(false);
          return;
        }

        // Create campaign if not exists
        let currentCampaignId = campaignId;
        if (!currentCampaignId) {
          const campaignRes = await dispatch(createCampaign({
            name: campaignName || `Campaign ${Date.now()}`,
            templateId: selectedTemplate?._id,
            userId: user._id,
            status: 'draft',
            totalRecipients: imported.length
          })).unwrap();
          currentCampaignId = campaignRes.data._id;
          setCampaignId(currentCampaignId);
        }

        // Upload contacts to batch
        const batchPhoneNumbers = imported;

        await dispatch(uploadContactBatch({
          campaignId: currentCampaignId,
          batchNumber: Date.now(),
          phoneNumbers: batchPhoneNumbers
        })).unwrap();

        // Initialize stats
        setBatchStats({ total: imported.length, rcsCapable: 0, notCapable: 0 });

        // Start progress polling for real-time updates
        const progressInterval = setInterval(async () => {
          try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            const response = await fetch(`${apiUrl}/v1/campaigns/check-capability/progress?campaignId=${currentCampaignId}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            
            if (data.progress && data.progress.chunk > 0) {
              const { chunk, totalChunks, rcsCapable, processed, total } = data.progress;
              const percent = Math.round((chunk / totalChunks) * 100);
              
              // Update stat card with real-time data
              setBatchStats(prev => ({
                ...prev,
                rcsCapable: rcsCapable || 0,
                notCapable: (total || prev.total) - (rcsCapable || 0)
              }));
              
              message.loading({ 
                content: (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '12px',
                    padding: '4px 0'
                  }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: THEME_CONSTANTS.radius.md,
                      background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        border: `3px solid white`, 
                        borderTopColor: 'transparent', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite' 
                      }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '15px', 
                        fontWeight: 600, 
                        color: THEME_CONSTANTS.colors.text,
                        marginBottom: '6px',
                        lineHeight: 1.3
                      }}>
                        Verifying RCS Capability
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: THEME_CONSTANTS.colors.textSecondary,
                        marginBottom: '4px',
                        lineHeight: 1.4
                      }}>
                        Processing batch {chunk} of {totalChunks} • {percent}% complete
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: THEME_CONSTANTS.colors.success,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ fontSize: '16px' }}>✓</span>
                        {(rcsCapable || 0).toLocaleString()} contacts ready
                      </div>
                    </div>
                  </div>
                ), 
                key: 'capability', 
                duration: 0 
              });
            }
          } catch (e) {
            console.error('[Progress] Poll error:', e);
          }
        }, 2000);

        // Use Redux slice for API call
        try {
          console.log('[Upload] Starting capability check for', imported.length, 'contacts');
          
          const result = await dispatch(checkCapability({
            phoneNumbers: imported,
            campaignId: currentCampaignId,
            countOnly: true
          })).unwrap();

          console.log('[Upload] Capability check completed:', result);

          // Stop progress polling and show completion
          setTimeout(() => {
            clearInterval(progressInterval);
            message.destroy('capability');
            
            const rcsCount = result?.summary?.rcsCapable || result?.data?.summary?.rcsCapable || 0;
            const totalCount = result?.summary?.total || result?.data?.summary?.total || imported.length;
            
            // Update final stats
            setBatchStats({
              total: totalCount,
              rcsCapable: rcsCount,
              notCapable: totalCount - rcsCount
            });
            setFinalStatsSet(true);
            
            message.success({
              content: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px', color: THEME_CONSTANTS.colors.success }}>✓</span>
                  <span>{totalCount.toLocaleString()} contacts uploaded! {rcsCount.toLocaleString()} are RCS capable.</span>
                </div>
              ),
              duration: 3
            });
            setUploading(false);
          }, 2000);
        } catch (error) {
          clearInterval(progressInterval);
          console.error('[Upload] Capability check error:', error);
          message.destroy('capability');
          
          const errorMsg = error?.message || error?.data?.message || error?.error || 'Failed to verify contacts';
          message.error(`Capability check failed: ${errorMsg}`);
          setUploading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      const errorMsg = error?.message || error?.data?.message || String(error);
      message.error('Upload failed: ' + errorMsg);
      setUploading(false);
      setBatchProgress(null);
    }
    return false;
  };

  const handleAddContact = async (values) => {
    if (!selectedTemplate) {
      message.error('Please select a template first');
      return;
    }

    try {
      let phoneNumbers = values.phone.trim();
      if (!phoneNumbers) {
        message.error('Please enter phone numbers');
        return;
      }

      const numbers = phoneNumbers.split(/[\n,]+/).map(num => num.trim().replace(/[\s\-()]/g, '')).filter(num => num.length > 0);
      if (numbers.length === 0) {
        message.error('Please enter valid phone numbers');
        return;
      }

      const validNumbers = [];

      for (let phone of numbers) {
        if (!phone.startsWith('+91')) {
          if (phone.startsWith('91') && phone.length === 12) phone = '+' + phone;
          else if (phone.length === 10) phone = '+91' + phone;
          else continue;
        }
        if (/^\+91\d{10}$/.test(phone)) {
          validNumbers.push(phone.replace('+91', ''));
        }
      }

      if (validNumbers.length === 0) {
        message.warning('No new valid numbers found');
        return;
      }

      manualContactForm.resetFields();
      setManualContactModal(false);
      setProcessingManual(true);

      // Create campaign if not exists
      let currentCampaignId = campaignId;
      if (!currentCampaignId) {
        const campaignRes = await dispatch(createCampaign({
          name: campaignName || `Campaign ${Date.now()}`,
          templateId: selectedTemplate?._id,
          userId: user._id,
          status: 'draft',
          totalRecipients: validNumbers.length
        })).unwrap();
        currentCampaignId = campaignRes.data._id;
        setCampaignId(currentCampaignId);
      }

      const batchContacts = validNumbers;

      // Upload batch
      await dispatch(uploadContactBatch({
        campaignId: currentCampaignId,
        batchNumber: Date.now(),
        phoneNumbers: batchContacts
      })).unwrap();

      // Initialize stats
      setBatchStats(prev => ({ ...prev, total: prev.total + validNumbers.length }));

      // Start progress polling for real-time updates
      const progressInterval = setInterval(async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
          const response = await fetch(`${apiUrl}/v1/campaigns/check-capability/progress`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const data = await response.json();
          
          if (data.progress && data.progress.chunk > 0) {
            const { chunk, totalChunks, rcsCapable, processed, total } = data.progress;
            const percent = Math.round((chunk / totalChunks) * 100);
            
            // Update stat card with real-time data
            setBatchStats(prev => ({
              ...prev,
              rcsCapable: rcsCapable || 0,
              notCapable: (total || prev.total) - (rcsCapable || 0)
            }));
            
            message.loading({ 
              content: (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '12px',
                  padding: '4px 0'
                }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: THEME_CONSTANTS.radius.md,
                    background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <div style={{ 
                      width: '20px', 
                      height: '20px', 
                      border: `3px solid white`, 
                      borderTopColor: 'transparent', 
                      borderRadius: '50%', 
                      animation: 'spin 1s linear infinite' 
                    }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '15px', 
                      fontWeight: 600, 
                      color: THEME_CONSTANTS.colors.text,
                      marginBottom: '6px',
                      lineHeight: 1.3
                    }}>
                      Verifying RCS Capability
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: THEME_CONSTANTS.colors.textSecondary,
                      marginBottom: '4px',
                      lineHeight: 1.4
                    }}>
                      Processing batch {chunk} of {totalChunks} • {percent}% complete
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: THEME_CONSTANTS.colors.success,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ fontSize: '16px' }}>✓</span>
                      {(rcsCapable || 0).toLocaleString()} contacts ready
                    </div>
                  </div>
                </div>
              ), 
              key: 'capability', 
              duration: 0 
            });
          }
        } catch (e) {
          console.error('[Progress] Poll error:', e);
        }
      }, 2000);

      // Check capability
      try {
        const result = await dispatch(checkCapability({
          phoneNumbers: validNumbers,
          campaignId: currentCampaignId,
          countOnly: true
        })).unwrap();

        console.log('[Manual] Capability check completed:', result);

        // Stop progress polling and show completion
        setTimeout(() => {
          clearInterval(progressInterval);
          message.destroy('capability');
          
          const rcsCount = result?.summary?.rcsCapable || result?.data?.summary?.rcsCapable || 0;
          const totalCount = result?.summary?.total || result?.data?.summary?.total || validNumbers.length;
          
          message.success({
            content: (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', color: THEME_CONSTANTS.colors.success }}>✓</span>
                <span>{totalCount.toLocaleString()} contacts added! {rcsCount.toLocaleString()} are RCS capable.</span>
              </div>
            ),
            duration: 3
          });
          setProcessingManual(false);
        }, 2000);
      } catch (error) {
        clearInterval(progressInterval);
        console.error('[Manual] Capability check error:', error);
        message.destroy('capability');
        
        const errorMsg = error?.message || error?.data?.message || error?.error || 'Failed to verify contacts';
        message.error(`Capability check failed: ${errorMsg}`);
        setProcessingManual(false);
      }
    } catch (error) {
      const errorMsg = error?.message || error?.data?.message || String(error);
      message.error('Error adding contacts: ' + errorMsg);
      setProcessingManual(false);
    }
  };

  const handleClearContacts = () => {
    Modal.confirm({
      title: 'Clear All Contacts?',
      content: 'This will remove all uploaded contacts and batches. This action cannot be undone.',
      okText: 'Yes, Clear All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        dispatch(clearContactBatches());
        setBatchStats({ total: 0, rcsCapable: 0, notCapable: 0 });
        setFinalStatsSet(false);
        setCampaignId(null);
        setShowContacts(false);
        message.success('All contacts cleared');
      }
    });
  };

  // const handleVerifySync = async () => {
  //   if (!campaignId) {
  //     message.error('No campaign found');
  //     return;
  //   }

  //   setVerifyingSync(true);
  //   try {
  //     const contactsRes = await dispatch(getAllContactsFromBatches({ 
  //       campaignId, 
  //       limit: 50000 
  //     })).unwrap();

  //     const rcsContacts = contactsRes.data.filter(c => c.isRcsCapable);
      
  //     console.log('📊 Stats RCS Capable:', batchStats.rcsCapable);
  //     console.log('🔍 Actual RCS Contacts:', rcsContacts.length);
      
  //     if (rcsContacts.length === batchStats.rcsCapable) {
  //       message.success(`✅ Perfect sync! Stats: ${batchStats.rcsCapable} = Database: ${rcsContacts.length}`);
  //     } else {
  //       message.warning(`⚠️ Sync mismatch! Stats: ${batchStats.rcsCapable} ≠ Database: ${rcsContacts.length}`);
  //     }
  //   } catch (error) {
  //     message.error('Failed to verify sync: ' + error.message);
  //   } finally {
  //     setVerifyingSync(false);
  //   }
  // };

  const handleSendCampaign = () => {
    if (!selectedTemplate) {
      message.error('Please select a template');
      return;
    }
    if (!campaignName.trim()) {
      message.error('Please enter campaign name');
      return;
    }
    if (batchStats.rcsCapable === 0) {
      message.error('No valid RCS contacts found');
      return;
    }

    const estimatedCost = batchStats.rcsCapable * 1;

    Modal.confirm({
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: THEME_CONSTANTS.radius.lg, background: THEME_CONSTANTS.colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${THEME_CONSTANTS.colors.primary}` }}>
            <SendOutlined style={{ fontSize: '24px', color: THEME_CONSTANTS.colors.primary }} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: THEME_CONSTANTS.colors.text }}>Confirm Campaign Launch</div>
            <div style={{ fontSize: '13px', fontWeight: 400, color: THEME_CONSTANTS.colors.textSecondary, marginTop: '2px' }}>Review details before sending</div>
          </div>
        </div>
      ),
      width: 600,
      icon: null,
      content: (
        <div style={{ padding: '24px 0' }}>
          <div style={{ background: THEME_CONSTANTS.colors.background, borderRadius: THEME_CONSTANTS.radius.lg, padding: '20px', marginBottom: '20px', border: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '24px' }}>📋</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Campaign Name</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: THEME_CONSTANTS.colors.text, marginTop: '4px' }}>{campaignName}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: THEME_CONSTANTS.colors.success, borderRadius: THEME_CONSTANTS.radius.lg, padding: '16px', color: 'white' }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>RCS READY</div>
              <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{batchStats.rcsCapable}</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>Contacts verified</div>
            </div>
            
            <div style={{ background: THEME_CONSTANTS.colors.warning, borderRadius: THEME_CONSTANTS.radius.lg, padding: '16px', color: 'white' }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>ESTIMATED COST</div>
              <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>₹{estimatedCost}</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>₹1 per RCS message</div>
            </div>
          </div>

          <div style={{ background: THEME_CONSTANTS.colors.primaryLight, border: `1px solid ${THEME_CONSTANTS.colors.primary}`, borderRadius: THEME_CONSTANTS.radius.lg, padding: '16px', display: 'flex', gap: '12px' }}>
            <div style={{ fontSize: '20px' }}>ℹ️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: THEME_CONSTANTS.colors.primary, marginBottom: '4px' }}>Ready to Send</div>
              <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.text, lineHeight: 1.5 }}>Messages will be sent to {batchStats.rcsCapable} RCS capable contacts immediately.</div>
            </div>
          </div>
        </div>
      ),
      okText: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SendOutlined /> Send Campaign Now
        </span>
      ),
      cancelText: 'Cancel',
      okButtonProps: {
        size: 'large',
        style: { height: '48px', borderRadius: THEME_CONSTANTS.radius.md, fontWeight: 600, fontSize: '15px' }
      },
      cancelButtonProps: {
        size: 'large',
        style: { height: '48px', borderRadius: THEME_CONSTANTS.radius.md }
      },
      onOk: async () => {
        const hideLoading = message.loading('Sending campaign...', 0);
        try {
          // Fetch all RCS capable contacts from batches
          const contactsRes = await dispatch(getAllContactsFromBatches({ 
            campaignId, 
            limit: 10000 
          })).unwrap();

          const rcsContacts = contactsRes.data
            .filter(c => c.isRcsCapable)
            .map(c => ({
              phoneNumber: c.phoneNumber,
              isRcsCapable: true,
              variables: {}
            }));

          // Verify sync between stats and actual RCS contacts
          console.log('Stats RCS Capable:', batchStats.rcsCapable);
          console.log('Actual RCS Contacts:', rcsContacts.length);
          
          if (rcsContacts.length !== batchStats.rcsCapable) {
            hideLoading();
            message.error(`Sync error: Stats show ${batchStats.rcsCapable} but found ${rcsContacts.length} RCS contacts. Please refresh and try again.`);
            return;
          }

          if (rcsContacts.length === 0) {
            hideLoading();
            message.error('No RCS capable contacts found');
            return;
          }

          await dispatch(sendBulkMessage({
            name: campaignName.trim(),
            templateId: selectedTemplate._id,
            recipients: rcsContacts,
            autoStart: true
          })).unwrap();

          hideLoading();
          message.success(`Campaign started successfully! Sending to ${rcsContacts.length} RCS contacts.`);
          navigate('/reports');
        } catch (error) {
          hideLoading();
          message.error('Failed to start campaign: ' + (error.message || error));
        }
      }
    });
  };

  const downloadDemo = () => {
    const data = [['Index', 'Number'], ['1', '7201000140'], ['2', '7201000141']];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
    XLSX.writeFile(wb, 'demo_contacts.xlsx');
  };

  return (
    <>
      <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh' }}>
        <div style={{ maxWidth: THEME_CONSTANTS.layout.maxContentWidth, margin: '0 auto', padding: THEME_CONSTANTS.spacing.xl }}>
          <div style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl, paddingBottom: THEME_CONSTANTS.spacing.xl, borderBottom: `2px solid ${THEME_CONSTANTS.colors.primaryLight}` }}>
            <Breadcrumb style={{ marginBottom: THEME_CONSTANTS.spacing.md }}>
              <Breadcrumb.Item><HomeOutlined /> Home</Breadcrumb.Item>
              <Breadcrumb.Item>Create Campaign</Breadcrumb.Item>
            </Breadcrumb>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', background: THEME_CONSTANTS.colors.primaryLight, borderRadius: THEME_CONSTANTS.radius.xl, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SendOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '32px' }} />
              </div>
              <div>
                <h1 style={{ fontSize: THEME_CONSTANTS.typography.h1.size, fontWeight: THEME_CONSTANTS.typography.h1.weight, margin: 0 }}>Create Campaign</h1>
                <p style={{ color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>Select template, upload contacts, and send campaign</p>
              </div>
            </div>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={14}>
              {/* <RCSCampaignTimeWarning /> */}
              
              <Card style={{ marginBottom: '24px', borderRadius: THEME_CONSTANTS.radius.lg, border: `1px solid ${THEME_CONSTANTS.colors.borderLight}` }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>1. Select Template</h3>
                <Select
                  showSearch
                  placeholder="Search and select template"
                  style={{ width: '100%' }}
                  size="large"
                  loading={templatesLoading}
                  value={selectedTemplate?._id}
                  onChange={(value) => {
                    const template = userTemplates.find(t => t._id === value);
                    setSelectedTemplate(template);
                  }}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={userTemplates.map(t => ({
                    label: `${t.name} (${t.templateType})`,
                    value: t._id
                  }))}
                />
              </Card>

              <Card style={{ marginBottom: '24px', borderRadius: THEME_CONSTANTS.radius.lg, border: `1px solid ${THEME_CONSTANTS.colors.borderLight}` }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>2. Upload Contacts</h3>
                {batchProgress && (
                  <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '16px', borderRadius: '12px', marginBottom: '16px', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ width: '20px', height: '20px', border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>Processing Batch {batchProgress.chunk}/{batchProgress.totalChunks}</div>
                        <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                          {batchProgress.processed.toLocaleString()} / {batchProgress.total.toLocaleString()} contacts checked
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                          ✅ {batchProgress.rcsCapable.toLocaleString()} RCS capable found
                        </div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.3)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ background: 'white', height: '100%', width: `${Math.round((batchProgress.processed / batchProgress.total) * 100)}%`, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: '11px', textAlign: 'right', marginTop: '4px', opacity: 0.9 }}>
                      {Math.round((batchProgress.processed / batchProgress.total) * 100)}%
                    </div>
                  </div>
                )}
                <Row gutter={[12, 12]}>
                  <Col span={6}>
                    <Upload beforeUpload={handleExcelUpload} showUploadList={false} accept=".xlsx,.xls,.csv">
                      <Button icon={<UploadOutlined />} loading={uploading} style={{ width: '100%', height: '44px' }}>Upload Excel</Button>
                    </Upload>
                  </Col>
                  <Col span={6}>
                    <Button icon={<PlusOutlined />} onClick={() => setManualContactModal(true)} style={{ width: '100%', height: '44px' }}>Add Manually</Button>
                  </Col>
                  <Col span={6}>
                    <Button icon={<DownloadOutlined />} onClick={downloadDemo} style={{ width: '100%', height: '44px' }}>Download Demo</Button>
                  </Col>
                  <Col span={6}>
                    <Button 
                      type="primary"
                      onClick={() => setShowContacts(!showContacts)}
                      disabled={batchStats.total === 0}
                      style={{ width: '100%', height: '44px' }}
                    >
                      {showContacts ? 'Hide' : 'Show'} Contacts ({batchStats.total})
                    </Button>
                  </Col>
                </Row>
                {/* {batchStats.total > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <Button 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={handleClearContacts}
                      style={{ flex: 1 }}
                    >
                      Clear All Contacts
                    </Button>
                    <Button 
                      type="primary"
                      ghost
                      loading={verifyingSync}
                      onClick={handleVerifySync}
                      style={{ flex: 1 }}
                    >
                      Verify Sync ({batchStats.rcsCapable})
                    </Button>
                  </div>
                )} */}
                {(uploading || processingManual) && (
                  <div style={{
                    background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
                    padding: '20px',
                    borderRadius: THEME_CONSTANTS.radius.lg,
                    marginTop: '16px',
                    color: 'white',
                    boxShadow: THEME_CONSTANTS.shadow.md
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px',
                        border: '3px solid white',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Processing Contacts</div>
                        <div style={{ fontSize: '13px', opacity: 0.9 }}>Checking RCS capability for contacts...</div>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginTop: '16px' }} key={updateTrigger}>
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.text }}>{batchStats.total}</div>
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>Total</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.success }}>{batchStats.rcsCapable}</div>
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>RCS Ready</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#ff4d4f' }}>{batchStats.notCapable || 0}</div>
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>Invalid</div>
                      </div>
                    </Col>
                  </Row>
                </div>
                {showContacts && batchStats.total > 0 && campaignId && (
                  <div style={{ marginTop: '16px', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                    <PaginatedContactList campaignId={campaignId} totalContacts={batchStats.total} />
                  </div>
                )}
              </Card>

              <Card style={{ marginBottom: '24px', borderRadius: THEME_CONSTANTS.radius.lg, border: `1px solid ${THEME_CONSTANTS.colors.borderLight}` }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>3. Campaign Name</h3>
                <Input
                  placeholder="Enter campaign name"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  size="large"
                />
              </Card>

              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendCampaign}
                disabled={!selectedTemplate || !campaignName.trim() || batchStats.rcsCapable === 0}
                size="large"
                block
                style={{ height: '52px', fontSize: '16px', fontWeight: 600 }}
              >
                Send Campaign ({batchStats.rcsCapable} contacts)
              </Button>
            </Col>

            <Col xs={24} lg={10}>
              <Card style={{ position: 'sticky', top: '24px', borderRadius: THEME_CONSTANTS.radius.lg, border: `1px solid ${THEME_CONSTANTS.colors.borderLight}` }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', textAlign: 'center' }}>Message Preview</h3>
                {selectedTemplate ? (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <RCSMessagePreview data={selectedTemplate} />
                  </div>
                ) : (
                  <Empty description="Select a template to preview" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      <Modal
        title="Add Contacts Manually"
        open={manualContactModal}
        onCancel={() => {
          setManualContactModal(false);
          manualContactForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setManualContactModal(false);
            manualContactForm.resetFields();
          }}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={() => manualContactForm.submit()}>
            Add Contacts
          </Button>
        ]}
      >
        <Form form={manualContactForm} layout="vertical" onFinish={handleAddContact}>
          <Form.Item
            label="Phone Numbers"
            name="phone"
            rules={[{ required: true, message: 'Please enter phone numbers' }]}
          >
            <Input.TextArea
              rows={6}
              placeholder={`Enter phone numbers (one per line or comma separated):\n9876543210\n9876543211\n9876543212\n\nOr comma separated: 9876543210, 9876543211, 9876543212`}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '-16px' }}>
            💡 You can add multiple numbers separated by commas or new lines. Numbers will be automatically formatted with +91 prefix.
          </div>
        </Form>
      </Modal>
    </>
  );
}
