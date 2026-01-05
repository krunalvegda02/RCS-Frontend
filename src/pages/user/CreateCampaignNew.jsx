import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Row, Col, Input, Upload, Empty, message, Breadcrumb, Select, Modal, Form } from 'antd';
import { SendOutlined, UploadOutlined, DownloadOutlined, HomeOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { THEME_CONSTANTS } from '../../theme';
import { fetchUserTemplates } from '../../redux/slices/templateSlice';
import { checkCapability } from '../../redux/slices/campaignSlice';
import { _post } from '../../helper/apiClient.jsx';
import RCSMessagePreview from '../../components/RCSMesagePreview';

// Add keyframes for spinner animation
const spinnerStyle = document.createElement('style');
spinnerStyle.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(spinnerStyle);

export default function CreateCampaignNew() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { userTemplates, loading: templatesLoading } = useSelector(state => state.templates);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [campaignName, setCampaignName] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [manualContactModal, setManualContactModal] = useState(false);
  const [manualContactForm] = Form.useForm();
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsPerPage, setContactsPerPage] = useState(10);

  const validRcsContacts = recipients.filter(c => c.capable === true);
  const checkingContacts = recipients.filter(c => c.checking === true);
  
  // Paginate contacts for display
  const paginatedContacts = validRcsContacts.slice(
    (contactsPage - 1) * contactsPerPage,
    contactsPage * contactsPerPage
  );

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchUserTemplates({ userId: user._id, page: 1, limit: 1000 }));
    }
  }, [user, dispatch]);

  const handleExcelUpload = async (file) => {
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

        const newContacts = imported.map(phone => ({
          id: `${Date.now()}_${Math.random()}`,
          number: `+91${phone}`,
          capable: null,
          checking: true
        }));

        setRecipients(prev => [...prev, ...newContacts]);

        const result = await dispatch(checkCapability({ phoneNumbers: imported, userId: user._id })).unwrap();

        if (result?.data) {
          setRecipients(prev => prev.map(contact => {
            const phoneWithoutPrefix = contact.number.replace('+91', '');
            const capabilityResult = result.data.find(r => {
              const resultPhone = r.phoneNumber.replace(/^\+?91/, '');
              return resultPhone === phoneWithoutPrefix;
            });
            if (capabilityResult && imported.includes(phoneWithoutPrefix)) {
              return { ...contact, capable: capabilityResult.isCapable, checking: false };
            }
            return contact;
          }));
          const rcsCount = result.summary?.rcsCapable || result.data.filter(r => r.isCapable).length;
          message.success(`${imported.length} contacts uploaded! ${rcsCount} are RCS capable.`);
        }
        setUploading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      message.error('Upload failed: ' + error.message);
      setUploading(false);
    }
    return false;
  };

  const handleAddContact = async (values) => {
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
      const existingNumbers = new Set(recipients.map(r => r.number));

      for (let phone of numbers) {
        if (!phone.startsWith('+91')) {
          if (phone.startsWith('91') && phone.length === 12) phone = '+' + phone;
          else if (phone.length === 10) phone = '+91' + phone;
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
      message.success(`${newContacts.length} contacts added. Checking RCS capability...`);

      const result = await dispatch(checkCapability({ phoneNumbers: phoneNumbersOnly, userId: user._id })).unwrap();
      if (result?.data) {
        setRecipients(prev => prev.map(contact => {
          const phoneWithoutPrefix = contact.number.replace('+91', '');
          const capabilityResult = result.data.find(r => {
            const resultPhone = r.phoneNumber.replace(/^\+?91/, '');
            return resultPhone === phoneWithoutPrefix;
          });
          if (capabilityResult && phoneNumbersOnly.includes(phoneWithoutPrefix)) {
            return { ...contact, capable: capabilityResult.isCapable, checking: false };
          }
          return contact;
        }));
      }
    } catch (error) {
      message.error('Error adding contacts: ' + error.message);
    }
  };

  const handleSendCampaign = () => {
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
              <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{validRcsContacts.length}</div>
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
              <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.text, lineHeight: 1.5 }}>Messages will be sent to {validRcsContacts.length} RCS capable contacts immediately.</div>
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

          hideLoading();
          if (response.data.success) {
            message.success('Campaign started successfully!');
            navigate('/reports');
          }
        } catch (error) {
          hideLoading();
          message.error('Failed to start campaign: ' + error.message);
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
                <Row gutter={[12, 12]}>
                  <Col span={8}>
                    <Upload beforeUpload={handleExcelUpload} showUploadList={false} accept=".xlsx,.xls,.csv">
                      <Button icon={<UploadOutlined />} loading={uploading} style={{ width: '100%', height: '44px' }}>Upload Excel</Button>
                    </Upload>
                  </Col>
                  <Col span={8}>
                    <Button icon={<PlusOutlined />} onClick={() => setManualContactModal(true)} style={{ width: '100%', height: '44px' }}>Add Manually</Button>
                  </Col>
                  <Col span={8}>
                    <Button icon={<DownloadOutlined />} onClick={downloadDemo} style={{ width: '100%', height: '44px' }}>Download Demo</Button>
                  </Col>
                </Row>
                {recipients.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Uploaded Contacts</h4>
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setRecipients([])}>Clear All</Button>
                    </div>
                    
                    {checkingContacts.length > 0 && (
                      <div style={{ 
                        background: '#e6f7ff', 
                        border: '1px solid #91d5ff',
                        padding: '12px 16px', 
                        borderRadius: '8px', 
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{ 
                          width: '20px', 
                          height: '20px', 
                          border: '3px solid #1890ff',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1890ff' }}>
                            Checking RCS Capability...
                          </div>
                          <div style={{ fontSize: '12px', color: '#096dd9', marginTop: '2px' }}>
                            {checkingContacts.length} contact{checkingContacts.length > 1 ? 's' : ''} being verified
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                      <Row gutter={[16, 16]}>
                        <Col span={8}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.text }}>{recipients.length}</div>
                            <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>Total</div>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.success }}>{validRcsContacts.length}</div>
                            <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>RCS Ready</div>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#ff4d4f' }}>{recipients.length - validRcsContacts.length}</div>
                            <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>Invalid</div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                    <div style={{ border: `1px solid ${THEME_CONSTANTS.colors.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ height: '300px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary, borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` }}>SN</th>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary, borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` }}>Phone</th>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary, borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` }}>Status</th>
                              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary, borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedContacts.map((contact, idx) => {
                              const globalIndex = (contactsPage - 1) * contactsPerPage + idx + 1;
                              return (
                                <tr key={contact.id} style={{ borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`, background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                  <td style={{ padding: '8px 16px', fontSize: '13px' }}>{globalIndex}</td>
                                  <td style={{ padding: '8px 16px', fontSize: '13px', fontFamily: 'monospace', color: THEME_CONSTANTS.colors.success }}>{contact.number}</td>
                                  <td style={{ padding: '8px 16px', fontSize: '13px' }}>
                                    <span style={{ background: '#f6ffed', color: THEME_CONSTANTS.colors.success, padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>✓ RCS Ready</span>
                                  </td>
                                  <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => setRecipients(recipients.filter(c => c.id !== contact.id))} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {validRcsContacts.length > 0 && (
                        <div style={{ padding: '12px 16px', borderTop: `1px solid ${THEME_CONSTANTS.colors.border}`, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>
                              Showing {((contactsPage - 1) * contactsPerPage) + 1} - {Math.min(contactsPage * contactsPerPage, validRcsContacts.length)} of {validRcsContacts.length}
                            </span>
                            <Select
                              size="small"
                              value={contactsPerPage}
                              onChange={(value) => {
                                setContactsPerPage(value);
                                setContactsPage(1);
                              }}
                              style={{ width: '100px' }}
                              options={[
                                { label: '10 / page', value: 10 },
                                { label: '25 / page', value: 25 },
                                { label: '50 / page', value: 50 },
                                { label: '100 / page', value: 100 },
                              ]}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Button 
                              size="small" 
                              disabled={contactsPage === 1}
                              onClick={() => setContactsPage(p => p - 1)}
                            >
                              Previous
                            </Button>
                            <span style={{ padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 600 }}>
                              Page {contactsPage} of {Math.ceil(validRcsContacts.length / contactsPerPage)}
                            </span>
                            <Button 
                              size="small" 
                              disabled={contactsPage >= Math.ceil(validRcsContacts.length / contactsPerPage)}
                              onClick={() => setContactsPage(p => p + 1)}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
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
                disabled={!selectedTemplate || !campaignName.trim() || validRcsContacts.length === 0}
                size="large"
                block
                style={{ height: '52px', fontSize: '16px', fontWeight: 600 }}
              >
                Send Campaign ({validRcsContacts.length} contacts)
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
