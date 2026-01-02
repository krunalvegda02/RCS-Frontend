import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Form, Button, Row, Col, Input, Upload, Modal, Tag, Alert, Table, Popconfirm, message, Breadcrumb, Select, Divider } from 'antd';
import { SendOutlined, UploadOutlined, DeleteOutlined, DownloadOutlined, HomeOutlined, FileExcelOutlined, FormOutlined, PlusOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import RCSMessagePreview from '../../components/RCSMesagePreview.jsx';
import { THEME_CONSTANTS } from '../../theme';
import { fetchUserTemplates } from '../../redux/slices/templateSlice';
import { checkCapability } from '../../redux/slices/campaignSlice';
import { _post } from '../../helper/apiClient.jsx';

const MESSAGE_TYPES = {
  text: 'Plain Text',
  'text-with-action': 'Text with Actions',
  rcs: 'RCS Rich Card',
  carousel: 'Carousel',
};

function CreateCampaignSinglePage() {
  const { user } = useSelector(state => state.auth);
  const { balance, availableBalance, formattedAvailableBalance, checkBalance } = useWallet();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { userTemplates, loading: templatesLoading } = useSelector(state => state.templates);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [campaignName, setCampaignName] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [manualContactModal, setManualContactModal] = useState(false);
  const [manualContactForm] = Form.useForm();
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);

  const validRcsContacts = recipients.filter(contact => contact.capable === true);

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchUserTemplates({ userId: user._id }));
    }
  }, [user, dispatch]);

  useEffect(() => {
    let filtered = userTemplates;
    if (templateSearch) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(templateSearch.toLowerCase())
      );
    }
    if (templateFilter !== 'all') {
      filtered = filtered.filter(template => template.messageType === templateFilter);
    }
    setFilteredTemplates(filtered);
  }, [userTemplates, templateSearch, templateFilter]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    message.success(`Template "${template.name}" selected`);
  };

  const handleExcelUpload = async (file) => {
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        const imported = [];
        const seen = new Set();

        for (let row of data.slice(1)) {
          let num = String(row[0] || '').trim().replace(/[\s\-()\.]/g, '');
          if (num.startsWith('+91')) num = num.substring(3);
          else if (num.startsWith('91') && num.length > 10) num = num.substring(2);
          if (/^\d{10}$/.test(num) && !seen.has(num)) {
            seen.add(num);
            imported.push(num);
          }
        }

        if (imported.length === 0) {
          message.error('No valid phone numbers found');
          return;
        }

        const hideLoading = message.loading(`Processing ${imported.length} contacts...`, 0);
        
        const newContacts = imported.map(phone => ({
          id: `${Date.now()}_${Math.random()}`,
          number: `+91${phone}`,
          capable: null,
          checking: true
        }));
        
        setRecipients(prev => [...prev, ...newContacts]);

        try {
          const result = await dispatch(checkCapability({
            phoneNumbers: imported,
            userId: user._id
          })).unwrap();
          
          hideLoading();
          
          if (result?.data) {
            setRecipients(prev => prev.map(contact => {
              const phoneWithoutPrefix = contact.number.replace('+91', '');
              const capabilityResult = result.data.find(r => r.phoneNumber === phoneWithoutPrefix);
              if (capabilityResult && imported.includes(phoneWithoutPrefix)) {
                return { ...contact, capable: capabilityResult.isCapable, checking: false };
              }
              return contact;
            }));
            
            const rcsCount = result.data.filter(r => r.isCapable).length;
            message.success(`${imported.length} contacts uploaded! ${rcsCount} are RCS capable.`);
          }
        } catch (error) {
          hideLoading();
          setRecipients(prev => prev.map(contact => {
            const phoneWithoutPrefix = contact.number.replace('+91', '');
            if (imported.includes(phoneWithoutPrefix)) {
              return { ...contact, capable: false, checking: false };
            }
            return contact;
          }));
          message.warning(`${imported.length} contacts uploaded, but capability check failed.`);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      message.error('Error uploading file: ' + error.message);
    }
    return false;
  };

  const handleAddContact = async (values) => {
    const numbers = values.phone.trim().split(/[\n,]+/).map(num => num.trim().replace(/[\s\-()]/g, '')).filter(num => num.length > 0);
    const validNumbers = [];
    const existingNumbers = new Set(recipients.map(r => r.number));

    for (let phone of numbers) {
      if (!phone.startsWith('+91')) {
        if (phone.length === 10) phone = '+91' + phone;
        else continue;
      }
      if (/^\+91\d{10}$/.test(phone) && !existingNumbers.has(phone)) {
        validNumbers.push(phone);
      }
    }

    if (validNumbers.length === 0) {
      message.warning('No new valid numbers found');
      return;
    }

    const phoneNumbersOnly = validNumbers.map(phone => phone.replace('+91', ''));
    const newContacts = phoneNumbersOnly.map(phone => ({
      id: `${Date.now()}_${Math.random()}`,
      number: `+91${phone}`,
      capable: null,
      checking: true
    }));
    
    setRecipients(prev => [...prev, ...newContacts]);
    manualContactForm.resetFields();
    setManualContactModal(false);
    message.success(`${newContacts.length} contacts added`);

    try {
      const result = await dispatch(checkCapability({
        phoneNumbers: phoneNumbersOnly,
        userId: user._id
      })).unwrap();
      
      if (result?.data) {
        setRecipients(prev => prev.map(contact => {
          const phoneWithoutPrefix = contact.number.replace('+91', '');
          const capabilityResult = result.data.find(r => r.phoneNumber === phoneWithoutPrefix);
          if (capabilityResult) {
            return { ...contact, capable: capabilityResult.isCapable, checking: false };
          }
          return contact;
        }));
      }
    } catch (error) {
      setRecipients(prev => prev.map(contact => ({ ...contact, capable: false, checking: false })));
    }
  };

  const deleteContact = (id) => {
    setRecipients(recipients.filter(c => c.id !== id));
    message.success('Contact removed');
  };

  const downloadDemoExcel = () => {
    const demoData = [['Index', 'Number'], ['1', '7201000140'], ['2', '7201000141'], ['3', '7201000142']];
    const ws = XLSX.utils.aoa_to_sheet(demoData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
    XLSX.writeFile(wb, 'demo_contacts.xlsx');
    message.success('Demo file downloaded');
  };

  const handleSendCampaign = async () => {
    if (!selectedTemplate) {
      message.error('Please select a template');
      return;
    }
    if (!campaignName.trim()) {
      message.error('Please enter campaign name');
      return;
    }
    if (validRcsContacts.length === 0) {
      message.error('No valid RCS contacts found');
      return;
    }

    const estimatedCost = validRcsContacts.length * 1;
    if (!checkBalance(estimatedCost)) {
      return;
    }

    Modal.confirm({
      title: 'Confirm Campaign',
      content: `Send campaign "${campaignName}" to ${validRcsContacts.length} RCS contacts? Cost: ₹${estimatedCost}`,
      onOk: async () => {
        setSending(true);
        try {
          const response = await _post('v1/campaigns/send-bulk', {
            name: campaignName.trim(),
            templateId: selectedTemplate._id,
            recipients: validRcsContacts.map(c => ({
              phoneNumber: c.number.replace('+91', ''),
              isRcsCapable: true,
              variables: {}
            })),
            autoStart: true
          }, {}, localStorage.getItem('token'));
          
          if (response.data.success) {
            Modal.success({
              title: 'Campaign Started!',
              content: `Campaign "${campaignName}" started successfully!`,
              onOk: () => navigate('/reports')
            });
          }
        } catch (error) {
          message.error(error?.response?.data?.message || 'Failed to start campaign');
        } finally {
          setSending(false);
        }
      }
    });
  };

  const contactsColumns = [
    { title: 'Phone', dataIndex: 'number', key: 'number', render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span> },
    { title: 'Status', dataIndex: 'capable', key: 'capable', render: (capable) => capable ? <Tag color="green">RCS Ready</Tag> : <Tag color="red">Not RCS</Tag> },
    { title: 'Action', key: 'action', render: (_, record) => <Popconfirm title="Remove?" onConfirm={() => deleteContact(record.id)}><Button type="text" danger size="small" icon={<DeleteOutlined />} /></Popconfirm> }
  ];

  const templateColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (text) => <span style={{ fontWeight: 600 }}>{text}</span> },
    { title: 'Type', dataIndex: 'messageType', key: 'type', render: (type) => <Tag color="blue">{MESSAGE_TYPES[type]}</Tag> },
    { title: 'Action', key: 'action', render: (_, record) => (
      <Button type={selectedTemplate?._id === record._id ? 'primary' : 'default'} size="small" onClick={() => handleTemplateSelect(record)}>
        {selectedTemplate?._id === record._id ? 'Selected' : 'Select'}
      </Button>
    )}
  ];

  return (
    <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh', padding: THEME_CONSTANTS.spacing.xl }}>
      <div style={{ maxWidth: THEME_CONSTANTS.layout.maxContentWidth, margin: '0 auto' }}>
        <Breadcrumb style={{ marginBottom: THEME_CONSTANTS.spacing.lg }}>
          <Breadcrumb.Item><HomeOutlined /> Home</Breadcrumb.Item>
          <Breadcrumb.Item>Create Campaign</Breadcrumb.Item>
        </Breadcrumb>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: THEME_CONSTANTS.spacing.xxl }}>
          <div>
            <h1 style={{ fontSize: THEME_CONSTANTS.typography.h1.size, fontWeight: THEME_CONSTANTS.typography.h1.weight, margin: 0, color: THEME_CONSTANTS.colors.text, fontFamily: THEME_CONSTANTS.typography.fontFamily, letterSpacing: '-0.02em' }}>
              Create RCS Campaign
            </h1>
            <p style={{ color: THEME_CONSTANTS.colors.textSecondary, margin: '8px 0 0 0', fontFamily: THEME_CONSTANTS.typography.fontFamily, letterSpacing: '-0.01em' }}>
              Select template, add contacts, and launch your campaign
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textMuted }}>Available Balance</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.primary }}>{formattedAvailableBalance}</div>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card title="Campaign Details" style={{ marginBottom: 24, borderRadius: THEME_CONSTANTS.radius.lg, boxShadow: THEME_CONSTANTS.shadow.base }}>
              <Form form={form} layout="vertical">
                <Form.Item label="Campaign Name" required>
                  <Input placeholder="Enter campaign name" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} size="large" />
                </Form.Item>
              </Form>
            </Card>

            <Card title="Select Template" extra={<Input.Search placeholder="Search templates" onChange={(e) => setTemplateSearch(e.target.value)} style={{ width: 250 }} />} style={{ marginBottom: 24, borderRadius: THEME_CONSTANTS.radius.lg, boxShadow: THEME_CONSTANTS.shadow.base }}>
              <Select value={templateFilter} onChange={setTemplateFilter} style={{ width: 200, marginBottom: 16 }}>
                <Select.Option value="all">All Types</Select.Option>
                <Select.Option value="text">Plain Text</Select.Option>
                <Select.Option value="rcs">RCS Rich Card</Select.Option>
                <Select.Option value="carousel">Carousel</Select.Option>
              </Select>
              <Table columns={templateColumns} dataSource={filteredTemplates} rowKey="_id" pagination={{ pageSize: 5 }} loading={templatesLoading} size="small" />
            </Card>

            <Card title={`Recipients (${validRcsContacts.length} RCS Ready)`} extra={
              <div style={{ display: 'flex', gap: 8 }}>
                <Upload beforeUpload={handleExcelUpload} accept=".xlsx,.xls,.csv" showUploadList={false}>
                  <Button icon={<UploadOutlined />} size="small">Upload Excel</Button>
                </Upload>
                <Button icon={<PlusOutlined />} onClick={() => setManualContactModal(true)} size="small">Add Manual</Button>
                <Button icon={<DownloadOutlined />} onClick={downloadDemoExcel} size="small">Demo File</Button>
              </div>
            } style={{ borderRadius: THEME_CONSTANTS.radius.lg, boxShadow: THEME_CONSTANTS.shadow.base }}>
              {recipients.length > 0 ? (
                <Table columns={contactsColumns} dataSource={validRcsContacts} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
              ) : (
                <Alert message="No contacts added yet" type="info" showIcon />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <div style={{ position: 'sticky', top: 24 }}>
              <Card title="Preview" extra={selectedTemplate && <Button type="link" icon={<EyeOutlined />} onClick={() => setShowPreview(true)}>Full Preview</Button>} style={{ marginBottom: 24, borderRadius: THEME_CONSTANTS.radius.lg, boxShadow: THEME_CONSTANTS.shadow.base }}>
                {selectedTemplate ? (
                  <div style={{ maxWidth: 350, margin: '0 auto' }}>
                    <RCSMessagePreview data={selectedTemplate} />
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: THEME_CONSTANTS.colors.textMuted }}>
                    Select a template to preview
                  </div>
                )}
              </Card>

              <Card title="Campaign Summary" style={{ borderRadius: THEME_CONSTANTS.radius.lg, boxShadow: THEME_CONSTANTS.shadow.base }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: THEME_CONSTANTS.colors.textMuted }}>Template</div>
                  <div style={{ fontWeight: 600 }}>{selectedTemplate?.name || 'Not selected'}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: THEME_CONSTANTS.colors.textMuted }}>RCS Contacts</div>
                  <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.success }}>{validRcsContacts.length}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: THEME_CONSTANTS.colors.textMuted }}>Estimated Cost</div>
                  <div style={{ fontWeight: 600, fontSize: 20, color: THEME_CONSTANTS.colors.primary }}>₹{validRcsContacts.length}</div>
                </div>
                <Divider />
                <Button type="primary" size="large" block icon={<SendOutlined />} onClick={handleSendCampaign} loading={sending} disabled={!selectedTemplate || validRcsContacts.length === 0 || !campaignName.trim()}>
                  Send Campaign
                </Button>
              </Card>
            </div>
          </Col>
        </Row>

        <Modal title="Add Contacts Manually" open={manualContactModal} onCancel={() => setManualContactModal(false)} footer={null}>
          <Form form={manualContactForm} onFinish={handleAddContact} layout="vertical">
            <Form.Item label="Phone Numbers" name="phone" rules={[{ required: true, message: 'Enter phone numbers' }]}>
              <Input.TextArea rows={6} placeholder="Enter phone numbers (one per line or comma separated)&#10;Example:&#10;9876543210&#10;9876543211" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>Add Contacts</Button>
          </Form>
        </Modal>

        <Modal title="Template Preview" open={showPreview} onCancel={() => setShowPreview(false)} footer={null} width={500}>
          {selectedTemplate && <RCSMessagePreview data={selectedTemplate} />}
        </Modal>
      </div>
    </div>
  );
}

export default CreateCampaignSinglePage;
