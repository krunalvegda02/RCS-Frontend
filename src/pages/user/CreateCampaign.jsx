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
  MessageOutlined,
  FileImageOutlined,
  AppstoreOutlined,
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
// import { sendBulkMessage, checkCapability } from '../../redux/slices/campaignSlice';
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
  plainText: 'Plain Text',
  textWithAction: 'Text with Actions',
  richCard: 'Rich Card',
  carousel: 'Carousel',
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
  const { balance, availableBalance, blockedBalance, currency, formattedBalance, formattedAvailableBalance, checkBalance, hasBlockedBalance } = useWallet();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // Contact upload hook
  const { uploadState, uploadContacts, resetUpload } = useContactUpload();

  // Redux state
  const { userTemplates, loading: templatesLoading, error: templatesError, pagination: templatesPagination } = useSelector(state => state.templates);
  const { sendingMessage, messageError, capabilityResults } = useSelector(state => state.campaigns);

  // State Management
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [messageType, setMessageType] = useState('text');
  const [messageText, setMessageText] = useState('');
  const [cardDescription, setCardDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [footer, setFooter] = useState('');
  const [buttons, setButtons] = useState([]);
  const [carouselCards, setCarouselCards] = useState([]);

  const [recipients, setRecipients] = useState([]);
  const [showContactsTable, setShowContactsTable] = useState(false);
  const [contactCounts, setContactCounts] = useState({ total: 0, rcsCapable: 0, invalid: 0 });
  const [batchProgress, setBatchProgress] = useState(null);
  
  // Debug: Log recipients state changes
  useEffect(() => {
    const checkingCount = recipients.filter(r => r.checking).length;
    if (checkingCount > 0) {
      console.log('[DEBUG] Recipients with checking=true:', checkingCount);
    }
  }, [recipients]);
  const [sendSchedule, setSendSchedule] = useState({ type: 'immediate', dateTime: null });
  const [campaignName, setCampaignName] = useState('');

  const [manualContactModal, setManualContactModal] = useState(false);
  const [manualContactForm] = Form.useForm();

  const [checkingCapability, setCheckingCapability] = useState(false);
  const [campaignSummary, setCampaignSummary] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');

  // Filter to show only valid RCS contacts in table
  const validRcsContacts = recipients.filter(contact => contact.capable === true);
  const invalidContacts = recipients.filter(contact => contact.capable === false);
  const pendingContacts = recipients.filter(contact => contact.capable === null || contact.checking === true);

  // Use contactCounts for display (more accurate than filtering recipients)
  const displayValidCount = contactCounts.rcsCapable || validRcsContacts.length;
  const displayInvalidCount = contactCounts.invalid || invalidContacts.length;

  // Load templates on mount and cleanup on unmount
  useEffect(() => {
    if (user?._id) {
      dispatch(fetchUserTemplates({ userId: user._id, page: currentPage, limit: pageSize }));
    }
    
    // Cleanup function to clear state when component unmounts
    return () => {
      setRecipients([]);
      setSelectedTemplate(null);
      setCampaignName('');
    };
  }, [user, dispatch, currentPage, pageSize]);

  // Load Templates from Redux
  const loadTemplates = () => {
    if (user?._id) {
      dispatch(fetchUserTemplates({ userId: user._id, page: currentPage, limit: pageSize }));
    }
  };

  // Filter templates based on search and filter - trigger new API call
  useEffect(() => {
    if (user?._id && (templateSearch || templateFilter !== 'all')) {
      const timer = setTimeout(() => {
        dispatch(fetchUserTemplates({ 
          userId: user._id, 
          page: 1, // Reset to page 1 when searching/filtering
          limit: pageSize,
          search: templateSearch,
          templateType: templateFilter !== 'all' ? templateFilter : undefined
        }));
        setCurrentPage(1); // Reset current page
      }, 500); // Debounce search
      
      return () => clearTimeout(timer);
    } else if (user?._id) {
      setFilteredTemplates(userTemplates);
    }
  }, [templateSearch, templateFilter, user, dispatch, pageSize]);

  // Update filtered templates when userTemplates changes
  useEffect(() => {
    setFilteredTemplates(userTemplates);
  }, [userTemplates]);

  // Handle Template Selection - Open Modal
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

      // Open campaign modal
      setShowCampaignModal(true);
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
      
      // const result = await dispatch(checkCapability({
      //   phoneNumbers: numbers,
      //   userId: user._id
      // })).unwrap();
      
      // Hide loading message
      message.destroy();
      
      return result;
    } catch (error) {
      message.destroy();
      console.error('Error checking capability:', error);
      throw error;
    }
  };

  // Import Excel File with streaming progress
  const handleExcelUpload = async (file) => {
    try {
      if (!file) {
        message.error('Please select a file');
        return false;
      }

      const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
      if (!allowedTypes.includes(file.type)) {
        message.error('Please upload only Excel (.xlsx, .xls) or CSV files');
        return false;
      }

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

            if (!skippedFirst) {
              const firstCell = String(row[0] || '').toLowerCase();
              if (['index', 'sn', 'number', 'name', 'phone'].some((h) => firstCell.includes(h))) {
                skippedFirst = true;
                continue;
              }
            }

            row.forEach((cell) => {
              if (!cell && cell !== 0) return;
              let num = String(cell).trim().replace(/[\s\-()\.]/g, '').replace(/[^\d+]/g, '');
              if (num.startsWith('+91')) num = num.substring(3);
              else if (num.startsWith('+')) {
                num = num.substring(1);
                if (num.startsWith('91')) num = num.substring(2);
              } else if (num.startsWith('91') && num.length > 10) num = num.substring(2);
              else if (num.startsWith('0')) num = num.substring(1);

              if (/^\d{10}$/.test(num) && !seen.has(num)) {
                seen.add(num);
                imported.push(num);
              }
            });
          }

          if (imported.length === 0) {
            message.error('No valid phone numbers found in the file.');
            return;
          }

          // Store contacts immediately
          const newContacts = imported.map(phone => ({
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            number: `+91${phone}`,
            capable: null,
            checking: false
          }));
          
          setRecipients(newContacts);
          setUploadedFile(file.name);
          setShowContactsTable(false);
          setContactCounts({ total: imported.length, rcsCapable: 0, invalid: 0 });

          // For large files, use streaming
          if (imported.length > 5000) {
            setBatchProgress({ processed: 0, total: imported.length, rcsCapable: 0, chunk: 0, totalChunks: Math.ceil(imported.length / 10000) });
            
            try {
              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
              console.log('[Streaming] Starting capability check for', imported.length, 'contacts');
              console.log('[Streaming] API URL:', `${apiUrl}/v1/campaigns/check-capability`);
              
              const response = await fetch(`${apiUrl}/v1/campaigns/check-capability`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                  phoneNumbers: imported,
                  userId: user._id,
                  countOnly: true,
                  streaming: true
                })
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              console.log('[Streaming] Response received, starting to read stream');
              const reader = response.body.getReader();
              const decoder = new TextDecoder();
              let buffer = '';

              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  console.log('[Streaming] Stream complete');
                  break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                  if (!line.trim()) continue;
                  
                  try {
                    const data = JSON.parse(line);
                    console.log('[Streaming] Received:', data.type, data);

                    if (data.type === 'progress') {
                      // Update progress in real-time
                      setBatchProgress({
                        processed: data.processed,
                        total: data.total,
                        rcsCapable: data.rcsCapable,
                        chunk: data.chunk,
                        totalChunks: data.totalChunks
                      });
                      
                      // Update counts in real-time
                      setContactCounts({
                        total: data.total,
                        rcsCapable: data.rcsCapable,
                        invalid: data.processed - data.rcsCapable
                      });
                    } else if (data.type === 'complete') {
                      // Final update
                      setContactCounts({
                        total: data.summary.total,
                        rcsCapable: data.summary.rcsCapable,
                        invalid: data.summary.notCapable
                      });
                      setBatchProgress(null);
                      message.success(`${imported.length} contacts uploaded! ${data.summary.rcsCapable} are RCS capable.`);
                    }
                  } catch (parseError) {
                    console.error('[Streaming] Parse error:', parseError, 'Line:', line);
                  }
                }
              }
            } catch (error) {
              console.error('[Streaming] Error:', error);
              setBatchProgress(null);
              message.error('Failed to check RCS capability: ' + error.message);
            }
          } else {
            // Small files - use regular API
            let loadingMessage = message.loading(`Checking RCS capability for ${imported.length} contacts...`, 0);
            
            try {
              // const dispatchResult = dispatch(checkCapability({
              //   phoneNumbers: imported,
              //   userId: user._id,
              //   countOnly: true
              // }));
              
              const result = await dispatchResult;
              const unwrapped = result.payload;
              
              if (typeof loadingMessage === 'function') loadingMessage();
              
              setContactCounts({
                total: imported.length,
                rcsCapable: unwrapped?.summary?.rcsCapable || 0,
                invalid: unwrapped?.summary?.notCapable || 0
              });
              
              message.success(`${imported.length} contacts uploaded! ${unwrapped?.summary?.rcsCapable || 0} are RCS capable.`);
            } catch (error) {
              if (typeof loadingMessage === 'function') loadingMessage();
              console.error('Capability check failed:', error);
              message.warning(`${imported.length} contacts uploaded, but RCS capability check failed.`);
            }
          }

        } catch (error) {
          console.error('Error parsing file:', error);
          message.error('Error parsing file: ' + error.message);
        }
      };

      reader.onerror = () => message.error('Error reading file');
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      message.error('Error uploading file: ' + error.message);
    }

    return false;
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
          capable: false,
          checking: false
        }));
        
        setRecipients(prev => [...prev, ...newContacts]);
        manualContactForm.resetFields();
        setManualContactModal(false);
        
        message.warning(`${newContacts.length} contacts added, but capability check failed.`);
      }

    } catch (error) {
      console.error('Error adding contacts:', error);
      message.error('Error adding contacts: ' + error.message);
    }
  };

  // Fetch full contact details when "Show Contacts" is clicked
  const handleShowContacts = async () => {
    if (showContactsTable) {
      setShowContactsTable(false);
      return;
    }

    const loadingMessage = message.loading('Loading contact details...', 0);
    
    try {
      const phoneNumbers = recipients.map(r => r.number.replace('+91', ''));
      
      // const dispatchResult = dispatch(checkCapability({
      //   phoneNumbers: phoneNumbers,
      //   userId: user._id,
      //   countOnly: false // Get full contact details
      // }));
      
      const result = await dispatchResult;
      const unwrapped = result.payload;
      
      if (typeof loadingMessage === 'function') {
        loadingMessage();
      }
      
      // Build capability map from response
      const capabilityMap = new Map();
      if (unwrapped?.data && Array.isArray(unwrapped.data)) {
        unwrapped.data.forEach(r => {
          const phone = String(r.phoneNumber).replace(/^\+?91/, '');
          capabilityMap.set(phone, r.isCapable);
        });
      }
      
      // Update contacts with capability results
      setRecipients(prev => prev.map(contact => {
        const phone = contact.number.replace('+91', '');
        return {
          ...contact,
          capable: capabilityMap.has(phone) ? capabilityMap.get(phone) : false,
          checking: false
        };
      }));
      
      setShowContactsTable(true);
      message.success('Contact details loaded');
      
    } catch (error) {
      if (typeof loadingMessage === 'function') {
        loadingMessage();
      }
      console.error('Error loading contacts:', error);
      message.error('Failed to load contact details');
    }
  };
  const deleteContact = (id) => {
    setRecipients(recipients.filter((c) => c.id !== id));
    message.success('Contact removed');
  };
  
  // Clear all contacts
  const clearAllContacts = () => {
    setRecipients([]);
    setUploadedFile(null);
    setShowContactsTable(false);
    setContactCounts({ total: 0, rcsCapable: 0, invalid: 0 });
    message.success('All contacts cleared');
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
      const validRcsContactsCount = contactCounts.rcsCapable || validRcsContacts.length;
      const totalContacts = recipients.length;
      
      if (validRcsContactsCount === 0) {
        message.error('No valid RCS contacts found. Please add RCS capable contacts.');
        return;
      }

      // Estimate cost only for valid RCS contacts
      const estimatedCost = validRcsContactsCount * 1;
      if (!checkBalance(estimatedCost)) {
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
                <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{validRcsContactsCount}</div>
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

              {(totalContacts - validRcsContactsCount) > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px', fontWeight: 600 }}>INVALID/PENDING</div>
                  <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>{totalContacts - validRcsContactsCount}</div>
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
            recipients: recipients.map(c => ({
              phoneNumber: c.number.replace('+91', ''),
              isRcsCapable: true, // Only send RCS capable contacts
              variables: {}
            })).filter((_, idx) => idx < validRcsContactsCount), // Only send the count of RCS capable contacts
            autoStart: true
          }, {}, localStorage.getItem('token'));
          
          hideLoading();
          
          if (uploadResponse.data.success) {
            Modal.success({
              title: 'Campaign Started Successfully!',
              content: (
                <div>
                  <p>✅ Campaign "{campaignName}" started successfully!</p>
                  <p>📊 RCS Ready Contacts: {validRcsContactsCount}</p>
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
          
          // Handle blocked balance error
          if (error?.response?.data?.blockedBalance > 0) {
            const errorData = error.response.data;
            const activeCampaigns = errorData.activeCampaigns || [];
            
            Modal.error({
              title: 'Insufficient Available Balance',
              width: 600,
              content: (
                <div>
                  <p style={{ fontSize: '14px', marginBottom: '16px' }}>
                    <strong>₹{errorData.blockedBalance?.toLocaleString()}</strong> is currently blocked and being used in active campaigns.
                  </p>
                  
                  {activeCampaigns.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#6b7280' }}>Active Campaigns:</div>
                      {activeCampaigns.map((camp, idx) => (
                        <div key={idx} style={{
                          background: '#f9fafb',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          marginBottom: '6px',
                          fontSize: '13px'
                        }}>
                          📊 {camp.name} - <strong>₹{camp.blockedAmount?.toLocaleString()}</strong> blocked
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div style={{
                    background: '#fef3c7',
                    border: '1px solid #fbbf24',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13px'
                  }}>
                    <div><strong>Total Balance:</strong> ₹{errorData.totalBalance?.toLocaleString()}</div>
                    <div><strong>Blocked:</strong> ₹{errorData.blockedBalance?.toLocaleString()}</div>
                    <div><strong>Available:</strong> ₹{errorData.available?.toLocaleString()}</div>
                    <div style={{ marginTop: '8px', color: '#92400e' }}>
                      <strong>Required:</strong> ₹{errorData.required?.toLocaleString()}
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '13px', marginTop: '16px', color: '#6b7280' }}>
                    Please wait for active campaigns to complete or add more balance to your wallet.
                  </p>
                </div>
              ),
              okText: 'Add Balance',
              onOk: () => setShowAddMoney(true)
            });
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Failed to start campaign';
      message.error(errorMessage);
    }
  };

  // Clear all form fields
  const clearAllFields = () => {
    setSelectedTemplate(null);
    setMessageType('text');
    setMessageText('');
    setCardDescription('');
    setMediaUrl('');
    setFooter('');
    setButtons([]);
    setCarouselCards([]);
    setRecipients([]);
    setCampaignName('');
    setUploadedFile(null);
    setShowCampaignModal(false);
    
    form.resetFields();
    manualContactForm.resetFields();
    setTemplateSearch('');
    setTemplateFilter('all');
    resetUpload();
    
    message.success('All fields cleared');
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
                        Bulk Message Campaign 
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
              {/* <Col xs={24} lg={6}>
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
              </Col> */}
            </Row>
          </div>

          {/* Main Content Area */}
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
                        Select Message Template
                      </h2>
                      <p style={{ color: THEME_CONSTANTS.colors.textSecondary, fontSize: '14px', margin: 0 }}>
                        Choose from your saved templates
                      </p>
                    </div>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/create-template')}>
                      Create New Template
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
                          { label: 'Plain Text', value: 'plainText' },
                          { label: 'Text with Actions', value: 'textWithAction' },
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
                      <Button type="primary" onClick={() => navigate('/create-template')} icon={<PlusOutlined />}>
                        Create Your First Template
                      </Button>
                    </Empty>
                  ) : (
                    <Table
                      dataSource={filteredTemplates}
                      rowKey="_id"
                      pagination={{ 
                        current: currentPage,
                        pageSize: pageSize,
                        total: templatesPagination?.total || 0,
                        showSizeChanger: true, 
                        pageSizeOptions: ['5', '10', '20', '50'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} templates`,
                        position: ['bottomCenter'],
                        onChange: (page, size) => {
                          setCurrentPage(page);
                          setPageSize(size);
                          dispatch(fetchUserTemplates({ 
                            userId: user._id, 
                            page, 
                            limit: size,
                            search: templateSearch,
                            templateType: templateFilter !== 'all' ? templateFilter : undefined
                          }));
                        }
                      }}
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
                          width: 220,
                          render: (text, record) => (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                background: record.templateType === 'plainText' ? '#e3f2fd' : record.templateType === 'richCard' ? '#e8f5e9' : record.templateType === 'carousel' ? '#fff3e0' : '#f3e5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {record.templateType === 'plainText' ? (
                                  <MessageOutlined style={{ fontSize: '18px', color: '#1976d2' }} />
                                ) : record.templateType === 'richCard' ? (
                                  <FileImageOutlined style={{ fontSize: '18px', color: '#388e3c' }} />
                                ) : record.templateType === 'carousel' ? (
                                  <AppstoreOutlined style={{ fontSize: '18px', color: '#f57c00' }} />
                                ) : (
                                  <MailOutlined style={{ fontSize: '18px', color: '#7b1fa2' }} />
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.text, fontSize: '14px', lineHeight: '20px' }}>{text}</div>
                                <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '2px', lineHeight: '16px' }}>
                                  {MESSAGE_TYPES[record.templateType] || record.templateType}
                                </div>
                              </div>
                              {selectedTemplate?._id === record._id && (
                                <CheckCircleOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '16px', flexShrink: 0 }} />
                              )}
                            </div>
                          )
                        },
                        {
                          title: 'Content Preview',
                          key: 'content',
                          render: (_, record) => {
                            let preview = '';
                            let fullContent = '';
                            let cardCount = 0;
                            
                            if (record.templateType === 'plainText') {
                              preview = record.content?.body || record.content?.text || record.description || 'No content';
                              fullContent = preview;
                            } else if (record.templateType === 'richCard') {
                              const title = record.content?.title || '';
                              const desc = record.content?.description || record.content?.subtitle || '';
                              preview = title;
                              fullContent = `${title}${desc ? ' - ' + desc : ''}`;
                            } else if (record.templateType === 'carousel') {
                              const cards = record.content?.cards || [];
                              cardCount = cards.length;
                              if (cards.length > 0) {
                                const cardPreviews = cards.map((card, idx) => 
                                  `Card ${idx + 1}: ${card.title || 'Untitled'}${card.description || card.subtitle ? ' - ' + (card.description || card.subtitle) : ''}` 
                                ).join(' | ');
                                preview = cards.map(c => c.title).filter(Boolean).join(', ');
                                fullContent = cardPreviews;
                              } else {
                                preview = 'No cards';
                                fullContent = preview;
                              }
                            } else if (record.templateType === 'textWithAction') {
                              preview = record.content?.body || record.content?.text || record.description || 'No content';
                              fullContent = preview;
                            }
                            
                            return (
                              <Tooltip title={<div style={{ whiteSpace: 'pre-wrap', maxWidth: '400px' }}>{fullContent}</div>}>
                                <div style={{ 
                                  fontSize: '13px', 
                                  color: THEME_CONSTANTS.colors.textSecondary, 
                                  lineHeight: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  {record.templateType === 'carousel' && cardCount > 0 && (
                                    <span style={{
                                      background: THEME_CONSTANTS.colors.primaryLight,
                                      color: THEME_CONSTANTS.colors.primary,
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      letterSpacing: '0.3px',
                                      border: `1px solid ${THEME_CONSTANTS.colors.primary}`
                                    }}>
                                      {cardCount} Cards
                                    </span>
                                  )}
                                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {preview?.substring(0, 50) || 'No content'}
                                    {preview?.length > 50 && '...'}
                                  </span>
                                </div>
                              </Tooltip>
                            );
                          }
                        },
                        {
                          title: 'Type',
                          dataIndex: 'templateType',
                          key: 'type',
                          width: 160,
                          align: 'center',
                          render: (type) => {
                            const typeConfig = {
                              plainText: { icon: <MessageOutlined />, color: '#1976d2', bg: '#e3f2fd' },
                              richCard: { icon: <FileImageOutlined />, color: '#388e3c', bg: '#e8f5e9' },
                              carousel: { icon: <AppstoreOutlined />, color: '#f57c00', bg: '#fff3e0' },
                              textWithAction: { icon: <MailOutlined />, color: '#7b1fa2', bg: '#f3e5f5' }
                            };
                            const config = typeConfig[type] || typeConfig.plainText;
                            
                            return (
                              <Tag 
                                icon={config.icon}
                                style={{ 
                                  padding: '6px 16px', 
                                  fontSize: '12px', 
                                  fontWeight: 600, 
                                  borderRadius: '8px', 
                                  width: '145px', 
                                  textAlign: 'center', 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  background: config.bg,
                                  color: config.color,
                                  border: `1px solid ${config.color}`,
                                  letterSpacing: '-0.01em'
                                }}
                              >
                                {MESSAGE_TYPES[type] || type}
                              </Tag>
                            );
                          }
                        },
                        {
                          title: 'Usage',
                          dataIndex: 'usageCount',
                          key: 'usage',
                          width: 90,
                          align: 'center',
                          render: (count) => (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '18px', fontWeight: 700, color: THEME_CONSTANTS.colors.primary }}>
                                {count || 0}
                              </span>
                              <span style={{ fontSize: '10px', color: THEME_CONSTANTS.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                times
                              </span>
                            </div>
                          )
                        },
                        {
                          title: 'Created',
                          dataIndex: 'createdAt',
                          key: 'createdAt',
                          width: 110,
                          align: 'center',
                          render: (date) => (
                            <Tooltip title={new Date(date).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: THEME_CONSTANTS.colors.text }}>
                                  {dayjs(date).format('MMM DD')}
                                </span>
                                <span style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary }}>
                                  {dayjs(date).fromNow()}
                                </span>
                              </div>
                            </Tooltip>
                          )
                        },
                        {
                          title: 'Action',
                          key: 'action',
                          width: 140,
                          fixed: 'right',
                          align: 'center',
                          render: (_, record) => {
                            const isSelected = selectedTemplate?._id === record._id;
                            return (
                              <Space size="small">
                                <Tooltip title="Preview template">
                                  <Button
                                    type="text"
                                    icon={<EyeOutlined style={{ fontSize: '18px' }} />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTemplate(record);
                                      setShowPreviewModal(true);
                                    }}
                                    style={{ 
                                      color: THEME_CONSTANTS.colors.primary,
                                      padding: '4px 8px'
                                    }}
                                  />
                                </Tooltip>
                                <Button
                                  type={isSelected ? 'primary' : 'default'}
                                  size="small"
                                  icon={isSelected ? <CheckOutlined /> : null}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSelected) {
                                      setSelectedTemplate(null);
                                    } else {
                                      handleTemplateSelect(record);
                                    }
                                  }}
                                  style={{ 
                                    fontWeight: 600, 
                                    padding: '4px 20px',
                                    borderRadius: '6px',
                                    minWidth: '85px'
                                  }}
                                >
                                  {isSelected ? 'Selected' : 'Use'}
                                </Button>
                              </Space>
                            );
                          }
                        }
                      ]}
                    />
                  )}
                </Card>

        </div>
      </div>

      {/* Campaign Creation Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SendOutlined style={{ fontSize: '24px', color: THEME_CONSTANTS.colors.primary }} />
            <span style={{ fontSize: '18px', fontWeight: 700 }}>Create Campaign</span>
          </div>
        }
        open={showCampaignModal}
        onCancel={() => {
          setShowCampaignModal(false);
          setCampaignName('');
          setRecipients([]);
        }}
        width={800}
        footer={null}
        closable={false}
      >
        <div style={{ padding: '24px 0' }}>
          {/* Template Preview - Professional Button */}
          <div style={{ 
            position: 'absolute',
            top: '24px',
            right: '24px',
            zIndex: 10
          }}>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => setShowPreviewModal(true)}
              style={{
                fontSize: '14px',
                fontWeight: 600,
                height: '44px',
                padding: '0 24px',
                borderRadius: THEME_CONSTANTS.radius.md,
                background: THEME_CONSTANTS.colors.primary,
                borderColor: THEME_CONSTANTS.colors.primary,
                boxShadow: THEME_CONSTANTS.shadow.md
              }}
            >
              Preview Message
            </Button>
          </div>

          {/* Campaign Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: THEME_CONSTANTS.colors.text,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Campaign Name *
            </label>
            <Input
              placeholder="Enter campaign name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              size="large"
              style={{
                fontSize: '15px',
                height: '48px',
                borderRadius: THEME_CONSTANTS.radius.md
              }}
            />
          </div>

          {/* Upload Contacts */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontSize: '13px',
              fontWeight: 600,
              color: THEME_CONSTANTS.colors.text,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Upload Contacts *
            </label>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={8}>
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
                      fontSize: '14px',
                      fontWeight: 500,
                      borderRadius: THEME_CONSTANTS.radius.md,
                      border: `2px dashed ${THEME_CONSTANTS.colors.primary}`,
                      color: THEME_CONSTANTS.colors.primary
                    }}
                  >
                    Upload Excel/CSV
                  </Button>
                </Upload>
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setManualContactModal(true)}
                  style={{ 
                    width: '100%', 
                    height: '48px',
                    fontSize: '14px',
                    fontWeight: 500,
                    borderRadius: THEME_CONSTANTS.radius.md
                  }}
                >
                  Add Manually
                </Button>
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={downloadDemoExcel}
                  style={{ 
                    width: '100%', 
                    height: '48px',
                    fontSize: '14px',
                    fontWeight: 500,
                    borderRadius: THEME_CONSTANTS.radius.md
                  }}
                >
                  Download Demo
                </Button>
              </Col>
            </Row>
          </div>

          {/* Batch Progress */}
          {batchProgress && (
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px',
              borderRadius: THEME_CONSTANTS.radius.lg,
              marginBottom: '24px',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <Spin style={{ color: 'white' }} />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>Processing Batch {batchProgress.chunk}/{batchProgress.totalChunks}</div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>
                    {batchProgress.processed.toLocaleString()} / {batchProgress.total.toLocaleString()} contacts checked
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>
                    ✅ {batchProgress.rcsCapable.toLocaleString()} RCS capable found
                  </div>
                </div>
              </div>
              <Progress 
                percent={Math.round((batchProgress.processed / batchProgress.total) * 100)}
                strokeColor="white"
                trailColor="rgba(255,255,255,0.3)"
                showInfo={true}
                format={(percent) => `${percent}%`}
              />
            </div>
          )}

          {/* Upload Status */}
          {uploadState.isUploading && (
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px',
              borderRadius: THEME_CONSTANTS.radius.lg,
              marginBottom: '24px',
              color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <Spin style={{ color: 'white' }} />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>Processing Contacts...</div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>Checking RCS capability for {uploadState.totalContacts} contacts</div>
                </div>
              </div>
              <Progress 
                percent={uploadState.totalContacts > 0 ? Math.round((uploadState.processedContacts / uploadState.totalContacts) * 100) : 0}
                strokeColor="white"
                trailColor="rgba(255,255,255,0.3)"
                showInfo={false}
              />
            </div>
          )}

          {/* Contacts Summary */}
          {recipients.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: THEME_CONSTANTS.colors.text }}>Uploaded Contacts</h4>
                <Space>
                  <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={handleShowContacts}
                  >
                    {showContactsTable ? 'Hide Contacts' : 'Show Contacts'}
                  </Button>
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      setRecipients([]);
                      setUploadedFile(null);
                      setShowContactsTable(false);
                      setContactCounts({ total: 0, rcsCapable: 0, invalid: 0 });
                      resetUpload();
                      message.success('All contacts cleared');
                    }}
                  >
                    Clear All
                  </Button>
                </Space>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                padding: '20px',
                borderRadius: THEME_CONSTANTS.radius.lg,
                marginBottom: '16px',
                border: `1px solid ${THEME_CONSTANTS.colors.border}`
              }}>
                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: 700, color: THEME_CONSTANTS.colors.text }}>
                        {contactCounts.total}
                      </div>
                      <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</div>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: 700, color: THEME_CONSTANTS.colors.success }}>
                        {contactCounts.rcsCapable}
                      </div>
                      <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>RCS Ready</div>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: 700, color: '#ff4d4f' }}>
                        {contactCounts.invalid}
                      </div>
                      <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invalid</div>
                    </div>
                  </Col>
                  <Col xs={12} sm={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: 700, color: THEME_CONSTANTS.colors.warning }}>
                        ₹{contactCounts.rcsCapable}
                      </div>
                      <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cost</div>
                    </div>
                  </Col>
                </Row>
              </div>

              {showContactsTable && (
                <div style={{ marginBottom: '16px' }}>
                  <VirtualizedContactList
                    contacts={recipients}
                    deleteContact={deleteContact}
                    loading={uploadState.isUploading}
                  />
                </div>
              )}
            </>
          ) : (
            <div style={{ 
              border: `1px solid ${THEME_CONSTANTS.colors.border}`, 
              borderRadius: THEME_CONSTANTS.radius.md, 
              padding: '40px 20px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <Empty description="No contacts uploaded yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          )}



          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
            <Button
              onClick={() => {
                setShowCampaignModal(false);
                setCampaignName('');
                setRecipients([]);
              }}
              size="large"
              style={{
                height: '48px',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: THEME_CONSTANTS.radius.md
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendCampaign}
              loading={sendingMessage}
              disabled={!campaignName.trim() || displayValidCount === 0}
              size="large"
              style={{
                height: '48px',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: THEME_CONSTANTS.radius.md,
                boxShadow: THEME_CONSTANTS.shadow.md
              }}
            >
              Send Campaign ({displayValidCount} contacts)
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal with Blur Background */}
      <Modal
        open={showPreviewModal}
        onCancel={() => setShowPreviewModal(false)}
        footer={null}
        width={450}
        centered
        closable={true}
        bodyStyle={{ 
          padding: '40px',
          background: '#ffffff',
          borderRadius: THEME_CONSTANTS.radius.lg
        }}
        maskStyle={{
          backdropFilter: 'blur(8px)',
          background: 'rgba(0, 0, 0, 0.45)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 700, 
            color: THEME_CONSTANTS.colors.text,
            margin: 0,
            marginBottom: '8px'
          }}>
            📱 Message Preview
          </h3>
          <p style={{ 
            fontSize: '14px', 
            color: THEME_CONSTANTS.colors.textSecondary,
            margin: 0
          }}>
            How your message will appear on mobile
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          {renderTemplatePreview()}
        </div>
        <div style={{ textAlign: 'center' }}>
          <Button
            onClick={() => setShowPreviewModal(false)}
            style={{
              height: '44px',
              padding: '0 32px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: THEME_CONSTANTS.radius.md
            }}
          >
            Close Preview
          </Button>
        </div>
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