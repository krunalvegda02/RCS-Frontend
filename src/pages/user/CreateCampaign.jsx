import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Form,
  Button,
  Space,
  Row,
  Col,
  Steps,
  DatePicker,
  Upload,
  Divider,
  Modal,
  Input,
  Empty,
  Tag,
  Tooltip,
  Alert,
  Statistic,
  Progress,
  Layout,
  Breadcrumb,
  Badge,
  Avatar,
  Drawer,
  Radio,
  Checkbox,
  Spin,
  Popconfirm,
  Select,
  Table,
  message,
} from 'antd';
import {
  SendOutlined,
  UploadOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  CalendarOutlined,
  FileExcelOutlined,
  FormOutlined,
  CopyOutlined,
  CloseOutlined,
  CheckOutlined,
  ArrowRightOutlined,
  HomeOutlined,
  FileTextOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  PercentageOutlined,
  RiseOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { FaMobileAlt, FaCheckDouble } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import RCSMessagePreview from '../../components/RCSMesagePreview';
import ContactUpload from '../../components/ContactUpload';
import { THEME_CONSTANTS } from '../../theme';
import { fetchUserTemplates } from '../../redux/slices/templateSlice';
import { sendBulkMessage, checkCapability } from '../../redux/slices/campaignSlice';
import { _get, _post } from '../../helper/apiClient.jsx';
import { useContactUpload } from '../../hooks/useContactUpload';

// Add CSS for animations
const styles = `
  @keyframes progressFill {
    0% { width: 0%; }
    100% { width: 100%; }
  }
  
  .custom-step-circle {
    position: relative;
  }
  
  .custom-step-number {
    position: absolute;
    top: -8px;
    right: -8px;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

const MESSAGE_TYPES = {
  text: 'Plain Text',
  'text-with-action': 'Text with Actions',
  rcs: 'RCS Rich Card',
  carousel: 'Carousel',
  webview: 'Webview Action',
  'dialer-action': 'Dialer Action',
};

const BUTTON_TYPES = ['URL Button', 'Call Button', 'Quick Reply Button'];

const VirtualizedContactList = ({ contacts, deleteContact, loading }) => {
  // Only show valid RCS contacts
  const displayContacts = contacts.filter(contact => contact.capable === true);
  
  const [scrollTop, setScrollTop] = useState(0);
  const itemHeight = 50;
  const containerHeight = 384;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 5, displayContacts.length);
  const visibleItems = displayContacts.slice(startIndex, endIndex);
  const totalHeight = displayContacts.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  if (displayContacts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Empty description="No valid RCS contacts found" />
        {contacts.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <Alert 
              message={`${contacts.length} contacts uploaded, but none are RCS capable`}
              type="warning"
              showIcon
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ border: `1px solid ${THEME_CONSTANTS.colors.border}`, borderRadius: THEME_CONSTANTS.radius.md, overflow: 'hidden' }}>
      <div
        style={{ height: containerHeight, overflowY: 'auto' }}
        onScroll={(e) => setScrollTop(e.target.scrollTop)}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary, borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
                    SN
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary, borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
                    Phone
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary, borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
                    Status
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary, borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((contact, idx) => {
                  const actualIndex = startIndex + idx;

                  return (
                    <tr
                      key={contact.id}
                      style={{
                        height: itemHeight,
                        borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`,
                        background: actualIndex % 2 === 0 ? '#ffffff' : '#f8fafc',
                      }}
                    >
                      <td style={{ padding: '8px 16px', fontSize: '13px' }}>{actualIndex + 1}</td>
                      <td style={{ padding: '8px 16px', fontSize: '13px', fontFamily: 'monospace' }}>
                        <span style={{ color: THEME_CONSTANTS.colors.success }}>
                          {contact.number}
                        </span>
                      </td>
                      <td style={{ padding: '8px 16px', fontSize: '13px' }}>
                        <Tag color="green">✓ RCS Ready</Tag>
                      </td>
                      <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => deleteContact(contact.id)}
                          disabled={loading}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

function CreateCampaign() {
  const { user, token } = useSelector(state => state.auth);
  const { balance, currency, formattedBalance } = useWallet();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // Contact upload hook
  const { uploadState, uploadContacts, resetUpload } = useContactUpload();

  // Redux state
  const { userTemplates, loading: templatesLoading, error: templatesError } = useSelector(state => state.templates);
  const { sendingMessage, messageError, capabilityResults } = useSelector(state => state.campaigns);

  // State Management
  const [currentStep, setCurrentStep] = useState(0);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [messageType, setMessageType] = useState('text');
  const [messageText, setMessageText] = useState('');
  const [cardDescription, setCardDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [footer, setFooter] = useState('');
  const [buttons, setButtons] = useState([]);
  const [carouselCards, setCarouselCards] = useState([]);

  const [recipients, setRecipients] = useState([]);
  const [sendSchedule, setSendSchedule] = useState({ type: 'immediate', dateTime: null });
  const [campaignName, setCampaignName] = useState('');

  const [manualContactModal, setManualContactModal] = useState(false);
  const [manualContactForm] = Form.useForm();

  const [checkingCapability, setCheckingCapability] = useState(false);
  const [campaignSummary, setCampaignSummary] = useState(null);
  const [previewDrawer, setPreviewDrawer] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');

  // Filter to show only valid RCS contacts in table
  const validRcsContacts = recipients.filter(contact => contact.capable === true);
  const invalidContacts = recipients.filter(contact => contact.capable === false);
  const pendingContacts = recipients.filter(contact => contact.capable === null || contact.checking === true);

  // Load templates on mount and cleanup on unmount
  useEffect(() => {
    if (user?._id) {
      dispatch(fetchUserTemplates({ userId: user._id }));
    }
    
    // Cleanup function to clear state when component unmounts
    return () => {
      setRecipients([]);
      setSelectedTemplate(null);
      setCampaignName('');
    };
  }, [user, dispatch]);

  // Load Templates from Redux
  const loadTemplates = () => {
    if (user?._id) {
      dispatch(fetchUserTemplates({ userId: user._id }));
    }
  };

  // Filter templates based on search and filter
  useEffect(() => {
    let filtered = userTemplates;

    // Apply search filter
    if (templateSearch) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
        (template.text && template.text.toLowerCase().includes(templateSearch.toLowerCase())) ||
        (template.richCard?.title && template.richCard.title.toLowerCase().includes(templateSearch.toLowerCase()))
      );
    }

    // Apply type filter
    if (templateFilter !== 'all') {
      filtered = filtered.filter(template => template.messageType === templateFilter);
    }

    setFilteredTemplates(filtered);
  }, [userTemplates, templateSearch, templateFilter]);

  // Handle Template Selection
  const handleTemplateSelect = async (template) => {
    try {
      setSelectedTemplate(template);
      setMessageType(template.messageType);

      // Reset all fields
      setMessageText(template.text || template?.richCard?.title || '');
      setCardDescription(template?.richCard?.description || template?.richCard?.subtitle || '');
      setMediaUrl(template?.richCard?.imageUrl || template?.imageUrl || '');

      // Set buttons
      const templateButtons = [];
      if (template.richCard?.actions) {
        templateButtons.push(...template.richCard.actions.map((action) => ({
          id: Date.now() + Math.random(),
          type: action.type === 'url' ? 'URL Button' : action.type === 'call' ? 'Call Button' : 'Quick Reply Button',
          title: action.title,
          value: action.payload || '',
        })));
      } else if (template.actions) {
        templateButtons.push(...template.actions.map((action) => ({
          id: Date.now() + Math.random(),
          type: action.type === 'url' ? 'URL Button' : action.type === 'call' ? 'Call Button' : 'Quick Reply Button',
          title: action.title,
          value: action.payload || '',
        })));
      }
      setButtons(templateButtons);

      // Set carousel cards
      if (template.carouselItems?.length > 0) {
        setCarouselCards(
          template.carouselItems.map((item) => ({
            id: Date.now() + Math.random(),
            title: item.title,
            description: item.subtitle || item.description || '',
            imageUrl: item.imageUrl || '',
            buttons: item.actions?.map((action) => ({
              id: Date.now() + Math.random(),
              type: action.type === 'url' ? 'URL Button' : 'Call Button',
              title: action.title,
              value: action.payload || action.url || action.phoneNumber || '',
            })) || [],
          }))
        );
      }

      message.success(`Template "${template.name}" selected successfully`);
      
      // Scroll to preview section on mobile
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          const previewElement = document.querySelector('.template-preview-section');
          if (previewElement) {
            previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    } catch (error) {
      message.error('Failed to select template: ' + error.message);
    }
  };

  // Check RCS Capability for batch of numbers using Redux (optimized)
  const checkRcsCapability = async (numbers) => {
    try {
      // Show immediate feedback for large batches
      if (numbers.length > 50) {
        message.loading(`Checking RCS capability for ${numbers.length} contacts...`, 0);
      }
      
      const result = await dispatch(checkCapability({
        phoneNumbers: numbers,
        userId: user._id
      })).unwrap();
      
      // Hide loading message
      message.destroy();
      
      return result;
    } catch (error) {
      message.destroy();
      console.error('Error checking capability:', error);
      throw error;
    }
  };

  // Import Excel File with background processing
  const handleExcelUpload = async (file) => {
    try {
      if (!file) {
        message.error('Please select a file');
        return false;
      }

      // Check file type
      const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
      if (!allowedTypes.includes(file.type)) {
        message.error('Please upload only Excel (.xlsx, .xls) or CSV files');
        return false;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        message.error('File size should be less than 5MB');
        return false;
      }

      const reader = new FileReader();

      reader.onload = async (evt) => {
        try {
          const wb = XLSX.read(evt.target.result, { type: 'array', cellText: false, cellDates: false });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });

          const imported = [];
          const seen = new Set();
          let skippedFirst = false;

          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;

            // Skip header
            if (!skippedFirst) {
              const firstCell = String(row[0] || '').toLowerCase();
              if (['index', 'sn', 'number', 'name', 'phone'].some((h) => firstCell.includes(h))) {
                skippedFirst = true;
                continue;
              }
            }

            row.forEach((cell) => {
              if (!cell && cell !== 0) return;

              let num = String(cell).trim();
              num = num.replace(/[\s\-()\.]/g, '');
              num = num.replace(/[^\d+]/g, '');

              if (num.startsWith('+91')) {
                num = num.substring(3);
              } else if (num.startsWith('+')) {
                num = num.substring(1);
                if (num.startsWith('91')) num = num.substring(2);
              } else if (num.startsWith('91') && num.length > 10) {
                num = num.substring(2);
              } else if (num.startsWith('0')) {
                num = num.substring(1);
              }

              if (/^\d{10}$/.test(num)) {
                const fullNum = num; // Store as 10-digit for backend
                if (!seen.has(fullNum)) {
                  seen.add(fullNum);
                  imported.push(fullNum);
                }
              }
            });
          }

          if (imported.length === 0) {
            message.error('No valid phone numbers found in the file. Please check the format.');
            return;
          }

          // Upload contacts for background processing
          const result = await uploadContacts(imported, file.name);
          
          if (result.success) {
            setUploadedFile(file.name);
            message.success(`${imported.length} contacts uploaded for processing`);
          }

        } catch (error) {
          console.error('Error parsing file:', error);
          message.error('Error parsing file: ' + error.message);
        }
      };

      reader.onerror = () => {
        message.error('Error reading file');
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      message.error('Error uploading file: ' + error.message);
    }

    return false; // Prevent default upload
  };



  // Add Contact Manually with batch capability check
  const handleAddContact = async (values) => {
    try {
      let phoneNumbers = values.phone.trim();

      if (!phoneNumbers) {
        message.error('Please enter phone numbers');
        return;
      }

      // Split by newlines and commas, clean each number
      const numbers = phoneNumbers
        .split(/[\n,]+/)
        .map(num => num.trim().replace(/[\s\-()]/g, ''))
        .filter(num => num.length > 0);

      if (numbers.length === 0) {
        message.error('Please enter valid phone numbers');
        return;
      }

      const validNumbers = [];
      const existingNumbers = new Set(recipients.map(r => r.number));

      for (let phone of numbers) {
        // Clean and format phone number
        if (!phone.startsWith('+91')) {
          if (phone.startsWith('91') && phone.length === 12) {
            phone = '+' + phone;
          } else if (phone.length === 10) {
            phone = '+91' + phone;
          } else {
            continue; // Skip invalid numbers
          }
        }

        // Validate phone number format and check for duplicates
        if (/^\+91\d{10}$/.test(phone) && !existingNumbers.has(phone)) {
          validNumbers.push(phone);
        }
      }

      if (validNumbers.length === 0) {
        message.warning('No new valid numbers found');
        return;
      }

      // Use batch capability check for quick results
      const phoneNumbersOnly = validNumbers.map(phone => phone.replace('+91', ''));
      
      try {
        const result = await dispatch(checkBatchCapability(phoneNumbersOnly));
        
        if (result.payload?.success) {
          const newContacts = result.payload.data.results.map(r => ({
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            number: `+91${r.phoneNumber}`,
            capable: r.isCapable,
            checking: false
          }));
          
          setRecipients(prev => [...prev, ...newContacts]);
          manualContactForm.resetFields();
          setManualContactModal(false);
          
          const rcsCount = newContacts.filter(c => c.capable).length;
          message.success(`${newContacts.length} contacts added (${rcsCount} RCS capable) in ${result.payload.performance.totalTime}ms`);
        } else {
          throw new Error('Batch capability check failed');
        }
      } catch (error) {
        // Fallback to adding contacts without capability check
        const newContacts = validNumbers.map(phone => ({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          number: phone,
          capable: null,
          checking: true
        }));
        
        setRecipients(prev => [...prev, ...newContacts]);
        manualContactForm.resetFields();
        setManualContactModal(false);
        
        message.success(`${newContacts.length} contacts added. Checking RCS capability...`);
        
        // Check capability in background
        setTimeout(async () => {
          try {
            const response = await checkRcsCapability(validNumbers);
            if (response?.data) {
              setRecipients(prev => prev.map(contact => {
                const result = response.data.find(r => r.phoneNumber === contact.number);
                if (result && validNumbers.includes(contact.number)) {
                  return {
                    ...contact,
                    capable: result.isCapable,
                    checking: false
                  };
                }
                return contact;
              }));
            }
          } catch (error) {
            setRecipients(prev => prev.map(contact => {
              if (validNumbers.includes(contact.number)) {
                return { ...contact, capable: false, checking: false };
              }
              return contact;
            }));
          }
        }, 1000);
      }

    } catch (error) {
      console.error('Error adding contacts:', error);
      message.error('Error adding contacts: ' + error.message);
    }
  };

  // Delete Contact
  const deleteContact = (id) => {
    setRecipients(recipients.filter((c) => c.id !== id));
    message.success('Contact removed');
  };

  // Handle Step Change
  const handleStepChange = (step) => {
    // Prevent jumping to steps without validation
    if (step > currentStep + 1) {
      return; // Don't allow jumping ahead
    }
    
    if (step === 0) {
      setCurrentStep(0);
    } else if (step === 1) {
      if (!selectedTemplate) {
        message.error('Please select a template first');
        return;
      }
      setCurrentStep(1);
    } else if (step === 2) {
      if (!selectedTemplate) {
        message.error('Please select a template first');
        return;
      }
      if (recipients.filter(r => r.capable === true).length === 0) {
        message.error('Please add valid RCS contacts first');
        return;
      }
      setCurrentStep(2);
    }
  };

  // Send Campaign with background processing support
  const handleSendCampaign = async () => {
    try {
      // Validation
      if (!selectedTemplate) {
        message.error('Please select a template');
        return;
      }

      if (!campaignName.trim()) {
        message.error('Please enter campaign name');
        return;
      }

      // Get only valid RCS contacts for campaign
      const validRcsContacts = recipients.filter(r => r.capable === true);
      const totalContacts = recipients.length;
      
      if (validRcsContacts.length === 0) {
        message.error('No valid RCS contacts found. Please add RCS capable contacts.');
        return;
      }

      // Estimate cost only for valid RCS contacts
      const estimatedCost = validRcsContacts.length * 1;
      if (balance < estimatedCost) {
        message.error(`Insufficient credits! Required: ₹${estimatedCost}, Available: ${formattedBalance}`);
        setShowAddMoney(true);
        return;
      }

      // Show campaign options
      Modal.confirm({
        title: 'Start RCS Campaign',
        content: (
          <div>
            <p><strong>Campaign:</strong> {campaignName}</p>
            <p><strong>Total Contacts Uploaded:</strong> {totalContacts}</p>
            <p><strong>RCS Ready Contacts:</strong> {validRcsContacts.length}</p>
            <p><strong>Invalid/Pending:</strong> {totalContacts - validRcsContacts.length}</p>
            <br />
            <Alert 
              message="Only RCS capable contacts will receive messages"
              description="Messages will be sent only to contacts that support RCS messaging"
              type="info"
              showIcon
            />
            <br />
            <p>💰 Cost: ₹{estimatedCost} (₹1 per RCS message)</p>
          </div>
        ),
        okText: 'Send to RCS Contacts',
        cancelText: 'Cancel',
        onOk: async () => {
          await processCampaign();
        }
      });

      async function processCampaign() {
        const hideLoading = message.loading('Creating campaign...', 0);

        try {
          const uploadResponse = await _post('v1/campaigns/send-bulk', {
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
          
          if (uploadResponse.data.success) {
            Modal.success({
              title: 'Campaign Started Successfully!',
              content: (
                <div>
                  <p>✅ Campaign "{campaignName}" started successfully!</p>
                  <p>📊 RCS Ready Contacts: {validRcsContacts.length}</p>
                  <p>🚀 Messages are being sent to RCS capable contacts</p>
                  <p>📈 Track progress in Reports section</p>
                </div>
              ),
              onOk: () => {
                clearAllFields();
                navigate('/reports');
              }
            });
          } else {
            throw new Error(uploadResponse.data.message || 'Failed to start campaign');
          }
        } catch (error) {
          hideLoading();
          throw error;
        }
      }
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Failed to start campaign';
      message.error(errorMessage);
    }
  };

  // Clear all form fields
  const clearAllFields = () => {
    // Reset all state variables
    setCurrentStep(0);
    setSelectedTemplate(null);
    setMessageType('text');
    setMessageText('');
    setCardDescription('');
    setMediaUrl('');
    setFooter('');
    setButtons([]);
    setCarouselCards([]);
    setRecipients([]); // Clear recipients array completely
    setCampaignName('');
    setUploadedFile(null);
    
    // Reset forms
    form.resetFields();
    manualContactForm.resetFields();
    
    // Reset search and filters
    setTemplateSearch('');
    setTemplateFilter('all');
    
    // Force re-render by clearing any cached state
    setTimeout(() => {
      setRecipients([]); // Double-clear to ensure state is reset
    }, 100);
  };

  // Download Demo Excel
  const downloadDemoExcel = () => {
    const demoData = [
      ['Index', 'Number'],
      ['1', '7201000140'],
      ['2', '7201000141'],
      ['3', '7201000142'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(demoData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
    XLSX.writeFile(wb, 'demo_contacts.xlsx');
    message.success('Demo file downloaded');
  };

  // Add Button
  const addButton = () => {
    setButtons([...buttons, { id: Date.now(), type: 'URL Button', title: '', value: '', postBackData: 'SA1L1C1' }]);
  };

  // Update Button
  const updateButton = (id, field, value) => {
    setButtons(
      buttons.map((b) => {
        if (b.id === id) {
          const updated = { ...b, [field]: value };
          if (field === 'type') {
            if (value === 'Call Button' && !updated.title) updated.title = 'Call Now';
            if (value === 'URL Button') updated.title = '';
          }
          return updated;
        }
        return b;
      })
    );
  };

  // Delete Button
  const deleteButton = (id) => {
    setButtons(buttons.filter((b) => b.id !== id));
  };

  // Add Carousel Card
  const addCarouselCard = () => {
    setCarouselCards([...carouselCards, { id: Date.now(), title: '', description: '', imageUrl: '', buttons: [] }]);
  };

  // Update Carousel Card
  const updateCarouselCard = (id, field, value) => {
    setCarouselCards(carouselCards.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  // Delete Carousel Card
  const deleteCarouselCard = (id) => {
    setCarouselCards(carouselCards.filter((c) => c.id !== id));
  };

  // Render Template Preview with RCSMessagePreview Component
  const renderTemplatePreview = (template = selectedTemplate) => {
    if (!template) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}><FaMobileAlt /></div>
          <h4 style={{ color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>Select a template to preview</h4>
        </div>
      );
    }

    return (
      <div style={{ 
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        <RCSMessagePreview data={template} />
      </div>
    );
  };

  const contactsColumns = [
    {
      title: 'Phone',
      dataIndex: 'number',
      key: 'number',
      render: (text) => <span style={{ fontFamily: 'monospace', color: THEME_CONSTANTS.colors.success }}>{text}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'capable',
      key: 'capable',
      render: () => <Tag color="green">✓ RCS Ready</Tag>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Popconfirm title="Remove contact?" onConfirm={() => deleteContact(record.id)}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const steps = [
    { title: 'Select Template', icon: <FormOutlined /> },
    { title: 'Add Recipients', icon: <TeamOutlined /> },
    { title: 'Review & Send', icon: <SendOutlined /> },
  ];

  // Custom Steps Component with Circular Design
  const CustomSteps = ({ current, steps, onChange }) => {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 0',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '16px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        {steps.map((step, index) => {
          const isActive = index === current;
          const isCompleted = index < current;
          const isClickable = index <= current;
          
          return (
            <React.Fragment key={index}>
              <div
                onClick={() => isClickable && onChange && onChange(index)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: isClickable ? 'pointer' : 'default',
                  transition: 'all 0.3s ease',
                  transform: isActive && window.innerWidth > 768 ? 'scale(1.05)' : 'scale(1)',
                  position: 'relative'
                }}
              >
                {/* Circle */}
                <div 
                  className="custom-step-circle"
                  style={{
                    width: window.innerWidth <= 768 ? '40px' : '56px',
                    height: window.innerWidth <= 768 ? '40px' : '56px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: window.innerWidth <= 768 ? '16px' : '20px',
                    fontWeight: '600',
                    marginBottom: window.innerWidth <= 768 ? '8px' : '12px',
                    transition: 'all 0.3s ease',
                    background: isCompleted 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : isActive 
                      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                      : '#e5e7eb',
                    color: isCompleted || isActive ? '#ffffff' : '#9ca3af',
                    boxShadow: isActive 
                      ? '0 8px 25px rgba(59, 130, 246, 0.4)'
                      : isCompleted
                      ? '0 8px 25px rgba(16, 185, 129, 0.4)'
                      : '0 2px 8px rgba(0,0,0,0.1)',
                    border: isActive ? '3px solid rgba(59, 130, 246, 0.3)' : 'none'
                  }}
                >
                  {isCompleted ? (
                    <CheckOutlined style={{ fontSize: '24px' }} />
                  ) : (
                    React.cloneElement(step.icon, { style: { fontSize: '24px' } })
                  )}
                  
                  {/* Step Number */}
                  <div 
                    className="custom-step-number"
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: isCompleted 
                        ? '#10b981'
                        : isActive 
                        ? '#3b82f6'
                        : '#9ca3af',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                  >
                    {index + 1}
                  </div>
                </div>
                
                <div style={{
                  textAlign: 'center',
                  maxWidth: '120px'
                }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '600',
                    color: isActive ? '#1f2937' : isCompleted ? '#374151' : '#9ca3af',
                    transition: 'color 0.3s ease'
                  }}>
                    {step.title}
                  </h4>
                  <div style={{
                    marginTop: '4px',
                    fontSize: '12px',
                    color: isCompleted ? '#10b981' : isActive ? '#3b82f6' : '#d1d5db',
                    fontWeight: '500'
                  }}>
                    {isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Pending'}
                  </div>
                </div>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div style={{
                  width: '80px',
                  height: '3px',
                  margin: '0 24px',
                  marginTop: '-32px',
                  background: index < current 
                    ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                    : '#e5e7eb',
                  borderRadius: '2px',
                  transition: 'background 0.3s ease',
                  position: 'relative'
                }}>
                  {/* Animated progress */}
                  {index === current - 1 && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: '100%',
                      background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                      borderRadius: '2px',
                      animation: 'progressFill 0.5s ease-in-out'
                    }} />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div style={{ 
        background: THEME_CONSTANTS.colors.background, 
        minHeight: '100vh',
        fontFamily: THEME_CONSTANTS.typography.body.fontFamily
      }}>
        <div style={{ 
          maxWidth: THEME_CONSTANTS.layout.maxContentWidth, 
          margin: '0 auto',
          padding: `${THEME_CONSTANTS.spacing.xl} ${THEME_CONSTANTS.spacing.lg}`,
          '@media (max-width: 768px)': {
            padding: THEME_CONSTANTS.spacing.md
          }
        }}>
          {/* Enhanced Header Section */}
          <div style={{
            marginBottom: THEME_CONSTANTS.spacing.xxxl,
            paddingBottom: THEME_CONSTANTS.spacing.xl,
            borderBottom: `2px solid ${THEME_CONSTANTS.colors.primaryLight}`
          }}>
            <Breadcrumb style={{
              marginBottom: THEME_CONSTANTS.spacing.md,
              fontSize: THEME_CONSTANTS.typography.caption.size
            }}>
              <Breadcrumb.Item>
                <HomeOutlined style={{ marginRight: '6px' }} />
                <span style={{ color: THEME_CONSTANTS.colors.textMuted }}>Home</span>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <span style={{ 
                  color: THEME_CONSTANTS.colors.primary,
                  fontWeight: THEME_CONSTANTS.typography.h6.weight
                }}>
                  Bulk Message Campaign
                </span>
              </Breadcrumb.Item>
            </Breadcrumb>

            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col xs={24} lg={18}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={6} md={4} lg={3}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      background: THEME_CONSTANTS.colors.primaryLight,
                      borderRadius: THEME_CONSTANTS.radius.xl,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: THEME_CONSTANTS.shadow.md,
                      margin: '0 auto'
                    }}>
                      <SendOutlined style={{
                        color: THEME_CONSTANTS.colors.primary,
                        fontSize: '32px'
                      }} />
                    </div>
                  </Col>
                  <Col xs={24} sm={18} md={20} lg={21}>
                    <div>
                      <h1 style={{
                        fontSize: 'clamp(24px, 4vw, 32px)',
                        fontWeight: THEME_CONSTANTS.typography.h1.weight,
                        color: THEME_CONSTANTS.colors.text,
                        marginBottom: THEME_CONSTANTS.spacing.sm,
                        lineHeight: THEME_CONSTANTS.typography.h1.lineHeight
                      }}>
                        Bulk Message Campaign 📨
                      </h1>
                      <p style={{
                        color: THEME_CONSTANTS.colors.textSecondary,
                        fontSize: 'clamp(13px, 2.5vw, 14px)',
                        fontWeight: 500,
                        lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                        margin: 0
                      }}>
                        Create and manage bulk messaging campaigns with real-time delivery tracking.
                      </p>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col xs={24} lg={6}>
                <div style={{ marginTop: '16px' }}>
                  <Row gutter={[12, 12]}>
                    <Col xs={12} sm={12}>
                      <Statistic
                        title="RCS Ready"
                        value={validRcsContacts.length}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: THEME_CONSTANTS.colors.success, fontSize: 'clamp(16px, 3vw, 20px)' }}
                      />
                    </Col>
                    <Col xs={12} sm={12}>
                      <Statistic
                        title="Total Uploaded"
                        value={recipients.length}
                        prefix={<TeamOutlined />}
                        valueStyle={{ color: THEME_CONSTANTS.colors.primary, fontSize: 'clamp(16px, 3vw, 20px)' }}
                      />
                    </Col>
                    <Col xs={12} sm={12}>
                      <Statistic
                        title="Wallet"
                        value={formattedBalance}
                        valueStyle={{ color: THEME_CONSTANTS.colors.success, fontSize: 'clamp(16px, 3vw, 20px)' }}
                      />
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </div>

          {/* Enhanced Steps Navigation */}
          <CustomSteps 
            current={currentStep} 
            steps={steps} 
            onChange={handleStepChange}
          />

            {/* Step 0: Select Template */}
            {currentStep === 0 && (
              <Card
                title={
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <span style={{
                      color: THEME_CONSTANTS.colors.text,
                      fontSize: 'clamp(14px, 2.5vw, 16px)',
                      fontWeight: THEME_CONSTANTS.typography.h5.weight
                    }}>Select a Template ({userTemplates.length})</span>
                    <Space size="small">
                      <Button
                        onClick={loadTemplates}
                        icon={<ReloadOutlined />}
                        loading={templatesLoading}
                        size="small"
                        style={{ 
                          borderColor: THEME_CONSTANTS.colors.border,
                          color: THEME_CONSTANTS.colors.textSecondary
                        }}
                      >
                        Refresh
                      </Button>
                      <Button
                        type="primary"
                        onClick={() => navigate('/templates')}
                        icon={<PlusOutlined />}
                        size="small"
                        style={{ 
                          backgroundColor: THEME_CONSTANTS.colors.primary,
                          borderColor: THEME_CONSTANTS.colors.primary
                        }}
                      >
                        Create New
                      </Button>
                    </Space>
                  </div>
                }
                style={{
                  background: THEME_CONSTANTS.colors.surface,
                  border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  boxShadow: THEME_CONSTANTS.shadow.sm
                }}
                bodyStyle={{ padding: 'clamp(16px, 3vw, 24px)' }}
              >
                {templatesLoading ? (
                  <div style={{ textAlign: 'center', padding: `${THEME_CONSTANTS.spacing.xxxl} ${THEME_CONSTANTS.spacing.lg}` }}>
                    <Spin size="large" />
                    <p style={{ 
                      marginTop: THEME_CONSTANTS.spacing.lg, 
                      color: THEME_CONSTANTS.colors.textSecondary,
                      fontSize: THEME_CONSTANTS.typography.body.size
                    }}>Loading templates...</p>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <Empty
                    description={
                      <div>
                        <p style={{ 
                          marginBottom: THEME_CONSTANTS.spacing.sm,
                          color: THEME_CONSTANTS.colors.text,
                          fontSize: THEME_CONSTANTS.typography.body.size
                        }}>No templates found</p>
                        <p style={{ 
                          fontSize: THEME_CONSTANTS.typography.caption.size, 
                          color: THEME_CONSTANTS.colors.textSecondary, 
                          margin: 0 
                        }}>
                          Create your first template to start sending messages
                        </p>
                      </div>
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button 
                      type="primary" 
                      onClick={() => navigate('/templates')} 
                      icon={<PlusOutlined />}
                      style={{
                        background: THEME_CONSTANTS.colors.primary,
                        borderColor: THEME_CONSTANTS.colors.primary,
                        borderRadius: THEME_CONSTANTS.radius.md
                      }}
                    >
                      Create Your First Template
                    </Button>
                  </Empty>
                ) : (
                  <>
                    {/* Search and Filter */}
                    <div style={{ 
                      marginBottom: '16px', 
                      display: 'flex', 
                      gap: '8px', 
                      alignItems: 'center', 
                      justifyContent: 'flex-end',
                      flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
                    }}>
                      <Input.Search
                        placeholder={window.innerWidth <= 768 ? 'Search...' : 'Search templates...'}
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        style={{ width: window.innerWidth <= 768 ? '100%' : 'min(250px, 100%)', minWidth: '200px' }}
                        allowClear
                        size={window.innerWidth <= 768 ? 'small' : 'default'}
                      />
                      <Select
                        value={templateFilter}
                        onChange={setTemplateFilter}
                        style={{ width: window.innerWidth <= 768 ? '100%' : 'min(150px, 100%)', minWidth: '120px' }}
                        size={window.innerWidth <= 768 ? 'small' : 'default'}
                        options={[
                          { label: 'All Types', value: 'all' },
                          { label: 'Text', value: 'text' },
                          { label: 'Text + Action', value: 'text-with-action' },
                          { label: 'RCS Rich Card', value: 'rcs' },
                          { label: 'Carousel', value: 'carousel' }
                        ]}
                      />
                    </div>

                    {/* Templates Table */}
                    <Table
                      dataSource={filteredTemplates}
                      rowKey="_id"
                      pagination={{ pageSize: 10, showSizeChanger: true }}
                      onRow={(record) => ({
                        onClick: () => {
                          handleTemplateSelect(record);
                          setCurrentStep(1); // Auto-advance to step 2
                        },
                        style: {
                          cursor: 'pointer',
                          backgroundColor: selectedTemplate?._id === record._id ? THEME_CONSTANTS.colors.primaryLight : 'transparent'
                        }
                      })}
                      scroll={{ x: 600 }}
                      size="small"
                      columns={[
                        {
                          title: 'Template Name',
                          dataIndex: 'name',
                          key: 'name',
                          width: 200,
                          render: (text, record) => (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '16px' }}>
                                {record.templateType === 'plainText' ? '💬' :
                                  record.templateType === 'richCard' ? '🎨' :
                                    record.templateType === 'carousel' ? '🎠' :
                                      record.templateType === 'textWithAction' ? '🔗' : '📧'}
                              </span>
                              <div>
                                <div style={{ 
                                  fontWeight: 600,
                                  color: THEME_CONSTANTS.colors.text
                                }}>{text}</div>
                                <div style={{ 
                                  fontSize: '11px', 
                                  color: THEME_CONSTANTS.colors.textSecondary 
                                }}>
                                  {record.templateType === 'richCard' ? 'Rich Card' : 
                                   record.templateType === 'carousel' ? 'Carousel' :
                                   record.templateType === 'textWithAction' ? 'Text + Actions' : 'Plain Text'}
                                </div>
                              </div>
                            </div>
                          )
                        },
                        {
                          title: 'Content Preview',
                          key: 'preview',
                          width: 250,
                          render: (_, record) => (
                            <div style={{ maxWidth: '200px' }}>
                              {record.templateType === 'plainText' && record.content?.body && (
                                <div style={{ 
                                  fontSize: '12px', 
                                  color: THEME_CONSTANTS.colors.textSecondary, 
                                  marginBottom: '4px' 
                                }}>
                                  {record.content.body.length > 30 ? record.content.body.substring(0, 30) + '...' : record.content.body}
                                </div>
                              )}
                              {record.templateType === 'richCard' && record.content?.title && (
                                <div style={{ 
                                  fontSize: '12px', 
                                  fontWeight: 500,
                                  color: THEME_CONSTANTS.colors.text
                                }}>
                                  {record.content.title}
                                </div>
                              )}
                              {record.templateType === 'textWithAction' && record.content?.text && (
                                <div style={{ 
                                  fontSize: '12px', 
                                  color: THEME_CONSTANTS.colors.textSecondary, 
                                  marginBottom: '4px' 
                                }}>
                                  {record.content.text.length > 30 ? record.content.text.substring(0, 30) + '...' : record.content.text}
                                </div>
                              )}
                              {record.templateType === 'carousel' && record.content?.cards && (
                                <div style={{ 
                                  fontSize: '12px', 
                                  color: THEME_CONSTANTS.colors.textSecondary 
                                }}>
                                  {record.content.cards.length} cards
                                </div>
                              )}
                              {record.templateType === 'textWithAction' && record.content?.buttons && record.content.buttons.length > 0 && (
                                <div style={{ marginTop: '4px' }}>
                                  {record.content.buttons.slice(0, 2).map((action, idx) => (
                                    <Tag key={idx} size="small" style={{ fontSize: '10px', marginBottom: '2px' }}>
                                      {action.label}
                                    </Tag>
                                  ))}
                                  {record.content.buttons.length > 2 && (
                                    <Tag size="small" style={{ fontSize: '10px' }}>+{record.content.buttons.length - 2} more</Tag>
                                  )}
                                </div>
                              )}
                              {record.templateType === 'richCard' && record.content?.actions && record.content.actions.length > 0 && (
                                <div style={{ marginTop: '4px' }}>
                                  {record.content.actions.slice(0, 2).map((action, idx) => (
                                    <Tag key={idx} size="small" style={{ fontSize: '10px', marginBottom: '2px' }}>
                                      {action.label}
                                    </Tag>
                                  ))}
                                  {record.content.actions.length > 2 && (
                                    <Tag size="small" style={{ fontSize: '10px' }}>+{record.content.actions.length - 2} more</Tag>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        },
                        {
                          title: 'Created',
                          dataIndex: 'createdAt',
                          key: 'createdAt',
                          width: 100,
                          render: (date) => (
                            <span style={{
                              color: THEME_CONSTANTS.colors.textSecondary,
                              fontSize: '11px'
                            }}>
                              {new Date(date).toLocaleDateString()}
                            </span>
                          )
                        }
                      ]}
                    />
                  </>
                )}
              </Card>
            )}

            {/* Step 1: Add Recipients */}
            {currentStep === 1 && (
              <Row gutter={[16, 24]}>
                <Col xs={24} xl={16}>
                  <Card
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span>Manage Recipients</span>
                          <div style={{ fontSize: '12px', fontWeight: 400, color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>
                            {recipients.length} contacts added • {recipients.filter(r => r.capable === true).length} RCS capable
                          </div>
                        </div>
                        {recipients.length > 0 && (
                          <Button
                            danger
                            size="small"
                            onClick={() => {
                              Modal.confirm({
                                title: 'Clear All Contacts',
                                content: 'Are you sure you want to remove all contacts?',
                                onOk: () => {
                                  setRecipients([]);
                                  message.success('All contacts cleared');
                                }
                              });
                            }}
                            style={{ padding: '4px 8px' }}
                          >
                            Clear All
                          </Button>
                        )}
                      </div>
                    }
                    style={{
                      background: THEME_CONSTANTS.colors.surface,
                      border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                      borderRadius: THEME_CONSTANTS.radius.lg,
                    }}
                    bodyStyle={{ padding: '24px' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                      {/* Upload Options */}
                      <div style={{
                        background: '#f8fafc',
                        borderRadius: THEME_CONSTANTS.radius.md,
                        padding: '20px',
                        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                      }}>
                        <h4 style={{ margin: '0 0 16px 0', color: THEME_CONSTANTS.colors.text }}>Add Contacts</h4>
                        
                        {/* Simple Contact Upload Component */}
                        <ContactUpload 
                          onContactsReady={(newContacts) => {
                            // Prevent duplicate contacts from being added
                            const existingNumbers = new Set(recipients.map(r => r.number));
                            const uniqueContacts = newContacts.filter(contact => 
                              !existingNumbers.has(contact.number)
                            );
                            
                            if (uniqueContacts.length > 0) {
                              setRecipients(prev => [...prev, ...uniqueContacts]);
                            }
                          }}
                        />

                        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                          <Col xs={12} sm={6}>
                            <Button
                              icon={<DownloadOutlined />}
                              onClick={downloadDemoExcel}
                              block
                              size={window.innerWidth <= 768 ? 'default' : 'large'}
                              style={{ height: window.innerWidth <= 768 ? '40px' : '48px' }}
                            >
                              {window.innerWidth <= 768 ? 'Demo' : 'Download Demo'}
                            </Button>
                          </Col>
                          <Col xs={24} sm={18}>
                            <Button
                              icon={<PlusOutlined />}
                              type="primary"
                              onClick={() => setManualContactModal(true)}
                              block
                              size={window.innerWidth <= 768 ? 'default' : 'large'}
                              style={{ height: window.innerWidth <= 768 ? '40px' : '48px' }}
                            >
                              {window.innerWidth <= 768 ? 'Manual' : 'Add Manually'}
                            </Button>
                          </Col>
                        </Row>

                        {uploadedFile && (
                          <div style={{ marginTop: '12px', padding: '8px 12px', background: '#e6f7ff', borderRadius: '6px', fontSize: '12px' }}>
                            📄 Last uploaded: {uploadedFile}
                          </div>
                        )}
                      </div>

                      {/* Contact Statistics */}
                      {recipients.length > 0 && (
                        <div style={{
                          background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight} 0%, #e0f2fe 100%)`,
                          borderRadius: THEME_CONSTANTS.radius.lg,
                          padding: 'clamp(16px, 3vw, 24px)',
                          color: THEME_CONSTANTS.colors.text,
                          border: `1px solid ${THEME_CONSTANTS.colors.primary}20`
                        }}>
                          <h4 style={{ color: THEME_CONSTANTS.colors.text, margin: '0 0 16px 0', fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Contact Statistics</h4>
                          <Row gutter={[12, 12]}>
                            <Col xs={12} sm={6}>
                              <div>
                                <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 700, marginBottom: '4px' }}>
                                  {recipients.length}
                                </div>
                                <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', opacity: 0.9 }}>Total Contacts</div>
                              </div>
                            </Col>
                            <Col xs={12} sm={6}>
                              <div>
                                <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 700, marginBottom: '4px', color: THEME_CONSTANTS.colors.success }}>
                                  {recipients.filter(r => r.capable === true).length}
                                </div>
                                <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', opacity: 0.9 }}>RCS Capable</div>
                              </div>
                            </Col>
                            <Col xs={12} sm={6}>
                              <div>
                                <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 700, marginBottom: '4px', color: THEME_CONSTANTS.colors.danger }}>
                                  {recipients.filter(r => r.capable === false).length}
                                </div>
                                <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', opacity: 0.9 }}>Not Capable</div>
                              </div>
                            </Col>
                            <Col xs={12} sm={6}>
                              <div>
                                <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 700, marginBottom: '4px', color: THEME_CONSTANTS.colors.warning }}>
                                  ₹{(validRcsContacts.length * 1).toFixed(0)}
                                </div>
                                <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', opacity: 0.9 }}>Est. Cost</div>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      )}

                      {/* Contact List with Pagination */}
                      {recipients.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h4 style={{ margin: 0 }}>Contacts ({recipients.length})</h4>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              <span style={{ color: '#52c41a' }}>{recipients.filter(r => r.capable === true).length} RCS</span> • 
                              <span style={{ color: '#ff4d4f' }}>{recipients.filter(r => r.capable === false).length} SMS</span> • 
                              <span style={{ color: '#faad14' }}>{recipients.filter(r => r.checking).length} Checking</span>
                            </div>
                          </div>
                          <Table
                            columns={[
                              {
                                title: 'Phone',
                                dataIndex: 'number',
                                key: 'number',
                                render: (text) => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{text}</span>,
                              },
                              {
                                title: 'Status',
                                dataIndex: 'capable',
                                key: 'capable',
                                render: (capable, record) => {
                                  if (record.checking) return <Tag color="orange">Checking...</Tag>;
                                  if (capable === true) return <Tag color="green">RCS</Tag>;
                                  if (capable === false) return <Tag color="red">SMS</Tag>;
                                  return <Tag>Pending</Tag>;
                                },
                              },
                              {
                                title: 'Action',
                                key: 'action',
                                render: (_, record) => (
                                  <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={() => deleteContact(record.id)}
                                  />
                                ),
                              },
                            ]}
                            dataSource={recipients}
                            rowKey="id"
                            pagination={{
                              pageSize: 10,
                              showSizeChanger: true,
                              showQuickJumper: true,
                              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} contacts`,
                              pageSizeOptions: ['10', '20', '50'],
                            }}
                            size="small"
                            scroll={{ y: 300 }}
                            style={{
                              border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                              borderRadius: THEME_CONSTANTS.radius.md,
                            }}
                          />
                        </div>
                      )}

                      {recipients.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📞</div>
                          <h4 style={{ color: THEME_CONSTANTS.colors.textSecondary, margin: '0 0 8px 0' }}>No contacts added yet</h4>
                          <p style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>
                            Upload an Excel file or add contacts manually to get started
                          </p>
                        </div>
                      )}

                      {/* Navigation Buttons */}
                      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <Button
                          onClick={() => setCurrentStep(0)}
                          icon={<ArrowLeftOutlined />}
                          size={window.innerWidth <= 768 ? 'default' : 'large'}
                          style={{ flex: window.innerWidth <= 768 ? '1' : 'none' }}
                        >
                          {window.innerWidth <= 768 ? 'Back' : 'Previous'}
                        </Button>
                        <Button
                          type="primary"
                          onClick={() => {
                            if (recipients.filter(r => r.capable === true).length === 0) {
                              message.error('Please add at least one valid contact to continue');
                              return;
                            }
                            setCurrentStep(2);
                          }}
                          icon={<ArrowRightOutlined />}
                          size={window.innerWidth <= 768 ? 'default' : 'large'}
                          style={{ flex: window.innerWidth <= 768 ? '1' : 'none' }}
                        >
                          {window.innerWidth <= 768 ? 'Next' : 'Next: Review & Send'}
                        </Button>
                      </div>
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} xl={8}>
                  <div style={{ position: 'sticky', top: '20px' }}>
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                      <Card
                        title={
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            color: THEME_CONSTANTS.colors.text 
                          }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <FileTextOutlined style={{ color: 'white', fontSize: '16px' }} />
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: 600 }}>Campaign Summary</span>
                          </div>
                        }
                        style={{
                          background: THEME_CONSTANTS.colors.surface,
                          border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                          borderRadius: THEME_CONSTANTS.radius.lg,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}
                        bodyStyle={{ padding: '24px' }}
                      >
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                          {/* Template Section */}
                          <div style={{
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            borderRadius: THEME_CONSTANTS.radius.lg,
                            padding: '20px',
                            border: `1px solid ${THEME_CONSTANTS.colors.border}`
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'flex-start',
                              marginBottom: '12px'
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ 
                                  fontSize: '12px', 
                                  fontWeight: 600, 
                                  color: THEME_CONSTANTS.colors.textSecondary,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  marginBottom: '8px'
                                }}>
                                  Selected Template
                                </div>
                                <div style={{ 
                                  fontSize: '16px', 
                                  fontWeight: 600, 
                                  color: selectedTemplate ? THEME_CONSTANTS.colors.primary : THEME_CONSTANTS.colors.textSecondary,
                                  marginBottom: '4px'
                                }}>
                                  {selectedTemplate?.name || 'No template selected'}
                                </div>
                                {selectedTemplate && (
                                  <div style={{
                                    fontSize: '12px',
                                    color: THEME_CONSTANTS.colors.textSecondary,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    <span>📱</span>
                                    {selectedTemplate.templateType === 'richCard' ? 'Rich Card' : 
                                     selectedTemplate.templateType === 'carousel' ? 'Carousel' :
                                     selectedTemplate.templateType === 'textWithAction' ? 'Text + Actions' : 'Plain Text'}
                                  </div>
                                )}
                              </div>
                              {selectedTemplate && (
                                <Tooltip title={showPreview ? 'Hide Preview' : 'Show Preview'}>
                                  <Button
                                    type="text"
                                    icon={<EyeOutlined />}
                                    size="small"
                                    onClick={() => setShowPreview(!showPreview)}
                                    style={{ 
                                      color: THEME_CONSTANTS.colors.primary,
                                      background: showPreview ? THEME_CONSTANTS.colors.primaryLight : 'transparent',
                                      borderRadius: '8px',
                                      width: '32px',
                                      height: '32px'
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </div>
                            
                            {showPreview && selectedTemplate && (
                              <div style={{ 
                                marginTop: '16px',
                                padding: '16px',
                                background: 'white',
                                borderRadius: THEME_CONSTANTS.radius.md,
                                border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                              }}>
                                <div style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: THEME_CONSTANTS.colors.textSecondary,
                                  marginBottom: '12px',
                                  textAlign: 'center'
                                }}>
                                  MESSAGE PREVIEW
                                </div>
                                <RCSMessagePreview data={selectedTemplate} />
                              </div>
                            )}
                          </div>

                          {/* Statistics Grid */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '16px'
                          }}>
                            <div style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              borderRadius: THEME_CONSTANTS.radius.lg,
                              padding: '20px',
                              color: 'white',
                              position: 'relative',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '-10px',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)'
                              }} />
                              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: 500 }}>
                                RCS READY
                              </div>
                              <div style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>
                                {recipients.filter(r => r.capable === true).length}
                              </div>
                              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                                Contacts verified
                              </div>
                            </div>

                            <div style={{
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              borderRadius: THEME_CONSTANTS.radius.lg,
                              padding: '20px',
                              color: 'white',
                              position: 'relative',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '-10px',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)'
                              }} />
                              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: 500 }}>
                                TOTAL UPLOADED
                              </div>
                              <div style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>
                                {recipients.length}
                              </div>
                              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                                All contacts
                              </div>
                            </div>
                          </div>

                          {/* Cost Section */}
                          {validRcsContacts.length > 0 && (
                            <div style={{
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              borderRadius: THEME_CONSTANTS.radius.lg,
                              padding: '20px',
                              color: 'white',
                              position: 'relative',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '-10px',
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)'
                              }} />
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center'
                              }}>
                                <div>
                                  <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: 500 }}>
                                    ESTIMATED COST
                                  </div>
                                  <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>
                                    ₹{(validRcsContacts.length * 1).toFixed(0)}
                                  </div>
                                  <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                                    ₹1 per RCS message
                                  </div>
                                </div>
                                <div style={{ fontSize: '32px', opacity: 0.3 }}>💰</div>
                              </div>
                            </div>
                          )}

                          {/* Delivery Rate */}
                          {recipients.length > 0 && (
                            <div style={{
                              background: 'white',
                              padding: '20px',
                              borderRadius: THEME_CONSTANTS.radius.lg,
                              border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                            }}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '12px'
                              }}>
                                <div style={{ 
                                  fontSize: '12px', 
                                  fontWeight: 600, 
                                  color: THEME_CONSTANTS.colors.textSecondary,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
                                  Delivery Rate
                                </div>
                                <div style={{ 
                                  fontSize: '16px', 
                                  fontWeight: 700, 
                                  color: THEME_CONSTANTS.colors.success
                                }}>
                                  {Math.round((recipients.filter(r => r.capable === true).length / recipients.length) * 100)}%
                                </div>
                              </div>
                              <Progress
                                percent={Math.round((recipients.filter(r => r.capable === true).length / recipients.length) * 100)}
                                strokeColor={{
                                  '0%': '#10b981',
                                  '100%': '#059669',
                                }}
                                trailColor="#f3f4f6"
                                strokeWidth={8}
                                showInfo={false}
                              />
                              <div style={{ 
                                fontSize: '11px', 
                                color: THEME_CONSTANTS.colors.textSecondary, 
                                marginTop: '8px',
                                textAlign: 'center'
                              }}>
                                {recipients.filter(r => r.capable === true).length} of {recipients.length} contacts will receive RCS messages
                              </div>
                            </div>
                          )}
                        </Space>
                    </Card>
                    </Space>
                  </div>
                </Col>
              </Row>
            )}

            {/* Step 2: Review & Send */}
            {currentStep === 2 && (
              <Row gutter={[16, 24]}>
                <Col xs={24} xl={16}>
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {/* Campaign Preview */}
                    <Card
                      title="Campaign Preview"
                      style={{
                        background: THEME_CONSTANTS.colors.surface,
                        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                        borderRadius: THEME_CONSTANTS.radius.lg,
                      }}
                      bodyStyle={{ padding: '24px' }}
                    >
                      <div style={{ marginBottom: THEME_CONSTANTS.spacing.xxl }}>
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          minHeight: window.innerWidth <= 768 ? '400px' : '500px'
                        }}>
                          {renderTemplatePreview(selectedTemplate)}
                        </div>
                      </div>
                    </Card>

                    {/* Campaign Details */}
                    <Card
                      title="Campaign Details"
                      style={{
                        background: THEME_CONSTANTS.colors.surface,
                        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                        borderRadius: THEME_CONSTANTS.radius.lg,
                      }}
                      bodyStyle={{ padding: '24px' }}
                    >
                      <Row gutter={[24, 16]}>
                        <Col xs={24} sm={12}>
                          <div style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: THEME_CONSTANTS.radius.md,
                            color: 'white',
                          }}>
                            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>TEMPLATE</div>
                            <div style={{ fontSize: '18px', fontWeight: 600 }}>{selectedTemplate?.name}</div>
                            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                              {MESSAGE_TYPES[selectedTemplate?.messageType]}
                            </div>
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <div style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                            borderRadius: THEME_CONSTANTS.radius.md,
                            color: 'white',
                          }}>
                            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>RECIPIENTS</div>
                            <div style={{ fontSize: '18px', fontWeight: 600 }}>{recipients.length} contacts</div>
                            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                              {recipients.filter(r => r.checking || r.capable === null).length > 0 
                                ? `${recipients.filter(r => r.capable === true).length} verified, ${recipients.filter(r => r.checking || r.capable === null).length} processing`
                                : `${recipients.filter(r => r.capable === true).length} RCS capable`
                              }
                            </div>
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <div style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            borderRadius: THEME_CONSTANTS.radius.md,
                            color: 'white',
                          }}>
                            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>SEND TIME</div>
                            <div style={{ fontSize: '18px', fontWeight: 600 }}>
                              {sendSchedule.type === 'immediate' ? 'Immediately' : dayjs(sendSchedule.dateTime).format('DD/MM/YY HH:mm')}
                            </div>
                            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                              {sendSchedule.type === 'immediate' ? 'Send now' : 'Scheduled'}
                            </div>
                          </div>
                        </Col>
                        <Col xs={24} sm={12}>
                          <div style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            borderRadius: THEME_CONSTANTS.radius.md,
                            color: 'white',
                          }}>
                            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>ESTIMATED COST</div>
                            <div style={{ fontSize: '18px', fontWeight: 600 }}>₹{(validRcsContacts.length * 1).toFixed(2)}</div>
                            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                              ₹1 per RCS contact
                            </div>
                          </div>
                        </Col>
                      </Row>

                      <Divider style={{ margin: '24px 0' }} />

                      <Form layout="vertical">
                        <Form.Item
                          label="Campaign Name"
                          required
                          style={{ marginBottom: '24px' }}
                        >
                          <Input
                            placeholder="Enter campaign name"
                            value={campaignName}
                            onChange={(e) => setCampaignName(e.target.value)}
                            size="large"
                            style={{ borderRadius: THEME_CONSTANTS.radius.md }}
                          />
                        </Form.Item>
                      </Form>

                      {/* Wallet Check */}
                      {recipients.filter(r => r.checking || r.capable === null).length > 0 ? (
                        <Alert
                          type="info"
                          showIcon
                          message="Processing Contacts"
                          description={
                            <div>
                              <p style={{ margin: '8px 0' }}>
                                {recipients.filter(r => r.checking || r.capable === null).length} contacts are still being processed for RCS capability.
                              </p>
                              <p style={{ margin: '8px 0' }}>
                                Estimated Cost: ₹{(validRcsContacts.length * 1).toFixed(2)} | Available: {formattedBalance}
                              </p>
                              <p style={{ margin: '8px 0', fontSize: '12px', color: '#666' }}>
                                ℹ️ You'll only be charged for successfully sent RCS messages
                              </p>
                            </div>
                          }
                          style={{ marginBottom: '24px' }}
                        />
                      ) : balance < recipients.filter(r => r.capable === true).length * 1 ? (
                        <Alert
                          type="error"
                          showIcon
                          message="Insufficient Balance"
                          description={
                            <div>
                              <p style={{ margin: '8px 0' }}>
                                Required: ₹{(recipients.filter(r => r.capable === true).length * 1).toFixed(2)} | Available: {formattedBalance}
                              </p>
                              <Button
                                type="primary"
                                size="small"
                                onClick={() => setShowAddMoney(true)}
                              >
                                Add Money to Wallet
                              </Button>
                            </div>
                          }
                          style={{ marginBottom: '24px' }}
                        />
                      ) : (
                        <Alert
                          type="success"
                          showIcon
                          message="Ready to Send"
                          description={`Your wallet balance (${formattedBalance}) is sufficient for this campaign.`}
                          style={{ marginBottom: '24px' }}
                        />
                      )}

                      <div style={{ 
                        marginTop: '24px', 
                        display: 'flex', 
                        gap: '12px',
                        flexDirection: window.innerWidth <= 768 ? 'column-reverse' : 'row',
                        justifyContent: window.innerWidth <= 768 ? 'stretch' : 'flex-start'
                      }}>
                        <Button
                          onClick={() => setCurrentStep(1)}
                          size={window.innerWidth <= 768 ? 'large' : 'large'}
                          style={{ 
                            height: '48px',
                            flex: window.innerWidth <= 768 ? '1' : 'none',
                            minWidth: window.innerWidth <= 768 ? 'auto' : '140px'
                          }}
                        >
                          {window.innerWidth <= 768 ? 'Back' : 'Back to Recipients'}
                        </Button>
                        <Button
                          type="primary"
                          size="large"
                          loading={sendingMessage}
                          onClick={handleSendCampaign}
                          icon={<SendOutlined />}
                          disabled={!campaignName.trim() || balance < validRcsContacts.length * 1}
                          style={{
                            height: '48px',
                            flex: window.innerWidth <= 768 ? '1' : 'none',
                            minWidth: window.innerWidth <= 768 ? 'auto' : '180px'
                          }}
                        >
                          {sendingMessage ? 'Sending...' : 'Send Campaign'}
                        </Button>
                      </div>
                    </Card>
                  </Space>
                </Col>

                <Col xs={24} xl={8}>
                  <Card
                    title="Final Summary"
                    style={{
                      background: THEME_CONSTANTS.colors.surface,
                      border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                      borderRadius: THEME_CONSTANTS.radius.lg,
                      position: 'sticky',
                      top: '20px',
                    }}
                    bodyStyle={{ padding: '20px' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚀</div>
                        <h3 style={{ margin: '0 0 8px 0', color: THEME_CONSTANTS.colors.text }}>Ready to Launch</h3>
                        <p style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>
                          Your campaign is ready to be sent
                        </p>
                      </div>

                      <Divider style={{ margin: '16px 0' }} />

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary }}>Total Contacts</span>
                          <span style={{ fontSize: '16px', fontWeight: 600 }}>{recipients.length}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary }}>RCS Capable</span>
                          <span style={{ fontSize: '16px', fontWeight: 600, color: THEME_CONSTANTS.colors.success }}>
                            {recipients.filter(r => r.capable === true).length}
                          </span>
                        </div>
                        {recipients.filter(r => r.checking || r.capable === null).length > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary }}>Processing</span>
                            <span style={{ fontSize: '16px', fontWeight: 600, color: THEME_CONSTANTS.colors.warning }}>
                              {recipients.filter(r => r.checking || r.capable === null).length}
                            </span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <span style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary }}>
                            Campaign Cost
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: 600, color: THEME_CONSTANTS.colors.warning }}>
                            ₹{(validRcsContacts.length * 1).toFixed(2)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <span style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary }}>Wallet Balance</span>
                          <span style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: balance >= validRcsContacts.length * 1 
                              ? THEME_CONSTANTS.colors.success 
                              : THEME_CONSTANTS.colors.error
                          }}>
                            {formattedBalance}
                          </span>
                        </div>
                      </div>

                      <div style={{
                        background: balance >= validRcsContacts.length * 1 
                          ? '#f0f9ff' 
                          : '#fef2f2',
                        padding: '16px',
                        borderRadius: THEME_CONSTANTS.radius.md,
                        border: `1px solid ${balance >= validRcsContacts.length * 1 
                          ? '#0ea5e9' 
                          : '#ef4444'}20`,
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: balance >= validRcsContacts.length * 1 
                            ? '#0ea5e9' 
                            : '#ef4444',
                          fontWeight: 600,
                          marginBottom: '4px'
                        }}>
                          {balance >= validRcsContacts.length * 1 
                            ? '✓ READY TO SEND' 
                            : '⚠ INSUFFICIENT BALANCE'
                          }
                        </div>
                        <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary }}>
                          {balance >= validRcsContacts.length * 1
                            ? 'Your campaign will be sent immediately after confirmation'
                            : 'Please add money to your wallet to proceed'
                          }
                        </div>
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>
            )}


        </div>
      </div>

      {/* Add Money Modal */}
      <Modal
        title="Add Money to Wallet"
        open={showAddMoney}
        onCancel={() => {
          setShowAddMoney(false);
          setAddAmount('');
        }}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Amount">
            <Input
              type="number"
              placeholder="Enter amount"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {[100, 500, 1000].map((amount) => (
              <Button key={amount} onClick={() => setAddAmount(amount.toString())}>
                ₹{amount}
              </Button>
            ))}
          </div>

          <Space style={{ width: '100%' }}>
            <Button onClick={() => setShowAddMoney(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={async () => {
                if (addAmount && parseFloat(addAmount) > 0) {
                  try {
                    const response = await _post('v1/wallet/request', {
                      amount: parseFloat(addAmount),
                      userId: user._id,
                    }, {}, localStorage.getItem('token'));
                    const data = response.data;
                    if (data.success) {
                      message.success('Recharge request submitted!');
                      setAddAmount('');
                      setShowAddMoney(false);
                      await refreshUser();
                    }
                  } catch (error) {
                    message.error('Error: ' + error.message);
                  }
                }
              }}
              style={{ flex: 1 }}
            >
              Add Money
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Manual Contact Modal */}
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
          <Button
            key="submit"
            type="primary"
            onClick={() => manualContactForm.submit()}
          >
            Add Contacts
          </Button>
        ]}
      >
        <Form form={manualContactForm} layout="vertical" onFinish={handleAddContact}>
          <Form.Item
            label="Phone Numbers"
            name="phone"
            rules={[
              { required: true, message: 'Please enter phone numbers' }
            ]}
          >
            <Input.TextArea
              rows={6}
              placeholder={`Enter phone numbers (one per line or comma separated):
9876543210
9876543211
9876543212

Or comma separated: 9876543210, 9876543211, 9876543212`}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '-16px', marginBottom: '16px' }}>
            💡 You can add multiple numbers separated by commas or new lines. Numbers will be automatically formatted with +91 prefix.
          </div>
        </Form>
      </Modal>
    </>
  );
}

export default CreateCampaign;