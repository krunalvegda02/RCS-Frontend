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
  SearchOutlined,
  CloseCircleOutlined,
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

          // Show loading message
          const hideLoading = message.loading(`Processing ${imported.length} contacts...`, 0);
          
          try {
            // Add contacts with checking status first
            const newContacts = imported.map(phone => ({
              id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              number: `+91${phone}`,
              capable: null,
              checking: true
            }));
            
            setRecipients(prev => [...prev, ...newContacts]);
            setUploadedFile(file.name);
            
            // Check RCS capability using Redux action
            const result = await dispatch(checkCapability({
              phoneNumbers: imported,
              userId: user._id
            })).unwrap();
            
            hideLoading();
            
            if (result && result.data) {
              // Update contacts with capability results
              setRecipients(prev => prev.map(contact => {
                const phoneWithoutPrefix = contact.number.replace('+91', '');
                const capabilityResult = result.data.find(r => r.phoneNumber === phoneWithoutPrefix);
                
                if (capabilityResult && imported.includes(phoneWithoutPrefix)) {
                  return {
                    ...contact,
                    capable: capabilityResult.isCapable,
                    checking: false
                  };
                }
                return contact;
              }));
              
              const rcsCapableCount = result.data.filter(r => r.isCapable).length;
              message.success(`${imported.length} contacts uploaded! ${rcsCapableCount} are RCS capable.`);
            } else {
              // Fallback: mark all as unknown capability
              setRecipients(prev => prev.map(contact => {
                const phoneWithoutPrefix = contact.number.replace('+91', '');
                if (imported.includes(phoneWithoutPrefix)) {
                  return { ...contact, capable: false, checking: false };
                }
                return contact;
              }));
              message.warning(`${imported.length} contacts uploaded, but capability check failed.`);
            }
            
          } catch (capabilityError) {
            hideLoading();
            console.error('Capability check failed:', capabilityError);
            
            // Mark all contacts as unknown capability
            setRecipients(prev => prev.map(contact => {
              const phoneWithoutPrefix = contact.number.replace('+91', '');
              if (imported.includes(phoneWithoutPrefix)) {
                return { ...contact, capable: false, checking: false };
              }
              return contact;
            }));
            
            message.warning(`${imported.length} contacts uploaded, but RCS capability check failed. They will be treated as SMS contacts.`);
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
        title: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              🚀
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1f2937' }}>Start RCS Campaign</div>
              <div style={{ fontSize: '13px', fontWeight: 400, color: '#6b7280', marginTop: '2px' }}>Review and confirm campaign details</div>
            </div>
          </div>
        ),
        width: 600,
        icon: null,
        content: (
          <div style={{ padding: '24px 0' }}>
            {/* Campaign Info Card */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '24px' }}>📋</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Campaign Name</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', marginTop: '4px' }}>{campaignName}</div>
                </div>
              </div>
            </div>

            {/* Statistics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '12px',
                padding: '16px',
                color: 'white'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>RCS READY</div>
                <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{validRcsContacts.length}</div>
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>Contacts verified</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '12px',
                padding: '16px',
                color: 'white'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>TOTAL UPLOADED</div>
                <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{totalContacts}</div>
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>All contacts</div>
              </div>

              {(totalContacts - validRcsContacts.length) > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>INVALID/PENDING</div>
                  <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{totalContacts - validRcsContacts.length}</div>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>Won't receive</div>
                </div>
              )}

              <div style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '12px',
                padding: '16px',
                color: 'white'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>ESTIMATED COST</div>
                <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>₹{estimatedCost}</div>
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>₹1 per RCS message</div>
              </div>
            </div>

            {/* Info Alert */}
            <div style={{
              background: '#eff6ff',
              border: '1px solid #3b82f6',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              gap: '12px'
            }}>
              <div style={{ fontSize: '20px' }}>ℹ️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e40af', marginBottom: '4px' }}>Important Information</div>
                <div style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: 1.5 }}>
                  Messages will be sent only to RCS capable contacts. Invalid or pending contacts will be skipped automatically.
                </div>
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
          style: {
            height: '48px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '15px'
          }
        },
        cancelButtonProps: {
          size: 'large',
          style: {
            height: '48px',
            borderRadius: '8px'
          }
        },
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

          {/* Main Content Area */}
          <Row gutter={[24, 24]}>
            {/* Left Column - Main Content */}
            <Col xs={24} lg={16}>
              {/* Step 0: Template Selection */}
              {currentStep === 0 && (
                <Card
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.xl,
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    boxShadow: THEME_CONSTANTS.shadow.lg
                  }}
                  bodyStyle={{ padding: '32px' }}
                >
                  <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.text, margin: 0, marginBottom: '8px' }}>
                        📋 Select Message Template
                      </h2>
                      <p style={{ color: THEME_CONSTANTS.colors.textSecondary, fontSize: '14px', margin: 0 }}>
                        Choose from your saved templates
                      </p>
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/templates/create')}>
                      Create New
                    </Button>
                  </div>

                  <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={16}>
                      <Input
                        placeholder="Search templates by name or content..."
                        prefix={<SearchOutlined />}
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        allowClear
                        size="large"
                      />
                    </Col>
                    <Col xs={12} sm={4}>
                      <Select
                        value={templateFilter}
                        onChange={setTemplateFilter}
                        style={{ width: '100%' }}
                        size="large"
                        options={[
                          { label: 'All Types', value: 'all' },
                          { label: 'Text', value: 'text' },
                          { label: 'Rich Card', value: 'richCard' },
                          { label: 'Carousel', value: 'carousel' }
                        ]}
                      />
                    </Col>
                    <Col xs={12} sm={4}>
                      <Button icon={<ReloadOutlined />} onClick={loadTemplates} loading={templatesLoading} style={{ width: '100%' }} size="large">
                        Refresh
                      </Button>
                    </Col>
                  </Row>

                  {templatesLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                      <Spin size="large" />
                      <p style={{ marginTop: '16px', color: THEME_CONSTANTS.colors.textSecondary }}>Loading templates...</p>
                    </div>
                  ) : filteredTemplates.length === 0 ? (
                    <Empty description="No templates found" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                      <Button type="primary" onClick={() => navigate('/templates/create')} icon={<PlusOutlined />}>
                        Create Your First Template
                      </Button>
                    </Empty>
                  ) : (
                    <Table
                      dataSource={filteredTemplates}
                      rowKey="_id"
                      pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} templates` }}
                      onRow={(record) => ({
                        onClick: () => handleTemplateSelect(record),
                        style: {
                          cursor: 'pointer',
                          backgroundColor: selectedTemplate?._id === record._id ? THEME_CONSTANTS.colors.primaryLight : 'transparent'
                        }
                      })}
                      columns={[
                        {
                          title: 'Template Name',
                          dataIndex: 'name',
                          key: 'name',
                          width: 250,
                          render: (text, record) => (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                background: record.messageType === 'text' ? '#e3f2fd' : record.messageType === 'richCard' ? '#e8f5e9' : '#fff3e0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px'
                              }}>
                                {record.messageType === 'text' ? '💬' : record.messageType === 'richCard' ? '🎨' : '🎠'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.text }}>{text}</div>
                                <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>
                                  {MESSAGE_TYPES[record.messageType] || record.messageType}
                                </div>
                              </div>
                              {selectedTemplate?._id === record._id && (
                                <CheckCircleOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '18px', marginLeft: 'auto' }} />
                              )}
                            </div>
                          )
                        },
                        {
                          title: 'Content Preview',
                          key: 'preview',
                          render: (_, record) => (
                            <div style={{ maxWidth: '300px' }}>
                              <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.text, marginBottom: '4px' }}>
                                {record.text?.substring(0, 60) || record.richCard?.title?.substring(0, 60) || 'No preview'}
                                {(record.text?.length > 60 || record.richCard?.title?.length > 60) && '...'}
                              </div>
                              {record.richCard?.description && (
                                <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary }}>
                                  {record.richCard.description.substring(0, 50)}...
                                </div>
                              )}
                            </div>
                          )
                        },
                        {
                          title: 'Type',
                          dataIndex: 'messageType',
                          key: 'type',
                          width: 150,
                          render: (type) => (
                            <Tag color={type === 'text' ? 'blue' : type === 'richCard' ? 'green' : 'orange'}>
                              {MESSAGE_TYPES[type] || type}
                            </Tag>
                          )
                        },
                        {
                          title: 'Created',
                          dataIndex: 'createdAt',
                          key: 'createdAt',
                          width: 120,
                          render: (date) => (
                            <Tooltip title={new Date(date).toLocaleString()}>
                              <span style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>
                                {dayjs(date).fromNow()}
                              </span>
                            </Tooltip>
                          )
                        },
                        {
                          title: 'Action',
                          key: 'action',
                          width: 100,
                          render: (_, record) => (
                            <Button
                              type={selectedTemplate?._id === record._id ? 'primary' : 'default'}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTemplateSelect(record);
                              }}
                            >
                              {selectedTemplate?._id === record._id ? 'Selected' : 'Select'}
                            </Button>
                          )
                        }
                      ]}
                    />
                  )}
                </Card>
              )}

              {/* Step 1: Add Recipients */}
              {currentStep === 1 && (
                <Card
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.xl,
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    boxShadow: THEME_CONSTANTS.shadow.lg,
                    minHeight: '600px'
                  }}
                  bodyStyle={{ padding: '32px' }}
                >
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{
                      fontSize: 'clamp(20px, 3vw, 24px)',
                      fontWeight: 700,
                      color: THEME_CONSTANTS.colors.text,
                      margin: 0,
                      marginBottom: '8px'
                    }}>
                      👥 Add Recipients
                    </h2>
                    <p style={{
                      color: THEME_CONSTANTS.colors.textSecondary,
                      fontSize: 'clamp(13px, 2.5vw, 14px)',
                      margin: 0
                    }}>
                      Upload contacts or add them manually
                    </p>
                  </div>

                  {/* Upload Options */}
                  <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={12} md={8}>
                      <Upload
                        beforeUpload={handleExcelUpload}
                        showUploadList={false}
                        accept=".xlsx,.xls,.csv"
                      >
                        <Button
                          icon={<UploadOutlined />}
                          style={{
                            width: '100%',
                            height: '48px',
                            borderRadius: THEME_CONSTANTS.radius.md,
                            border: `2px dashed ${THEME_CONSTANTS.colors.primary}`,
                            color: THEME_CONSTANTS.colors.primary,
                            fontWeight: 600
                          }}
                        >
                          Upload Excel/CSV
                        </Button>
                      </Upload>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Button
                        icon={<PlusOutlined />}
                        onClick={() => setManualContactModal(true)}
                        style={{
                          width: '100%',
                          height: '48px',
                          borderRadius: THEME_CONSTANTS.radius.md,
                          fontWeight: 600
                        }}
                      >
                        Add Manually
                      </Button>
                    </Col>
                    <Col xs={24} sm={24} md={8}>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={downloadDemoExcel}
                        style={{
                          width: '100%',
                          height: '48px',
                          borderRadius: THEME_CONSTANTS.radius.md
                        }}
                      >
                        Download Demo
                      </Button>
                    </Col>
                  </Row>

                  {/* Upload Status */}
                  {uploadState.isUploading && (
                    <Alert
                      message="Processing contacts..."
                      description={`Checking RCS capability for ${uploadState.totalContacts} contacts`}
                      type="info"
                      showIcon
                      style={{ marginBottom: '16px' }}
                    />
                  )}

                  {/* Contacts Summary */}
                  {recipients.length > 0 && (
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="Total"
                          value={recipients.length}
                          prefix={<TeamOutlined />}
                          valueStyle={{ fontSize: 'clamp(16px, 3vw, 20px)' }}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="RCS Ready"
                          value={validRcsContacts.length}
                          prefix={<CheckCircleOutlined />}
                          valueStyle={{ color: THEME_CONSTANTS.colors.success, fontSize: 'clamp(16px, 3vw, 20px)' }}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="Invalid"
                          value={invalidContacts.length}
                          prefix={<CloseCircleOutlined />}
                          valueStyle={{ color: '#ff4d4f', fontSize: 'clamp(16px, 3vw, 20px)' }}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic
                          title="Checking"
                          value={pendingContacts.length}
                          prefix={<ClockCircleOutlined />}
                          valueStyle={{ color: '#faad14', fontSize: 'clamp(16px, 3vw, 20px)' }}
                        />
                      </Col>
                    </Row>
                  )}

                  {/* Contacts List */}
                  {recipients.length > 0 ? (
                    <div style={{ marginTop: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>RCS Ready Contacts</h3>
                        <Button
                          danger
                          size="small"
                          onClick={() => {
                            setRecipients([]);
                            message.success('All contacts cleared');
                          }}
                        >
                          Clear All
                        </Button>
                      </div>
                      <VirtualizedContactList
                        contacts={recipients}
                        deleteContact={deleteContact}
                        loading={uploadState.isUploading}
                      />
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                      <Empty
                        description="No contacts added yet"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </div>
                  )}
                </Card>
              )}

              {/* Step 2: Review & Send */}
              {currentStep === 2 && (
                <Card
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.xl,
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    boxShadow: THEME_CONSTANTS.shadow.lg,
                    minHeight: '600px'
                  }}
                  bodyStyle={{ padding: '32px' }}
                >
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{
                      fontSize: 'clamp(20px, 3vw, 24px)',
                      fontWeight: 700,
                      color: THEME_CONSTANTS.colors.text,
                      margin: 0,
                      marginBottom: '8px'
                    }}>
                      🚀 Review & Send Campaign
                    </h2>
                    <p style={{
                      color: THEME_CONSTANTS.colors.textSecondary,
                      fontSize: 'clamp(13px, 2.5vw, 14px)',
                      margin: 0
                    }}>
                      Review your campaign details and send
                    </p>
                  </div>

                  {/* Campaign Name */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: THEME_CONSTANTS.colors.text
                    }}>
                      Campaign Name *
                    </label>
                    <Input
                      placeholder="Enter campaign name"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      style={{
                        height: '48px',
                        borderRadius: THEME_CONSTANTS.radius.md,
                        fontSize: '16px'
                      }}
                    />
                  </div>

                  {/* Campaign Summary */}
                  <div style={{
                    background: THEME_CONSTANTS.colors.primaryLight,
                    padding: '24px',
                    borderRadius: THEME_CONSTANTS.radius.lg,
                    marginBottom: '24px'
                  }}>
                    <h3 style={{ margin: 0, marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>📊 Campaign Summary</h3>
                    <Row gutter={[16, 16]}>
                      <Col xs={12} sm={6}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 700, color: THEME_CONSTANTS.colors.primary }}>
                            {validRcsContacts.length}
                          </div>
                          <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>RCS Recipients</div>
                        </div>
                      </Col>
                      <Col xs={12} sm={6}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 700, color: THEME_CONSTANTS.colors.success }}>
                            ₹{validRcsContacts.length}
                          </div>
                          <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>Estimated Cost</div>
                        </div>
                      </Col>
                      <Col xs={12} sm={6}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 700, color: THEME_CONSTANTS.colors.text }}>
                            {MESSAGE_TYPES[selectedTemplate?.messageType] || selectedTemplate?.messageType || 'N/A'}
                          </div>
                          <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>Message Type</div>
                        </div>
                      </Col>
                      <Col xs={12} sm={6}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 700, color: THEME_CONSTANTS.colors.warning }}>
                            {formattedBalance}
                          </div>
                          <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>Wallet Balance</div>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Send Button */}
                  <div style={{ textAlign: 'center' }}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<SendOutlined />}
                      onClick={handleSendCampaign}
                      loading={sendingMessage}
                      disabled={!campaignName.trim() || validRcsContacts.length === 0}
                      style={{
                        height: '56px',
                        padding: '0 48px',
                        fontSize: '16px',
                        fontWeight: 600,
                        borderRadius: THEME_CONSTANTS.radius.lg,
                        boxShadow: THEME_CONSTANTS.shadow.lg
                      }}
                    >
                      Send Campaign to {validRcsContacts.length} Recipients
                    </Button>
                  </div>
                </Card>
              )}
            </Col>

            {/* Right Column - Preview & Navigation */}
            <Col xs={24} lg={8}>
              <div style={{ position: 'sticky', top: '24px' }}>
                {/* Template Preview */}
                <Card
                  className="template-preview-section"
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.xl,
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    boxShadow: THEME_CONSTANTS.shadow.lg,
                    marginBottom: '24px'
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 600,
                      color: THEME_CONSTANTS.colors.text
                    }}>
                      📱 Message Preview
                    </h3>
                  </div>
                  {renderTemplatePreview()}
                </Card>

                {/* Navigation Buttons */}
                <Card
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.xl,
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    boxShadow: THEME_CONSTANTS.shadow.lg
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {currentStep > 0 && (
                      <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => setCurrentStep(currentStep - 1)}
                        style={{
                          width: '100%',
                          height: '48px',
                          borderRadius: THEME_CONSTANTS.radius.md,
                          fontWeight: 600
                        }}
                      >
                        Previous Step
                      </Button>
                    )}
                    
                    {currentStep < 2 && (
                      <Button
                        type="primary"
                        icon={<ArrowRightOutlined />}
                        onClick={() => {
                          if (currentStep === 0 && !selectedTemplate) {
                            message.error('Please select a template first');
                            return;
                          }
                          if (currentStep === 1 && validRcsContacts.length === 0) {
                            message.error('Please add valid RCS contacts first');
                            return;
                          }
                          setCurrentStep(currentStep + 1);
                        }}
                        style={{
                          width: '100%',
                          height: '48px',
                          borderRadius: THEME_CONSTANTS.radius.md,
                          fontWeight: 600
                        }}
                      >
                        Next Step
                      </Button>
                    )}
                    
                    <Button
                      danger
                      onClick={() => {
                        Modal.confirm({
                          title: 'Clear Campaign',
                          content: 'Are you sure you want to clear all campaign data?',
                          onOk: clearAllFields
                        });
                      }}
                      style={{
                        width: '100%',
                        height: '40px',
                        borderRadius: THEME_CONSTANTS.radius.md
                      }}
                    >
                      Clear All
                    </Button>
                  </Space>
                </Card>
              </div>
            </Col>
          </Row>

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