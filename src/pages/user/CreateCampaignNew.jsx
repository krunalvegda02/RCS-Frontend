import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Row, Col, Input, Upload, Empty, message, Breadcrumb, Select, Modal, Form, Table, Tag, Spin, Progress } from 'antd';
import { SendOutlined, UploadOutlined, DownloadOutlined, HomeOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { useNavigate } from 'react-router-dom';
import { THEME_CONSTANTS } from '../../theme';
import { fetchUserTemplates } from '../../redux/slices/templateSlice';
import { checkCapability, createMasterCampaign, getCampaignById, getAllContactsFromBatches } from '../../redux/slices/campaignSlice';
import RCSMessagePreview from '../../components/RCSMesagePreview';
import RCSCampaignTimeWarning, { isAfter10PM } from '../../components/RCSCampaignTimeWarning';


// Add keyframes for spinner animation
const spinnerStyle = document.createElement('style');
spinnerStyle.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinnerStyle);

const ContactsTable = ({ contacts, onDelete, loading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const paginatedData = contacts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Table
      dataSource={paginatedData}
      loading={loading}
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: contacts.length,
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
          render: (phone) => <span style={{ fontFamily: 'monospace' }}>{phone}</span>
        },
        /* COMMENTED OUT - STATUS COLUMN
        {
          title: 'Status',
          dataIndex: 'isCapable',
          key: 'status',
          render: (capable) => {
            if (capable === true) return <Tag color="green">✓ RCS Ready</Tag>;
            if (capable === false) return <Tag color="red">✗ Not Capable</Tag>;
            return <Tag color="orange">Checking...</Tag>;
          }
        },
        */
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
              onClick={() => onDelete(record.phoneNumber)}
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
  const { contactBatches } = useSelector(state => state.campaigns);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [campaignName, setCampaignName] = useState('');
  const [manualContactModal, setManualContactModal] = useState(false);
  const [manualContactForm] = Form.useForm();
  const [campaignId, setCampaignId] = useState(null);
  const [showContacts, setShowContacts] = useState(false);
  const [showReachableUsers, setShowReachableUsers] = useState(false);
  const [batchStats, setBatchStats] = useState({ total: 0, rcsCapable: 0, notCapable: 0 });
  const [capabilityResponse, setCapabilityResponse] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkingProgress, setCheckingProgress] = useState(0);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchUserTemplates({ userId: user._id, page: 1, limit: 10 }));
    }
  }, [user?._id, dispatch]);



  // Unified contact processing function for both manual and Excel uploads
  const processContacts = async (phoneNumbers) => {
    if (!selectedTemplate) {
      message.error('Please select a template first');
      return;
    }

    if (!campaignName.trim()) {
      message.error('Please enter campaign name first');
      return;
    }

    if (!phoneNumbers || phoneNumbers.length === 0) {
      message.error('No valid phone numbers found');
      return;
    }

    // Check 1.5 lakh contact limit
    const CONTACT_LIMIT = 150000;
    if (phoneNumbers.length > CONTACT_LIMIT) {
      Modal.error({
        title: '🚫 Contact Limit Exceeded',
        content: (
          <div style={{ padding: '16px 0' }}>
            <p style={{ marginBottom: '16px', fontSize: '14px', lineHeight: 1.5 }}>
              You are trying to upload <strong>{phoneNumbers.length.toLocaleString()}</strong> contacts, which exceeds our limit of <strong>1.5 lakh (150,000)</strong> contacts per campaign.
            </p>
            <div style={{
              background: '#fff3cd',
              border: '1px solid #f39c12',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '13px',
              color: '#8b4513',
              marginBottom: '12px'
            }}>
              <strong>📊 Current Upload:</strong> {phoneNumbers.length.toLocaleString()} contacts<br/>
              <strong>🚫 Maximum Allowed:</strong> 1,50,000 contacts<br/>
              <strong>⚠️ Excess:</strong> {(phoneNumbers.length - CONTACT_LIMIT).toLocaleString()} contacts
            </div>
            <div style={{
              background: '#e8f5e8',
              border: '1px solid #52c41a',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '13px',
              color: '#389e0d'
            }}>
              <strong>💡 Solution:</strong> Please create multiple smaller campaigns with less than 1.5 lakh contacts each for better performance and delivery rates.
            </div>
          </div>
        ),
        okText: 'Understood',
        width: 500
      });
      return;
    }

    // CAPABILITY CHECK DISABLED - Direct upload without RCS verification
    message.success(`${phoneNumbers.length} contacts uploaded!`);

    const contactsData = phoneNumbers.map(phone => ({
      phoneNumber: phone,
      isCapable: true
    }));

    setCapabilityResponse({
      success: true,
      data: contactsData,
      summary: {
        total: phoneNumbers.length,
        rcsCapable: phoneNumbers.length,
        notCapable: 0
      }
    });

    setBatchStats({
      total: phoneNumbers.length,
      rcsCapable: phoneNumbers.length,
      notCapable: 0
    });

    /* COMMENTED OUT - CAPABILITY CHECK
    setChecking(true);
    setCheckingProgress(0);

    const startTime = Date.now();
    let progressInterval = null;
    let apiCompleted = false;

    progressInterval = setInterval(() => {
      if (apiCompleted) return;

      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 30000) * 85, 85);
      setCheckingProgress(progress);

      if (progress >= 85) {
        clearInterval(progressInterval);
      }
    }, 100);

    try {
      message.success(`${phoneNumbers.length} contacts uploaded!`);

      // Call checkCapability API directly
      const response = await dispatch(checkCapability({ phoneNumbers })).unwrap();

      console.log('✅ Capability Check Response:', response);
      console.log('📊 Summary:', response.summary);
      console.log('📋 Data:', response.data);
      console.log('🔄 API Used:', response.summary?.apiUsed);

      // API completed - complete progress to 100%
      apiCompleted = true;
      clearInterval(progressInterval);

      let currentProgress = checkingProgress;
      const completeInterval = setInterval(() => {
        currentProgress += 8;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(completeInterval);

          // Show 100% for 1 second before hiding
          setTimeout(() => {
            setChecking(false);
            setCheckingProgress(0);
          }, 1000);
        }
        setCheckingProgress(currentProgress);
      }, 30);

      // Store response in variable
      setCapabilityResponse(response);

      // Update batch stats from response
      if (response.success && response.summary) {
        setBatchStats({
          total: response.summary.total,
          rcsCapable: response.summary.rcsCapable,
          notCapable: response.summary.notCapable
        });
        message.success(`Capability check complete! ${response.summary.rcsCapable} RCS-capable out of ${response.summary.total}`);
      }

    } catch (error) {
      apiCompleted = true;
      clearInterval(progressInterval);
      setChecking(false);
      setCheckingProgress(0);
      const errorMsg = error?.message || error?.data?.message || String(error);
      message.error(`Error processing contacts: ${errorMsg}`);
    }
    */
  };

  const handleExcelUpload = async (file) => {
    if (!selectedTemplate) {
      message.error('Please select a template first');
      return false;
    }
    if (!campaignName.trim()) {
      message.error('Please enter campaign name first');
      return false;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(evt.target.result);
        const worksheet = workbook.worksheets[0];
        const seen = new Set();

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          row.eachCell(cell => {
            if (!cell.value) return;
            let num = String(cell.value).trim().replace(/[\s\-().]/g, '').replace(/[^\d+]/g, '');
            if (num.startsWith('+91')) num = num.substring(3);
            else if (num.startsWith('91') && num.length > 10) num = num.substring(2);
            else if (num.startsWith('0')) num = num.substring(1);
            if (/^\d{10}$/.test(num)) seen.add('+91' + num);
          });
        });

        const imported = Array.from(seen);
        if (imported.length === 0) {
          message.error('No valid phone numbers found');
          return;
        }

        await processContacts(imported);
      } catch (error) {
        message.error('Upload failed: ' + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };



  const handleAddContact = async (values) => {
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

    const seen = new Set();
    for (let phone of numbers) {
      if (!phone.startsWith('+91')) {
        if (phone.startsWith('91') && phone.length === 12) phone = '+' + phone;
        else if (phone.length === 10) phone = '+91' + phone;
        else continue;
      }
      if (/^\+91\d{10}$/.test(phone)) {
        seen.add(phone);
      }
    }

    const validNumbers = Array.from(seen);

    if (validNumbers.length === 0) {
      message.warning('No valid numbers found');
      return;
    }

    setManualContactModal(false);
    manualContactForm.resetFields();

    await processContacts(validNumbers);
  };

  const handleDeleteContact = (phoneNumber) => {
    if (!capabilityResponse?.data) return;

    const updatedData = capabilityResponse.data.filter(c => c.phoneNumber !== phoneNumber);
    const rcsCapable = updatedData.filter(c => c.isCapable).length;

    setCapabilityResponse({
      ...capabilityResponse,
      data: updatedData,
      summary: {
        ...capabilityResponse.summary,
        total: updatedData.length,
        rcsCapable,
        notCapable: updatedData.length - rcsCapable
      }
    });

    setBatchStats({
      total: updatedData.length,
      rcsCapable,
      notCapable: updatedData.length - rcsCapable
    });

    message.success('Contact removed');
  };

  const handleClearContacts = () => {
    Modal.confirm({
      title: 'Clear All Contacts?',
      content: 'This will remove all uploaded contacts and batches. This action cannot be undone.',
      okText: 'Yes, Clear All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        setBatchStats({ total: 0, rcsCapable: 0, notCapable: 0 });
        setCapabilityResponse(null);
        setShowContacts(false);
        setShowReachableUsers(false);
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
    // Check if campaign creation is disabled after 10 PM
    if (isAfter10PM()) {
      Modal.error({
        title: '🚫 Campaign Creation Disabled',
        content: (
          <div style={{ padding: '16px 0' }}>
            <p style={{ marginBottom: '16px', fontSize: '14px', lineHeight: 1.5 }}>
              Campaign creation is disabled after <strong>10:00 PM</strong> to ensure compliance with regulatory guidelines.
            </p>
            <div style={{
              background: '#fff3cd',
              border: '1px solid #f39c12',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '13px',
              color: '#8b4513',
              marginBottom: '12px'
            }}>
              <strong>🕰️ Campaign Creation:</strong> 9:00 AM - 10:00 PM<br/>
              <strong>📱 Message Sending:</strong> 9:00 AM - 9:00 PM
            </div>
            <div style={{
              background: '#e8f5e8',
              border: '1px solid #52c41a',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '13px',
              color: '#389e0d'
            }}>
              <strong>✅ Next Available:</strong> Tomorrow at 9:00 AM
            </div>
          </div>
        ),
        okText: 'Understood',
        width: 400
      });
      return;
    }

    if (!selectedTemplate) {
      message.error('Please select a template');
      return;
    }
    if (!campaignName.trim()) {
      message.error('Please enter campaign name');
      return;
    }
    if (batchStats.total === 0) {
      message.error('No contacts found');
      return;
    }

    const estimatedCost = batchStats.total * 1;
    const modalInstance = Modal.confirm({
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
      closable: false,
      maskClosable: false,
      content: (
        <div style={{ padding: '24px 0' }}>
          {showProgress ? (
            <div style={{
              background: THEME_CONSTANTS.colors.surface,
              borderRadius: THEME_CONSTANTS.radius.lg,
              padding: '24px',
              border: `2px solid ${THEME_CONSTANTS.colors.primary}`
            }}>
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: THEME_CONSTANTS.colors.primaryLight,
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${THEME_CONSTANTS.colors.primary}`
                }}>
                  <SendOutlined style={{ fontSize: '24px', color: THEME_CONSTANTS.colors.primary }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: THEME_CONSTANTS.colors.text }}>
                    Creating Campaign
                  </div>
                  <div style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>
                    {sendingProgress < 90 ? 'Processing bulk entries...' : 'Finalizing campaign...'}
                  </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.primary }}>
                  {Math.round(sendingProgress)}%
                </div>
              </div>
              <Progress
                percent={sendingProgress}
                status={sendingProgress === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': THEME_CONSTANTS.colors.primary,
                  '100%': THEME_CONSTANTS.colors.success,
                }}
                strokeWidth={12}
                showInfo={false}
              />
            </div>
          ) : (
            <>
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
                  <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>TOTAL CONTACTS</div>
                  <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{batchStats.total}</div>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>Ready to send</div>
                </div>

                <div style={{ background: THEME_CONSTANTS.colors.warning, borderRadius: THEME_CONSTANTS.radius.lg, padding: '16px', color: 'white' }}>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>ESTIMATED COST</div>
                  <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{estimatedCost} Credits</div>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>1 Credit per message</div>
                </div>
              </div>

              <div style={{ background: THEME_CONSTANTS.colors.primaryLight, border: `1px solid ${THEME_CONSTANTS.colors.primary}`, borderRadius: THEME_CONSTANTS.radius.lg, padding: '16px', display: 'flex', gap: '12px' }}>
                <div style={{ fontSize: '20px' }}>ℹ️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: THEME_CONSTANTS.colors.primary, marginBottom: '4px' }}>Ready to Send</div>
                  <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.text, lineHeight: 1.5 }}>Campaign will be sent to {batchStats.total} contacts.</div>
                </div>
              </div>
            </>
          )}
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
        style: { height: '48px', borderRadius: THEME_CONSTANTS.radius.md, fontWeight: 600, fontSize: '15px', display: showProgress ? 'none' : 'inline-flex' }
      },
      cancelButtonProps: {
        size: 'large',
        style: { height: '48px', borderRadius: THEME_CONSTANTS.radius.md, display: showProgress ? 'none' : 'inline-flex' }
      },
      onOk: async () => {
        return new Promise(async (resolve) => {
          setShowProgress(true);
          setSendingProgress(0);

          // Immediately show progress modal
          modalInstance.update({
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
                    <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{estimatedCost} Credits</div>
                    <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>1 Credit per RCS message</div>
                  </div>
                </div>

                <div style={{ background: THEME_CONSTANTS.colors.primaryLight, border: `2px solid ${THEME_CONSTANTS.colors.primary}`, borderRadius: THEME_CONSTANTS.radius.lg, padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: THEME_CONSTANTS.colors.surface,
                      borderRadius: THEME_CONSTANTS.radius.lg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${THEME_CONSTANTS.colors.primary}`
                    }}>
                      <SendOutlined style={{ fontSize: '24px', color: THEME_CONSTANTS.colors.primary }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: THEME_CONSTANTS.colors.text }}>
                        Creating Campaign...
                      </div>
                      <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>
                        Processing bulk entries
                      </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.primary }}>
                      0%
                    </div>
                  </div>
                  <Progress
                    percent={0}
                    status="active"
                    strokeColor={THEME_CONSTANTS.colors.primary}
                    strokeWidth={10}
                    showInfo={false}
                  />
                </div>
              </div>
            ),
            okButtonProps: { style: { display: 'none' } },
            cancelButtonProps: { style: { display: 'none' } }
          });

          const updateModalContent = (progress) => {
            const isComplete = progress === 100;
            modalInstance.update({
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
                      <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>TOTAL CONTACTS</div>
                      <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{batchStats.total}</div>
                      <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>Ready to send</div>
                    </div>

                    <div style={{ background: THEME_CONSTANTS.colors.warning, borderRadius: THEME_CONSTANTS.radius.lg, padding: '16px', color: 'white' }}>
                      <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>ESTIMATED COST</div>
                      <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{estimatedCost} Credits</div>
                      <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>1 Credit per message</div>
                    </div>
                  </div>

                  <div style={{ background: isComplete ? THEME_CONSTANTS.colors.successLight : THEME_CONSTANTS.colors.primaryLight, border: `2px solid ${isComplete ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.primary}`, borderRadius: THEME_CONSTANTS.radius.lg, padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: THEME_CONSTANTS.colors.surface,
                        borderRadius: THEME_CONSTANTS.radius.lg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px solid ${isComplete ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.primary}`
                      }}>
                        <SendOutlined style={{ fontSize: '24px', color: isComplete ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.primary }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: THEME_CONSTANTS.colors.text }}>
                          {isComplete ? '✓ Campaign Created!' : 'Creating Campaign...'}
                        </div>
                        <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>
                          {progress < 90 ? 'Processing bulk entries' : isComplete ? 'Completed successfully' : 'Finalizing'}
                        </div>
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: isComplete ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.primary }}>
                        {Math.round(progress)}%
                      </div>
                    </div>
                    <Progress
                      percent={progress}
                      status={isComplete ? 'success' : 'active'}
                      strokeColor={isComplete ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.primary}
                      strokeWidth={10}
                      showInfo={false}
                    />
                  </div>
                </div>
              ),
              okButtonProps: { style: { display: 'none' } },
              cancelButtonProps: { style: { display: 'none' } }
            });
          };

          updateModalContent(0);

          const startTime = Date.now();
          let progressInterval = null;
          let apiCompleted = false;

          progressInterval = setInterval(() => {
            if (apiCompleted) return;

            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / 60000) * 85, 85);
            setSendingProgress(progress);
            updateModalContent(progress);

            if (progress >= 85) {
              clearInterval(progressInterval);
            }
          }, 100);

          try {
            const allContacts = capabilityResponse?.data || [];

            if (allContacts.length === 0) {
              clearInterval(progressInterval);
              setShowProgress(false);
              setSendingProgress(0);
              modalInstance.destroy();
              message.error('No contacts found');
              return;
            }

            const allNumbers = allContacts.map(contact => contact.phoneNumber);

            // Create campaign - this will handle both creation and entry processing
            const campaignRes = await dispatch(createMasterCampaign({
              name: campaignName,
              templateId: selectedTemplate._id,
              phoneNumbers: allNumbers
            })).unwrap();

            const campaignId = campaignRes.data.masterCampaign._id;
            const botId = campaignRes.data.botId;

            // Poll campaign status until it becomes 'pending' (Kafka completed)
            const pollStatus = async () => {
              const maxAttempts = 60;
              for (let i = 0; i < maxAttempts; i++) {
                await new Promise(resolve => setTimeout(resolve, 1000));

                try {
                  const statusRes = await dispatch(getCampaignById({ id: campaignId })).unwrap();
                  const currentStatus = statusRes.data?.status;

                  if (currentStatus === 'pending' || "completed") {
                    console.log('✅ Kafka completed all entries, status is now pending');
                    // Immediately jump to 100%
                    apiCompleted = true;
                    clearInterval(progressInterval);
                    setSendingProgress(100);
                    updateModalContent(100);
                    return true;
                  }

                  // Update progress during polling (85% to 95%)
                  const pollingProgress = 85 + (i / maxAttempts) * 10;
                  setSendingProgress(pollingProgress);
                  updateModalContent(pollingProgress);
                } catch (err) {
                  console.error('Status check error:', err);
                }
              }
              return false;
            };

            const completed = await pollStatus();

            if (completed) {
              // Status is pending - show 100% for 1.5 seconds then navigate
              setTimeout(() => {
                setShowProgress(false);
                setSendingProgress(0);
                modalInstance.destroy();
                message.success(`Campaign created on ${botId} with ${allContacts.length} contacts!`);

                setTimeout(() => {
                  navigate('/dashboard/reports');
                }, 200);
              }, 1500);
            } else {
              // Timeout - still complete the progress animation
              console.warn('⚠️ Timeout waiting for Kafka completion');
              apiCompleted = true;
              clearInterval(progressInterval);

              let currentProgress = Math.max(sendingProgress, 95);
              const completeInterval = setInterval(() => {
                currentProgress += 1;
                if (currentProgress >= 100) {
                  currentProgress = 100;
                  clearInterval(completeInterval);

                  setTimeout(() => {
                    setShowProgress(false);
                    setSendingProgress(0);
                    modalInstance.destroy();
                    message.success(`Campaign created on ${botId} with ${allContacts.length} contacts!`);

                    setTimeout(() => {
                      navigate('/dashboard/reports');
                    }, 200);
                  }, 1500);
                }
                setSendingProgress(currentProgress);
                updateModalContent(currentProgress);
              }, 100);
            }

          } catch (error) {
            apiCompleted = true;
            clearInterval(progressInterval);
            setShowProgress(false);
            setSendingProgress(0);
            modalInstance.destroy();
            message.error('Failed to create campaign: ' + (error.message || error));
          }
        });
      }
    });
  };

  const downloadDemo = () => {
    if (batchStats.total > 0 && capabilityResponse?.data) {
      try {
        const contacts = capabilityResponse.data;
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Contacts');
        
        sheet.columns = [
          { header: 'Index', key: 'index', width: 8 },
          { header: 'Phone Number', key: 'phone', width: 15 }
        ];
        
        contacts.forEach((contact, index) => {
          sheet.addRow({ index: index + 1, phone: contact.phoneNumber });
        });
        
        workbook.xlsx.writeBuffer().then(buffer => {
          const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `uploaded_contacts_${Date.now()}.xlsx`;
          a.click();
          window.URL.revokeObjectURL(url);
        });
        message.success(`Downloaded ${contacts.length} contacts`);
      } catch {
        message.error('Failed to download contacts');
      }
    } else {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Contacts');
      sheet.columns = [
        { header: 'Index', key: 'index', width: 8 },
        { header: 'Number', key: 'number', width: 15 }
      ];
      sheet.addRow({ index: 1, number: '7201000140' });
      sheet.addRow({ index: 2, number: '7201000141' });
      
      workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'demo_contacts.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      });
      message.success('Demo template downloaded');
    }
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
              <RCSCampaignTimeWarning />

              <Card style={{ marginBottom: '24px', borderRadius: THEME_CONSTANTS.radius.lg, border: `1px solid ${THEME_CONSTANTS.colors.borderLight}` }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>1. Campaign Name</h3>
                <Input
                  placeholder="Enter campaign name"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  size="large"
                />
              </Card>

              <Card style={{ marginBottom: '24px', borderRadius: THEME_CONSTANTS.radius.lg, border: `1px solid ${THEME_CONSTANTS.colors.borderLight}` }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>2. Select Template</h3>
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
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>3. Upload Contacts</h3>
                <Row gutter={[12, 12]}>
                  <Col span={8}>
                    <Upload beforeUpload={handleExcelUpload} showUploadList={false} accept=".xlsx,.xls,.csv">
                      <Button icon={<UploadOutlined />} loading={checking} style={{ width: '100%', height: '44px' }}>Upload Excel</Button>
                    </Upload>
                  </Col>
                  <Col span={8}>
                    <Button icon={<PlusOutlined />} onClick={() => setManualContactModal(true)} loading={checking} style={{ width: '100%', height: '44px' }}>Add Manual</Button>
                  </Col>
                  <Col span={8}>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={downloadDemo}
                      style={{ width: '100%', height: '44px' }}
                    >
                      Demo
                    </Button>
                  </Col>
                </Row>
                <Row gutter={[12, 12]} style={{ marginTop: '12px' }}>
                  <Col span={12}>
                    <Button
                      type="primary"
                      onClick={() => setShowContacts(!showContacts)}
                      disabled={batchStats.total === 0}
                      style={{ width: '100%', height: '44px' }}
                    >
                      {showContacts ? 'Hide' : 'Show'} Contacts ({batchStats.total})
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleClearContacts}
                      disabled={batchStats.total === 0}
                      style={{ width: '100%', height: '44px' }}
                    >
                      Clear All
                    </Button>
                  </Col>
                </Row>
                {checking && (
                  <div style={{
                    background: THEME_CONSTANTS.colors.surface,
                    padding: '24px',
                    borderRadius: THEME_CONSTANTS.radius.xl,
                    marginTop: '16px',
                    boxShadow: THEME_CONSTANTS.shadow.lg,
                    border: `2px solid ${THEME_CONSTANTS.colors.primary}`
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: THEME_CONSTANTS.colors.primaryLight,
                        borderRadius: THEME_CONSTANTS.radius.lg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px solid ${THEME_CONSTANTS.colors.primary}`
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          border: `3px solid ${THEME_CONSTANTS.colors.primary}`,
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: THEME_CONSTANTS.colors.text,
                          marginBottom: '4px',
                          letterSpacing: '-0.01em'
                        }}>
                          {checkingProgress === 100 ? '✓ Capability Check Complete!' : 'Checking RCS Capability'}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: THEME_CONSTANTS.colors.textSecondary,
                          fontWeight: 500
                        }}>
                          {checkingProgress < 85 ? 'Verifying contacts...' : checkingProgress === 100 ? 'All contacts verified' : 'Finalizing...'}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: checkingProgress === 100 ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.primary
                      }}>
                        {Math.round(checkingProgress)}%
                      </div>
                    </div>
                    <Progress
                      percent={checkingProgress}
                      status={checkingProgress === 100 ? 'success' : 'active'}
                      strokeColor={{
                        '0%': THEME_CONSTANTS.colors.primary,
                        '100%': THEME_CONSTANTS.colors.success,
                      }}
                      strokeWidth={10}
                      showInfo={false}
                    />
                  </div>
                )}
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginTop: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '36px', fontWeight: 700, color: THEME_CONSTANTS.colors.primary }}>{batchStats.total}</div>
                    <div style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '8px', fontWeight: 600 }}>Total Contacts Uploaded</div>
                  </div>
                </div>
                {showContacts && batchStats.total > 0 && capabilityResponse?.data && (
                  <div style={{ marginTop: '16px', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                    <div style={{ padding: '12px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                      <strong>All Contacts</strong>
                    </div>
                    <ContactsTable
                      contacts={capabilityResponse.data}
                      onDelete={handleDeleteContact}
                      loading={false}
                    />
                  </div>
                )}
                {showReachableUsers && batchStats.rcsCapable > 0 && capabilityResponse?.data && (
                  <div style={{ marginTop: '16px', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                    <div style={{ padding: '12px', background: '#f6ffed', borderBottom: '1px solid #b7eb8f' }}>
                      <strong style={{ color: '#52c41a' }}>RCS Ready Contacts</strong>
                    </div>
                    <ContactsTable
                      contacts={capabilityResponse.data.filter(c => c.isCapable)}
                      onDelete={handleDeleteContact}
                      loading={false}
                    />
                  </div>
                )}
              </Card>

              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendCampaign}
                disabled={!selectedTemplate || !campaignName.trim() || batchStats.total === 0 || isAfter10PM()}
                size="large"
                block
                style={{ 
                  height: '52px', 
                  fontSize: '16px', 
                  fontWeight: 600,
                  opacity: isAfter10PM() ? 0.6 : 1
                }}
              >
                {isAfter10PM() 
                  ? '🚫 Campaign Creation Disabled (After 10 PM)' 
                  : `Send Campaign (${batchStats.total} contacts)`
                }
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





















