import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Row, Col, Input, Upload, Empty, message, Breadcrumb, Select, Modal, Form, Table, Tag, Spin, Progress } from 'antd';
import { SendOutlined, UploadOutlined, DownloadOutlined, HomeOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { THEME_CONSTANTS } from '../../theme';
import { fetchUserTemplates } from '../../redux/slices/templateSlice';
import { checkCapability, createCampaign, createCampaignEntries, getAllContactsFromBatches, getReachableUsers, clearContactBatches, deleteContactFromBatch, clearCapabilityResults } from '../../redux/slices/campaignSlice';
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

const ReachableUsersList = ({ campaignId, totalRcsCapable, onContactDeleted }) => {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;
  const dispatch = useDispatch();
  const { contactBatches } = useSelector(state => state.campaigns);

  useEffect(() => {
    if (campaignId) {
      loadReachableUsers();
    }
  }, [campaignId, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    setUsers([]);
  }, [totalRcsCapable]);

  const loadReachableUsers = async () => {
    setLoading(true);
    try {
      const latestBatch = contactBatches.length > 0 ? contactBatches[contactBatches.length - 1] : null;
      const batchNumber = latestBatch?.batchNumber;
      
      const response = await dispatch(getReachableUsers({ 
        campaignId, 
        page: currentPage, 
        limit: pageSize,
        batchNumber 
      })).unwrap();
      setUsers(response.data);
    } catch {
      message.error('Failed to load reachable users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (phoneNumber) => {
    try {
      await dispatch(deleteContactFromBatch({ campaignId, phoneNumber })).unwrap();
      message.success('Contact deleted');
      loadReachableUsers();
      if (onContactDeleted) onContactDeleted();
    } catch {
      message.error('Failed to delete contact');
    }
  };

  return (
    <Table
      dataSource={users}
      loading={loading}
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: totalRcsCapable,
        onChange: (page) => setCurrentPage(page),
        showSizeChanger: false,
        showTotal: (total) => `Total ${total} RCS ready contacts`
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
          key: 'status',
          render: () => <Tag color="green">✓ RCS Ready</Tag>
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

const PaginatedContactList = ({ campaignId, totalContacts, onContactDeleted }) => {
  const [contacts, setContacts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    if (campaignId) {
      loadContacts();
    }
  }, [campaignId, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    setContacts([]);
  }, [totalContacts]);

  const dispatch = useDispatch();

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await dispatch(getAllContactsFromBatches({ campaignId, page: currentPage, limit: pageSize })).unwrap();
      setContacts(response.data || []);
      
      if (response.pagination?.pages && currentPage > response.pagination.pages && response.pagination.pages > 0) {
        setCurrentPage(response.pagination.pages);
      }
    } catch {
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
      if (onContactDeleted) onContactDeleted();
    } catch {
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
        onChange: (page) => {
          const maxPage = Math.ceil(totalContacts / pageSize);
          setCurrentPage(Math.min(page, maxPage));
        },
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

    setChecking(true);

    try {
      message.success(`${phoneNumbers.length} contacts uploaded!`);
      
      // Call checkCapability API directly
      const response = await dispatch(checkCapability({ phoneNumbers })).unwrap();
      
      console.log('✅ Capability Check Response:', response);
      console.log('📊 Summary:', response.summary);
      console.log('📋 Data:', response.data);
      console.log('🔄 API Used:', response.summary?.apiUsed);
      
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
      
      setChecking(false);
    } catch (error) {
      const errorMsg = error?.message || error?.data?.message || String(error);
      message.error(`Error processing contacts: ${errorMsg}`);
      setChecking(false);
    }
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
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const seen = new Set();

        for (let row of data) {
          if (!row || row.length === 0) continue;
          row.forEach((cell) => {
            if (!cell) return;
            let num = String(cell).trim().replace(/[\s\-().]/g, '').replace(/[^\d+]/g, '');
            if (num.startsWith('+91')) num = num.substring(3);
            else if (num.startsWith('91') && num.length > 10) num = num.substring(2);
            else if (num.startsWith('0')) num = num.substring(1);
            if (/^\d{10}$/.test(num)) seen.add('+91' + num);
          });
        }

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

  const handleClearContacts = () => {
    Modal.confirm({
      title: 'Clear All Contacts?',
      content: 'This will remove all uploaded contacts and batches. This action cannot be undone.',
      okText: 'Yes, Clear All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        dispatch(clearContactBatches());
        dispatch(clearCapabilityResults());
        setBatchStats({ total: 0, rcsCapable: 0, notCapable: 0 });
        setCapabilityResponse(null);
        setCampaignId(null);
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
        const hideLoading = message.loading('Creating campaign...', 0);
        try {
          const rcsNumbers = capabilityResponse?.data
            ?.filter(contact => contact.isCapable)
            ?.map(contact => contact.phoneNumber) || [];

          if (rcsNumbers.length === 0) {
            hideLoading();
            message.error('No RCS-capable contacts found');
            return;
          }

          const campaignRes = await dispatch(createCampaign({
            name: campaignName,
            templateId: selectedTemplate._id,
            userId: user._id,
            status: 'pending'
          })).unwrap();
          
          const newCampaignId = campaignRes.data._id;

          await dispatch(createCampaignEntries({
            campaignId: newCampaignId,
            templateId: selectedTemplate._id,
            phoneNumbers: rcsNumbers
          })).unwrap();

          hideLoading();
          message.success('Campaign started successfully! Entries are being created in background.');
          navigate('/reports');
        } catch (error) {
          hideLoading();
          message.error('Failed to create campaign: ' + (error.message || error));
        }
      }
    });
  };

  const downloadDemo = async () => {
    // If contacts are uploaded, download them
    if (campaignId && batchStats.total > 0) {
      try {
        const response = await dispatch(getAllContactsFromBatches({ 
          campaignId, 
          page: 1, 
          limit: 10 
        })).unwrap();
        
        const contacts = response.data || [];
        
        if (contacts.length === 0) {
          message.warning('No contacts found to download');
          return;
        }

        // Create Excel with uploaded contacts
        const data = [['Index', 'Phone Number', 'Status']];
        contacts.forEach((contact, index) => {
          const status = contact.isRcsCapable === true ? 'RCS Ready' : 
                        contact.isRcsCapable === false ? 'Not Capable' : 'Checking...';
          data.push([index + 1, contact.phoneNumber, status]);
        });

        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [{ wch: 8 }, { wch: 15 }, { wch: 15 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
        XLSX.writeFile(wb, `uploaded_contacts_${Date.now()}.xlsx`);
        message.success(`Downloaded ${contacts.length} contacts`);
      } catch {
        message.error('Failed to download contacts');
      }
    } else {
      // Download demo template
      const data = [['Index', 'Number'], ['1', '7201000140'], ['2', '7201000141']];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
      XLSX.writeFile(wb, 'demo_contacts.xlsx');
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
                  <Col span={8}>
                    <Button 
                      type="primary"
                      ghost
                      onClick={() => setShowReachableUsers(!showReachableUsers)}
                      disabled={batchStats.rcsCapable === 0}
                      style={{ width: '100%', height: '44px' }}
                    >
                      {showReachableUsers ? 'Hide' : 'Show'} RCS ({batchStats.rcsCapable})
                    </Button>
                  </Col>
                  <Col span={8}>
                    <Button 
                      type="primary"
                      onClick={() => setShowContacts(!showContacts)}
                      disabled={batchStats.total === 0}
                      style={{ width: '100%', height: '44px' }}
                    >
                      {showContacts ? 'Hide' : 'Show'} All ({batchStats.total})
                    </Button>
                  </Col>
                  <Col span={8}>
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
                      gap: '16px'
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
                          Checking RCS Capability
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          color: THEME_CONSTANTS.colors.textSecondary,
                          fontWeight: 500
                        }}>
                          Please wait while we verify your contacts...
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
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
                    <div style={{ padding: '12px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                      <strong>All Contacts</strong>
                    </div>
                    <PaginatedContactList 
                      campaignId={campaignId} 
                      totalContacts={batchStats.total}
                    />
                  </div>
                )}
                {showReachableUsers && batchStats.rcsCapable > 0 && campaignId && (
                  <div style={{ marginTop: '16px', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                    <div style={{ padding: '12px', background: '#f6ffed', borderBottom: '1px solid #b7eb8f' }}>
                      <strong style={{ color: '#52c41a' }}>RCS Ready Contacts (For Sending)</strong>
                    </div>
                    <ReachableUsersList 
                      campaignId={campaignId} 
                      totalRcsCapable={batchStats.rcsCapable}
                    />
                  </div>
                )}
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
