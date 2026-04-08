import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { restartCompletedCampaign } from '../../redux/slices/campaignSlice';
import {
  Card,
  Row,
  Col,
  Table,
  Select,
  Button,
  Input,
  Progress,
  Tag,
  Modal,
  Divider,
  Tooltip,
  Breadcrumb,
  Space,
  Empty,
  Grid,
  Statistic,
  DatePicker,
  Badge,
  Timeline,
} from 'antd';
import {
  DownloadOutlined,
  FilterOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
  EyeOutlined,
  HomeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  SendOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import toast from 'react-hot-toast';
import { _get, _post } from '../../helper/apiClient.jsx';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);


const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

const formatISTTime = (date) => {
  if (!date) return "-";
  // Parse as UTC and convert to IST
  const utcDate = new Date(date);
  return utcDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export default function AdminReports() {
  const { token } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const screens = useBreakpoint();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalSent: 0, totalDelivered: 0, totalFailed: 0, totalExpired: 0 });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [campaignMessages, setCampaignMessages] = useState([]);
  const [messagesPagination, setMessagesPagination] = useState({ total: 0 });
  const [loading, setLoading] = useState({ orders: false, messages: false, syncStats: false });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [showModal, setShowModal] = useState(false);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);


  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState([null, null]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [quickFilter, setQuickFilter] = useState('all');

  // Prevent browser auto-fill on mount
  useEffect(() => {
    const input = document.getElementById('campaign-search-field');
    if (input) {
      input.value = '';
      input.setAttribute('readonly', 'readonly');
      setTimeout(() => {
        input.removeAttribute('readonly');
      }, 500);
    }
    setSearchText('');
  }, []);

  const handleSearchChange = (value) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleTypeChange = (value) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    setCurrentPage(1);
  };

  const handleSortChange = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
    setCurrentPage(1);
  };

  const handleQuickFilter = (filter) => {
    setQuickFilter(filter);
    setCurrentPage(1);
    
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    switch (filter) {
      case 'today':
        setDateRange([dayjs(startOfToday), dayjs(endOfToday)]);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
        setDateRange([dayjs(startOfYesterday), dayjs(endOfYesterday)]);
        break;
      case 'thisMonth':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        setDateRange([dayjs(startOfMonth), dayjs(endOfMonth)]);
        break;
      case 'all':
      default:
        setDateRange([null, null]);
        break;
    }
  };

  const [modalSearchText, setModalSearchText] = useState('');
  const [modalStatusFilter, setModalStatusFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingCampaign, setIsExportingCampaign] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [restartPassword, setRestartPassword] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Restart completed campaign using Redux thunk
  const handleRestartCampaign = (campaignId) => {
    // Prevent any state changes that might trigger useEffect
    const input = document.getElementById('campaign-search-field');
    if (input && input.value && input.value.includes('@')) {
      input.value = '';
      setSearchText('');
    }
    
    setSelectedCampaignId(campaignId);
    setRestartPassword('');
    setShowPasswordModal(true);
  };

  // Handle password confirmation and restart
  const handlePasswordConfirmRestart = async () => {
    if (!restartPassword.trim()) {
      toast.error('Please enter password');
      return;
    }

    // Check password - CHANGE THIS TO YOUR DESIRED PASSWORD
    const RESTART_PASSWORD = 'admin@1234';
    
    if (restartPassword !== RESTART_PASSWORD) {
      toast.error('Incorrect password');
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await dispatch(restartCompletedCampaign({ id: selectedCampaignId })).unwrap();
      toast.success(result.message || 'Campaign restarted successfully');
      setShowPasswordModal(false);
      setRestartPassword('');
      setSelectedCampaignId(null);
      // Refresh the campaigns list
      await fetchOrders();
    } catch (error) {
      console.error('Restart campaign error:', error);
      toast.error(error.message || error || 'Failed to restart campaign');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Sync campaign stats function - only updates specific campaign row
  const handleSyncCampaignStats = async (campaignId) => {
    setLoading({ ...loading, syncStats: campaignId });
    try {
      // Sync stats for this specific campaign
      await _post(`v1/campaigns/${campaignId}/sync-stats`, {}, {}, token);
      
      // Refresh only the current page to get updated data for this campaign
      const params = { 
        page: currentPage, 
        limit: pageSize, 
        sort: sortOrder,
        _t: Date.now() // Cache buster
      };
      
      if (searchText && searchText.trim()) params.search = searchText.trim();
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const startDate = dateRange[0].startOf('day').utc().toISOString();
        const endDate = dateRange[1].endOf('day').utc().toISOString();
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const queryString = new URLSearchParams(params).toString();
      const res = await _get(`v1/admin/campaigns?${queryString}`, {}, {}, token);
      
      if (res.data.success) {
        setOrders(res.data.data || []);
        setPagination(res.data.pagination || { total: 0 });
      }
      
      toast.success('Campaign stats refreshed successfully');
    } catch (error) {
      console.error('Sync campaign stats error:', error);
      toast.error('Failed to refresh campaign stats');
    } finally {
      setLoading({ ...loading, syncStats: false });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // First sync all campaign stats to ensure fresh data
      console.log('Starting refresh - syncing all campaign stats...');
      
      // Get current campaigns to sync their stats
      const currentRes = await _get(`v1/admin/campaigns?page=${currentPage}&limit=${pageSize}`, {}, {}, token);
      if (currentRes.data.success && currentRes.data.data) {
        const syncPromises = currentRes.data.data.map(async (campaign) => {
          try {
            await _post(`v1/campaigns/${campaign._id}/sync-stats`, {}, {}, token);
            console.log(`Synced stats for campaign ${campaign._id}`);
          } catch (err) {
            console.error(`Failed to sync stats for campaign ${campaign._id}:`, err);
          }
        });
        
        await Promise.allSettled(syncPromises);
        console.log('All campaign stats synced, fetching fresh data...');
      }
      
      // Now fetch fresh data with cache buster
      const params = { 
        page: currentPage, 
        limit: pageSize, 
        sort: sortOrder,
        refresh: true, // Backend refresh flag
        _t: Date.now() // Cache buster
      };
      
      if (searchText && searchText.trim()) params.search = searchText.trim();
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const startDate = dateRange[0].startOf('day').utc().toISOString();
        const endDate = dateRange[1].endOf('day').utc().toISOString();
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const queryString = new URLSearchParams(params).toString();
      const res = await _get(`v1/admin/campaigns?${queryString}`, {}, {}, token);
      
      if (res.data.success) {
        console.log('Fresh data received:', res.data.data?.length, 'campaigns');
        setOrders(res.data.data || []);
        setPagination(res.data.pagination || { total: 0 });
        toast.success('Campaigns and stats refreshed successfully');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh campaigns');
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchOrders = async () => {
    // Skip if searchText contains @ (browser auto-fill)
    if (searchText && searchText.includes('@')) {
      const input = document.getElementById('campaign-search-field');
      if (input) input.value = '';
      setSearchText('');
      return;
    }
    
    setLoading({ ...loading, orders: true });
    try {
      const params = { page: currentPage, limit: pageSize, sort: sortOrder };
      if (searchText && searchText.trim()) params.search = searchText.trim();
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
      if (dateRange && dateRange[0] && dateRange[1]) {
        // Convert to UTC dates (start of day and end of day)
        const startDate = dateRange[0].startOf('day').utc().toISOString();
        const endDate = dateRange[1].endOf('day').utc().toISOString();
        params.startDate = startDate;
        params.endDate = endDate;
        console.log('Date range being sent:', startDate, 'to', endDate);
      }

      const queryString = new URLSearchParams(params).toString();
      const res = await _get(`v1/admin/campaigns?${queryString}`, {}, {}, token);
      
      if (res.data.success) {
        setOrders(res.data.data || []);
        setPagination(res.data.pagination || { total: 0 });
      }
    } catch (err) {
      console.error('Campaigns error:', err);
      toast.error('Failed to fetch campaigns');
    } finally {
      setLoading({ ...loading, orders: false });
    }
  };

  useEffect(() => {
    if (token) fetchOrders();
  }, [token, currentPage, searchText, statusFilter, typeFilter, sortOrder, dateRange]);

  const getUniqueTypes = () => {
    if (!Array.isArray(orders)) return [];
    const types = orders.map((order) => order.type).filter((type) => type && type !== 'null' && type !== null);
    return [...new Set(types)];
  };

  const getStatusBadge = (order) => {
    const status = order?.status;

    const statusConfig = {
      'completed': { color: '#f6ffed', textColor: THEME_CONSTANTS.colors.success, border: THEME_CONSTANTS.colors.success },
      'running': { color: '#e6f7ff', textColor: '#1890ff', border: '#1890ff' },
      'processing': { color: '#e6f7ff', textColor: '#1890ff', border: '#1890ff' },
      'pending': { color: '#fffbe6', textColor: '#faad14', border: '#faad14' },
      'settled': { color: '#e0f2fe', textColor: '#0284c7', border: '#0284c7' },
      'draft': { color: '#f5f5f5', textColor: '#8c8c8c', border: '#d9d9d9' },
      'paused': { color: '#fff7e6', textColor: '#fa8c16', border: '#fa8c16' },
      'failed': { color: '#fff1f0', textColor: '#ff4d4f', border: '#ff4d4f' },
    };

    const config = statusConfig[status] || { color: '#f5f5f5', textColor: '#8c8c8c', border: '#d9d9d9' };

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
        <Tag
          color={config.color}
          style={{
            color: config.textColor,
            border: `1px solid ${config.border}`,
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: THEME_CONSTANTS.radius.sm,
            fontSize: '11px',
            textTransform: 'capitalize'
          }}
        >
          {status || 'Unknown'}
        </Tag>
      </div>
    );
  };

  const viewOrderDetails = async (order) => {
    setSelectedOrder(order);
    setModalCurrentPage(1);
    setModalSearchText('');
    setModalStatusFilter('all');
    setShowModal(true);
    await fetchCampaignMessagesData(order._id, 1);
  };

  const fetchCampaignMessagesData = async (campaignId, page = 1) => {
    setLoading({ ...loading, messages: true });
    try {
      const params = { page, limit: 10 };
      if (modalSearchText) params.search = modalSearchText;
      if (modalStatusFilter !== 'all') params.status = modalStatusFilter;
      
      const queryString = new URLSearchParams(params).toString();
      const res = await _get(`v1/admin/campaigns/${campaignId}/messages?${queryString}`, {}, {}, token);
      
      if (res.data.success) {
        setCampaignMessages(res.data.data || []);
        setMessagesPagination(res.data.pagination || { total: 0 });
      }
    } catch (err) {
      console.error('Messages error:', err);
    } finally {
      setLoading({ ...loading, messages: false });
    }
  };

  useEffect(() => {
    if (!showModal || !selectedOrder?._id) return;
    const timer = setTimeout(() => {
      fetchCampaignMessagesData(selectedOrder._id, 1);
      setModalCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [modalSearchText, modalStatusFilter, showModal, selectedOrder?._id]);

  const handleModalPageChange = (page) => {
    setModalCurrentPage(page);
    if (selectedOrder?._id) {
      fetchCampaignMessagesData(selectedOrder._id, page);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalSearchText('');
    setModalStatusFilter('all');
    setSelectedOrder(null);
  };

  const exportCampaignDetails = async () => {
    if (isExportingCampaign || !selectedOrder?._id) return;
    
    let toastId;
    setIsExportingCampaign(true);
    
    try {
      toastId = toast.loading('Preparing export...');
      
      // Fetch all messages
      const res = await _get(`v1/admin/campaigns/${selectedOrder._id}/messages/all`, {}, {}, token);
      const allMessages = res.data.data || [];
      
      if (allMessages.length === 0) {
        toast.error('No messages to export', { id: toastId });
        return;
      }
      
      toast.loading(`Creating Excel file... (${allMessages.length.toLocaleString()} messages)`, { id: toastId });
      
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Campaign Messages');
      
      sheet.columns = [
        { header: 'S.No', key: 'sno', width: 8 },
        { header: 'Phone Number', key: 'phone', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Sent At', key: 'sentAt', width: 20 },
        { header: 'Delivered At', key: 'deliveredAt', width: 20 },
        { header: 'Read At', key: 'readAt', width: 20 },
        { header: 'User Response', key: 'userResponse', width: 30 },
        { header: 'Error', key: 'error', width: 30 }
      ];
      
      // Process rows in chunks to avoid memory issues
      const ROW_CHUNK_SIZE = 1000;
      for (let i = 0; i < allMessages.length; i += ROW_CHUNK_SIZE) {
        const chunk = allMessages.slice(i, i + ROW_CHUNK_SIZE);
        const rows = chunk.map((msg, idx) => ({
          sno: i + idx + 1,
          phone: msg.phoneNumber || 'N/A',
          status: msg.status?.toUpperCase() || 'N/A',
          sentAt: msg.sentAt ? new Date(msg.sentAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A',
          deliveredAt: msg.deliveredAt ? new Date(msg.deliveredAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A',
          readAt: msg.readAt ? new Date(msg.readAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A',
          userResponse: msg.userText || msg.clickedAction || 'N/A',
          error: msg.status === 'failed' ? (msg.errorMessage || msg.errorCode || 'Unknown') : 'N/A'
        }));
        
        sheet.addRows(rows);
        
        // Update progress
        const progress = Math.min(100, Math.round(((i + chunk.length) / allMessages.length) * 100));
        toast.loading(`Processing rows... ${progress}%`, { id: toastId });
      }
      
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      toast.loading('Generating file...', { id: toastId });
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-${selectedOrder?.CampaignName}-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported ${allMessages.length.toLocaleString()} messages successfully`, { id: toastId });
    } catch (error) {
      console.error('Export error:', error);
      if (toastId) {
        toast.error(error.message || 'Failed to export campaign details', { id: toastId });
      } else {
        toast.error('Failed to export campaign details');
      }
    } finally {
      setIsExportingCampaign(false);
    }
  };

  const filteredOrders = orders || [];
  const paginatedMessages = campaignMessages || [];

  const exportToExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const res = await _get('v1/admin/campaigns/export/all', {}, {}, token);
      const allCampaigns = res.data.data || [];
      if (allCampaigns.length === 0) {
        toast.error('No campaigns to export');
        return;
      }
      const campaignsData = allCampaigns.map((order, idx) => ({
        'S.No': idx + 1,
        'Campaign Name': order?.CampaignName || 'N/A',
        'User': order?.userId?.name || 'N/A',
        'Email': order?.userId?.email || 'N/A',
        'Type': order?.type || 'N/A',
        'Status': order?.status || 'N/A',
        'Recipients': order?.cost || 0,
        'RCS Capable': order?.rcsCapableCount || 0,
        'Sent': (order?.stats?.sent || order?.successCount || 0) + (order?.failedCount || order?.stats?.failed || 0),
        'Delivered': order?.totalDelivered || 0,
        'Failed': order?.failedCount || 0,
        'Expired': order?.expiredCount || 0,
        'Created': new Date(order.createdAt).toLocaleString(),
      }));
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('All Campaigns');
      
      const keys = Object.keys(campaignsData[0]);
      sheet.columns = keys.map(key => ({ header: key, key, width: 15 }));
      campaignsData.forEach(row => sheet.addRow(row));
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-campaigns-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Exported ${allCampaigns.length} campaigns successfully`);
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    {
      title: 'Campaign Name',
      dataIndex: 'CampaignName',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, fontSize: '13px', marginBottom: '3px' }}>
            {text || 'N/A'}
          </div>
          <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary }}>
            {record.userId?.name || 'Unknown User'}
          </div>
          <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textMuted, marginTop: '2px' }}>
            {record.userId?.email || 'No email'}
          </div>
        </div>
      ),
    },
    {
      title: 'Bot',
      dataIndex: 'botId',
      key: 'bot',
      render: (botId) => (
        <Tag
          style={{
            background: '#f0f5ff',
            color: THEME_CONSTANTS.colors.primary,
            border: `1px solid ${THEME_CONSTANTS.colors.primary}`,
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: THEME_CONSTANTS.radius.sm,
            fontSize: '12px'
          }}
        >
          {botId || 'N/A'}
        </Tag>
      ),
      width: 100,
      align: 'center',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Tag
            style={{
              background: type === 'SMS' ? '#e6f7ff' : '#f6f8fb',
              color: type === 'SMS' ? THEME_CONSTANTS.colors.primary : '#667085',
              border: 'none',
              fontWeight: 600,
              padding: '6px 0',
              borderRadius: THEME_CONSTANTS.radius.sm,
              fontSize: '13px',
              width: '90px',
              textAlign: 'center',
              display: 'inline-block'
            }}
          >
            {type}
          </Tag>
        </div>
      ),
      width: 120,
      align: 'center',
    },
    {
      title: 'Recipients',
      dataIndex: 'cost',
      key: 'recipients',
      render: (cost) => (
        <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, fontSize: '13px' }}>
          {cost || 0}
        </span>
      ),
      width: 100,
      align: 'center',
    },
    {
      title: 'RCS Capable',
      key: 'rcsCapable',
      render: (text, record) => {
        const rcsCount = record.rcsCapableCount || record.stats?.rcsCapable || 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <PhoneOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '16px' }} />
            <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.primary, fontSize: '15px' }}>
              {rcsCount}
            </span>
          </div>
        );
      },
      width: 130,
      align: 'center',
    },
    {
      title: 'Sent',
      key: 'sent',
      render: (text, record) => {
        // Show sum of sent + failed messages (same logic as Orders.jsx)
        const sentCount = (record?.stats?.sent || record?.successCount || 0) + (record?.failedCount || record?.stats?.failed || 0);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <SendOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
            <span style={{ fontWeight: 600, color: '#1890ff', fontSize: '15px' }}>
              {sentCount}
            </span>
          </div>
        );
      },
      width: 110,
      align: 'center',
    },
    {
      title: 'Delivered',
      key: 'delivered',
      render: (text, record) => {
        // Backend already sends correct totalDelivered for both settled and non-settled
        const totalDelivered = record?.totalDelivered || 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <CheckCircleOutlined style={{ color: THEME_CONSTANTS.colors.success, fontSize: '16px' }} />
            <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.success, fontSize: '15px' }}>
              {totalDelivered}
            </span>
          </div>
        );
      },
      width: 130,
      align: 'center',
    },
    {
      title: 'Failed',
      key: 'failed',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <CloseCircleOutlined style={{ color: THEME_CONSTANTS.colors.danger, fontSize: '16px' }} />
          <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.danger, fontSize: '15px' }}>
            {record?.failedCount || record?.stats?.failed || 0}
          </span>
        </div>
      ),
      width: 120,
      align: 'center',
    },
    {
      title: 'Expired',
      key: 'expired',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <ClockCircleOutlined style={{ color: '#faad14', fontSize: '16px' }} />
          <span style={{ fontWeight: 600, color: '#faad14', fontSize: '15px' }}>
            {record?.expiredCount || record?.stats?.expired || 0}
          </span>
        </div>
      ),
      width: 120,
      align: 'center',
    },
    {
      title: 'Success Rate',
      key: 'rate',
      render: (text, record) => {
        // Success Rate = (sent / rcsCapable) * 100 (using same logic as Orders.jsx)
        const sentCount = (record?.stats?.sent || record?.successCount || 0) + (record?.failedCount || record?.stats?.failed || 0);
        const rcsCapableCount = record.rcsCapableCount || 0;
        const rate = rcsCapableCount > 0 ? (sentCount / rcsCapableCount) * 100 : 0;
        const color = rate >= 80 ? THEME_CONSTANTS.colors.success : rate >= 50 ? '#fa8c16' : THEME_CONSTANTS.colors.danger;
        const displayRate = rate < 1 && rate > 0 ? rate.toFixed(2) : Math.round(rate);

        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: rate >= 80 ? '#f6ffed' : rate >= 50 ? '#fff7e6' : '#fff1f0',
              border: `3px solid ${color}`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                fontSize: rate < 1 ? '11px' : '13px',
                fontWeight: 700,
                color
              }}>
                {displayRate}%
              </span>
            </div>
          </div>
        );
      },
      width: 120,
      align: 'center',
    },
    {
      title: 'Status',
      key: 'status',
      render: (text, record) => getStatusBadge(record),
      width: 130,
      align: 'center',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => (
        <Tooltip title={new Date(date).toLocaleString()}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textPrimary, fontWeight: 600 }}>
              {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
            </div>
            <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '3px' }}>
              {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </Tooltip>
      ),
      width: 130,
      align: 'center',
    },
    // {
    //   title: 'Created / Updated',
    //   dataIndex: 'createdAt',
    //   key: 'date',
    //   render: (date, record) => {
    //     const lastUpdated = record.updatedAt || record.lastStatsUpdate || record.createdAt;
    //     const isRecentlyUpdated = lastUpdated && new Date(lastUpdated) > new Date(record.createdAt);
    //     
    //     return (
    //       <Tooltip title={`Created: ${new Date(date).toLocaleString()}${isRecentlyUpdated ? ` | Updated: ${new Date(lastUpdated).toLocaleString()}` : ''}`}>
    //         <div style={{ textAlign: 'center' }}>
    //           <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textPrimary, fontWeight: 600 }}>
    //             {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
    //           </div>
    //           <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '3px' }}>
    //             {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    //           </div>
    //           {isRecentlyUpdated && (
    //             <div style={{ fontSize: '10px', color: '#1890ff', marginTop: '2px', fontWeight: 600 }}>
    //               Updated {formatISTTime(lastUpdated)}
    //             </div>
    //           )}
    //         </div>
    //       </Tooltip>
    //     );
    //   },
    //   width: 140,
    //   align: 'center',
    // },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => {
        // Check if campaign is completed today - use createdAt
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let isCompletedToday = false;
        if (record.status === 'completed' && record.createdAt) {
          const createdDate = new Date(record.createdAt);
          createdDate.setHours(0, 0, 0, 0);
          isCompletedToday = createdDate.getTime() === today.getTime();
        }
        
        return (
          <Space size="small">
            {isCompletedToday && (
              <Tooltip title="Restart Campaign">
                <Button
                  type="default"
                  icon={<ReloadOutlined />}
                  onClick={() => handleRestartCampaign(record._id)}
                  size="middle"
                  style={{ padding: '4px 15px', color: '#fa8c16', borderColor: '#fa8c16' }}
                >
                  
                </Button>
              </Tooltip>
            )}
            <Tooltip title="View Details">
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={() => viewOrderDetails(record)}
                size="middle"
                style={{ padding: '4px 15px' }}
              />
            </Tooltip>
          </Space>
        );
      },
      width: 200,
      align: 'center',
      fixed: 'right',
    },
  ];

  return (
    <>
      <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh' }}>
        <div style={{
          maxWidth: THEME_CONSTANTS.layout.maxContentWidth,
          margin: '0 auto',
          padding: THEME_CONSTANTS.spacing.xl
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
                  Campaign Reports
                </span>
              </Breadcrumb.Item>
            </Breadcrumb>

            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col xs={24} lg={18}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: THEME_CONSTANTS.colors.primaryLight,
                    borderRadius: THEME_CONSTANTS.radius.xl,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: THEME_CONSTANTS.shadow.md,
                    flexShrink: 0
                  }}>
                    <BarChartOutlined style={{
                      color: THEME_CONSTANTS.colors.primary,
                      fontSize: '32px'
                    }} />
                  </div>
                  <div>
                    <h1 style={{
                      fontSize: THEME_CONSTANTS.typography.h1.size,
                      fontWeight: THEME_CONSTANTS.typography.h1.weight,
                      color: THEME_CONSTANTS.colors.text,
                      marginBottom: THEME_CONSTANTS.spacing.sm,
                      lineHeight: THEME_CONSTANTS.typography.h1.lineHeight,
                    }}>
                      All Campaign Reports
                    </h1>
                    <p style={{
                      color: THEME_CONSTANTS.colors.textSecondary,
                      fontSize: THEME_CONSTANTS.typography.body.size,
                      fontWeight: 500,
                      lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                      margin: 0
                    }}>
                      View and manage all campaigns from all users with detailed insights and performance metrics.
                    </p>
                  </div>
                </div>
              </Col>
              <Col xs={24} lg={6}>
                <div style={{ textAlign: screens.lg ? 'right' : 'left', display: 'flex', gap: '12px', justifyContent: screens.lg ? 'flex-end' : 'flex-start' }}>
                  {/* <Button
                    icon={<ReloadOutlined spin={isRefreshing} />}
                    onClick={handleRefresh}
                    loading={isRefreshing}
                    disabled={isRefreshing}
                    style={{
                      height: '44px',
                    }}
                  >
                    Refresh
                  </Button> */}
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={exportToExcel}
                    loading={isExporting}
                    disabled={isExporting}
                    style={{
                      background: THEME_CONSTANTS.colors.primary,
                      borderColor: THEME_CONSTANTS.colors.primary,
                      height: '44px',
                    }}
                  >
                    {isExporting ? 'Exporting...' : 'Export All'}
                  </Button>
                </div>
              </Col>
            </Row>
          </div>


          {/* Summary Stats with Real-time Data */}
          {pagination.total > 0 && (
            <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
              <Col xs={24} sm={12} md={6}>
                <Card
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.lg,
                    border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                    boxShadow: THEME_CONSTANTS.shadow.sm,
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <Statistic
                    title="Total Campaigns"
                    value={pagination.total || 0}
                    prefix={<BarChartOutlined style={{ marginRight: '8px', color: THEME_CONSTANTS.colors.primary }} />}
                    valueStyle={{ color: THEME_CONSTANTS.colors.primary, fontSize: '28px', fontWeight: 700 }}
                    titleStyle={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6} lg={4}>
                <Card
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.lg,
                    border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                    boxShadow: THEME_CONSTANTS.shadow.sm,
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <Statistic
                    title="Total Sent"
                    value={pagination.totalSent || 0}
                    prefix={<SendOutlined style={{ marginRight: '8px', color: THEME_CONSTANTS.colors.primary }} />}
                    valueStyle={{ color: THEME_CONSTANTS.colors.primary, fontSize: '28px', fontWeight: 700 }}
                    titleStyle={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6} lg={4}>
                <Card
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.lg,
                    border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                    boxShadow: THEME_CONSTANTS.shadow.sm,
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <Statistic
                    title="Total Delivered"
                    value={pagination.totalDelivered || 0}
                    prefix={<CheckCircleOutlined style={{ marginRight: '8px', color: THEME_CONSTANTS.colors.success }} />}
                    valueStyle={{ color: THEME_CONSTANTS.colors.success, fontSize: '28px', fontWeight: 700 }}
                    titleStyle={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6} lg={4}>
                <Card
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.lg,
                    border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                    boxShadow: THEME_CONSTANTS.shadow.sm,
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <Statistic
                    title="Total Failed"
                    value={pagination.totalFailed || 0}
                    prefix={<CloseCircleOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />}
                    valueStyle={{ color: '#ff4d4f', fontSize: '28px', fontWeight: 700 }}
                    titleStyle={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6} lg={4}>
                <Card
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.lg,
                    border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                    boxShadow: THEME_CONSTANTS.shadow.sm,
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <Statistic
                    title="Total Expired"
                    value={pagination.totalExpired || 0}
                    prefix={<ClockCircleOutlined style={{ marginRight: '8px', color: '#faad14' }} />}
                    valueStyle={{ color: '#faad14', fontSize: '28px', fontWeight: 700 }}
                    titleStyle={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* Professional Filter Section */}
          <Card
            style={{
              borderRadius: THEME_CONSTANTS.radius.xl,
              border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
              background: 'white',
              boxShadow: THEME_CONSTANTS.shadow.md,
              marginBottom: THEME_CONSTANTS.spacing.xxxl,
            }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{
              padding: '20px 28px',
              borderBottom: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  background: THEME_CONSTANTS.colors.primaryLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${THEME_CONSTANTS.colors.primary}30`
                }}>
                  <FilterOutlined style={{ fontSize: '18px', color: THEME_CONSTANTS.colors.primary }} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    color: THEME_CONSTANTS.colors.text,
                    margin: 0,
                    lineHeight: 1.2
                  }}>
                    Filter & Search
                  </h3>
                  <p style={{
                    fontSize: '12px',
                    color: THEME_CONSTANTS.colors.textSecondary,
                    margin: 0,
                    marginTop: '2px'
                  }}>
                    Refine your campaign results
                  </p>
                </div>
              </div>

              {(searchText || statusFilter !== 'all' || typeFilter !== 'all' || (dateRange && dateRange[0]) || quickFilter !== 'all') && (
                <Button
                  danger
                  type="primary"
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    setSearchText('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setDateRange([null, null]);
                    setQuickFilter('all');
                    toast.success('All filters cleared');
                  }}
                  style={{
                    height: '40px',
                    borderRadius: THEME_CONSTANTS.radius.md,
                    fontWeight: 600,
                    fontSize: '13px',
                    boxShadow: '0 2px 8px rgba(255, 77, 79, 0.2)'
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </div>

            <div style={{ padding: '28px' }}>
              {/* Quick Filter Buttons */}
              <Row gutter={[12, 16]} style={{ marginBottom: '24px' }}>
                <Col span={24}>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: THEME_CONSTANTS.colors.text,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Quick Filters
                    </label>
                  </div>
                  <Space size="small" wrap>
                    <Button
                      type={quickFilter === 'all' ? 'primary' : 'default'}
                      onClick={() => handleQuickFilter('all')}
                      style={{
                        borderRadius: THEME_CONSTANTS.radius.md,
                        fontWeight: 600,
                        fontSize: '13px'
                      }}
                    >
                      All Time
                    </Button>
                    <Button
                      type={quickFilter === 'today' ? 'primary' : 'default'}
                      onClick={() => handleQuickFilter('today')}
                      style={{
                        borderRadius: THEME_CONSTANTS.radius.md,
                        fontWeight: 600,
                        fontSize: '13px'
                      }}
                    >
                      Today
                    </Button>
                    <Button
                      type={quickFilter === 'yesterday' ? 'primary' : 'default'}
                      onClick={() => handleQuickFilter('yesterday')}
                      style={{
                        borderRadius: THEME_CONSTANTS.radius.md,
                        fontWeight: 600,
                        fontSize: '13px'
                      }}
                    >
                      Yesterday
                    </Button>
                    <Button
                      type={quickFilter === 'thisMonth' ? 'primary' : 'default'}
                      onClick={() => handleQuickFilter('thisMonth')}
                      style={{
                        borderRadius: THEME_CONSTANTS.radius.md,
                        fontWeight: 600,
                        fontSize: '13px'
                      }}
                    >
                      This Month
                    </Button>
                  </Space>
                </Col>
              </Row>

              <Row gutter={[16, 20]}>
                {/* Search Input */}
                <Col xs={24} md={12} lg={8}>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: THEME_CONSTANTS.colors.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      <SearchOutlined style={{ fontSize: '11px' }} />
                      Search
                    </label>
                  </div>
                  <Input
                    placeholder="Campaign name or ID..."
                    prefix={<SearchOutlined style={{ color: THEME_CONSTANTS.colors.textMuted, fontSize: '14px' }} />}
                    value={searchText}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    allowClear
                    autoComplete="new-password"
                    name="campaign-search-field"
                    id="campaign-search-field"
                    style={{
                      height: '42px',
                      borderRadius: THEME_CONSTANTS.radius.md,
                      border: `1.5px solid ${searchText ? THEME_CONSTANTS.colors.primary : THEME_CONSTANTS.colors.borderLight}`,
                      fontSize: '13px',
                      transition: 'all 0.3s ease',
                      boxShadow: searchText ? `0 0 0 3px ${THEME_CONSTANTS.colors.primary}15` : 'none'
                    }}
                  />
                </Col>

                {/* Status Filter */}
                <Col xs={24} sm={12} md={6} lg={4}>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: THEME_CONSTANTS.colors.text,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Status
                    </label>
                  </div>
                  <Select
                    value={statusFilter}
                    onChange={handleStatusChange}
                    style={{ width: '100%' }}
                    size="large"
                    options={[
                      { label: 'All', value: 'all' },
                      { label: 'Completed', value: 'completed' },
                      { label: 'Settled', value: 'settled' },
                      { label: 'Processing', value: 'processing' },
                      { label: 'Pending', value: 'pending' },
                    ]}
                  />
                </Col>

                {/* Type Filter */}
                <Col xs={24} sm={12} md={6} lg={4}>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: THEME_CONSTANTS.colors.text,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Type
                    </label>
                  </div>
                  <Select
                    value={typeFilter}
                    onChange={handleTypeChange}
                    style={{ width: '100%' }}
                    size="large"
                    options={[
                      { label: 'All', value: 'all' },
                      ...getUniqueTypes().map((type) => ({ label: type, value: type })),
                    ]}
                  />
                </Col>

                {/* Date Range */}
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: THEME_CONSTANTS.colors.text,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Date Range
                    </label>
                  </div>
                  <RangePicker
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: THEME_CONSTANTS.radius.md,
                      border: `1.5px solid ${(dateRange && dateRange[0]) ? THEME_CONSTANTS.colors.primary : THEME_CONSTANTS.colors.borderLight}`,
                      boxShadow: (dateRange && dateRange[0]) ? `0 0 0 3px ${THEME_CONSTANTS.colors.primary}15` : 'none'
                    }}
                    format="DD/MM/YYYY"
                    placeholder={['Start', 'End']}
                  />
                </Col>

                {/* Sort Button */}
                <Col xs={24} sm={12} md={4} lg={4}>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: THEME_CONSTANTS.colors.text,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Sort
                    </label>
                  </div>
                  <Button
                    icon={sortOrder === 'newest' ? <span style={{ fontSize: '14px' }}>↓</span> : <span style={{ fontSize: '14px' }}>↑</span>}
                    onClick={handleSortChange}
                    style={{
                      width: '100%',
                      height: '42px',
                      borderRadius: THEME_CONSTANTS.radius.md,
                      border: `1.5px solid ${THEME_CONSTANTS.colors.primary}`,
                      background: sortOrder === 'newest' ? THEME_CONSTANTS.colors.primary : 'white',
                      color: sortOrder === 'newest' ? 'white' : THEME_CONSTANTS.colors.primary,
                      fontWeight: 600,
                      fontSize: '13px',
                      transition: 'all 0.3s ease',
                      boxShadow: sortOrder === 'newest' ? `0 2px 8px ${THEME_CONSTANTS.colors.primary}30` : 'none'
                    }}
                  >
                    {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                  </Button>
                </Col>
              </Row>

              {/* Active Filters Summary */}
              {/* {(searchText || statusFilter !== 'all' || typeFilter !== 'all' || campaignFilter !== 'all' || (dateRange && dateRange[0])) && (
              <div style={{ 
                marginTop: '24px', 
                padding: '14px 18px',
                background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight} 0%, #ffffff 100%)`,
                borderRadius: THEME_CONSTANTS.radius.lg,
                border: `1.5px solid ${THEME_CONSTANTS.colors.primary}30`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    color: THEME_CONSTANTS.colors.primary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Active:
                  </span>
                  {searchText && (
                    <Tag 
                      closable 
                      onClose={() => setSearchText('')} 
                      color={THEME_CONSTANTS.colors.primary}
                      style={{ fontWeight: 600, fontSize: '12px', padding: '4px 10px' }}
                    >
                      🔍 {searchText}
                    </Tag>
                  )}
                  {statusFilter !== 'all' && (
                    <Tag 
                      closable 
                      onClose={() => setStatusFilter('all')} 
                      color="green"
                      style={{ fontWeight: 600, fontSize: '12px', padding: '4px 10px' }}
                    >
                      Status: {statusFilter}
                    </Tag>
                  )}
                  {typeFilter !== 'all' && (
                    <Tag 
                      closable 
                      onClose={() => setTypeFilter('all')} 
                      color="blue"
                      style={{ fontWeight: 600, fontSize: '12px', padding: '4px 10px' }}
                    >
                      Type: {typeFilter}
                    </Tag>
                  )}
                  {campaignFilter !== 'all' && (
                    <Tag 
                      closable 
                      onClose={() => setCampaignFilter('all')} 
                      color="purple"
                      style={{ fontWeight: 600, fontSize: '12px', padding: '4px 10px' }}
                    >
                      {campaignFilter}
                    </Tag>
                  )}
                  {dateRange && dateRange[0] && (
                    <Tag 
                      closable 
                      onClose={() => setDateRange([null, null])} 
                      color="orange"
                      style={{ fontWeight: 600, fontSize: '12px', padding: '4px 10px' }}
                    >
                      📅 {dateRange[0].format('DD/MM/YY')} - {dateRange[1].format('DD/MM/YY')}
                    </Tag>
                  )}
                </div>
              </div>
            )} */}
            </div>
          </Card>

          {/* Campaign Table */}
          <Card
            style={{
              borderRadius: THEME_CONSTANTS.radius.lg,
              border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
              background: 'white',
              boxShadow: THEME_CONSTANTS.shadow.sm,
            }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ padding: '20px 24px 16px 24px', borderBottom: `1px solid ${THEME_CONSTANTS.colors.borderLight}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: THEME_CONSTANTS.colors.text, margin: 0, marginBottom: '2px' }}>
                    Campaign Overview
                  </h3>
                  <p style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>
                    {filteredOrders.length} of {orders?.length || 0} campaigns
                  </p>
                </div>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchOrders()}
                  loading={loading.orders}
                  style={{ height: '40px' }}
                >
                  Refresh
                </Button>
              </div>
            </div>
            {loading.orders ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '60px 20px',
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    borderTop: `4px solid ${THEME_CONSTANTS.colors.primary}`,
                    borderRight: `4px solid transparent`,
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <div
                  style={{
                    marginTop: '16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: THEME_CONSTANTS.colors.textSecondary,
                  }}
                >
                  Loading campaigns...
                </div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <Empty
                description="No campaigns match your filters"
                style={{ padding: '60px 20px' }}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <>
                <Table
                  columns={columns}
                  dataSource={filteredOrders}
                  rowKey={(record) => record._id}
                  pagination={{
                    current: currentPage,
                    pageSize: 10,
                    total: pagination?.total || filteredOrders.length,
                    onChange: (page) => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    },
                    showSizeChanger: false,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                    style: { padding: '16px 24px' },
                  }}
                  size="middle"
                />
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Professional Campaign Details Modal */}
      <Modal
        title={null}
        open={showModal}
        onCancel={closeModal}
        width={1400}
        footer={null}
        bodyStyle={{ padding: 0 }}
        style={{ top: 20 }}
      >
        {selectedOrder && (
          <div style={{ background: THEME_CONSTANTS.colors.background }}>
            {/* Professional Horizontal Header */}
            <div style={{
              background: THEME_CONSTANTS.colors.surface,
              padding: THEME_CONSTANTS.spacing.xxl,
              borderBottom: `2px solid ${THEME_CONSTANTS.colors.border}`,
              borderRadius: `${THEME_CONSTANTS.radius.lg} ${THEME_CONSTANTS.radius.lg} 0 0`
            }}>
              <Row align="middle" justify="space-between" gutter={[24, 16]}>
                <Col flex="auto">
                  <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.lg }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      background: THEME_CONSTANTS.colors.primaryLight,
                      borderRadius: THEME_CONSTANTS.radius.lg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${THEME_CONSTANTS.colors.border}`,
                      flexShrink: 0
                    }}>
                      <BarChartOutlined style={{ fontSize: '28px', color: THEME_CONSTANTS.colors.primary }} />
                    </div>
                    <div>
                      <h2 style={{
                        color: THEME_CONSTANTS.colors.text,
                        margin: 0,
                        fontSize: THEME_CONSTANTS.typography.h3.size,
                        fontWeight: THEME_CONSTANTS.typography.h3.weight,
                        marginBottom: THEME_CONSTANTS.spacing.xs,
                        lineHeight: 1.2
                      }}>
                        {selectedOrder?.CampaignName}
                      </h2>
                      <p style={{
                        color: THEME_CONSTANTS.colors.textSecondary,
                        fontSize: THEME_CONSTANTS.typography.bodySmall.size,
                        margin: 0
                      }}>
                        Campaign Analytics Dashboard
                      </p>
                    </div>
                  </div>
                </Col>
                <Col>
                  <Space size="middle">
                    <Tag style={{
                      background: THEME_CONSTANTS.colors.primaryLight,
                      color: THEME_CONSTANTS.colors.primary,
                      border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                      fontWeight: 600,
                      padding: '8px 16px',
                      fontSize: THEME_CONSTANTS.typography.body.size,
                      borderRadius: THEME_CONSTANTS.radius.md
                    }}>
                      {selectedOrder?.type}
                    </Tag>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={exportCampaignDetails}
                      loading={isExportingCampaign}
                      disabled={isExportingCampaign}
                      style={{
                        background: THEME_CONSTANTS.colors.primary,
                        borderColor: THEME_CONSTANTS.colors.primary,
                        fontWeight: 600,
                        height: '44px',
                        padding: '0 24px',
                        borderRadius: THEME_CONSTANTS.radius.md
                      }}
                    >
                      {isExportingCampaign ? 'Exporting...' : 'Export Messages'}
                    </Button>
                  </Space>
                </Col>
              </Row>
            </div>

            {/* Professional Horizontal Stats Cards */}
            <div style={{ padding: '28px 32px', background: THEME_CONSTANTS.colors.surface, borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8} lg={4}>
                  <Card style={{
                    borderRadius: THEME_CONSTANTS.radius.lg,
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    boxShadow: THEME_CONSTANTS.shadow.sm,
                    background: THEME_CONSTANTS.colors.surface
                  }} bodyStyle={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: THEME_CONSTANTS.colors.primaryLight,
                        borderRadius: THEME_CONSTANTS.radius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{ fontSize: '20px' }}>📊</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.text, lineHeight: 1, marginBottom: '4px' }}>
                          {messagesPagination?.total || selectedOrder?.cost || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600 }}>Total Recipients</div>
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                  <Card style={{
                    borderRadius: THEME_CONSTANTS.radius.lg,
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    boxShadow: THEME_CONSTANTS.shadow.sm,
                    background: THEME_CONSTANTS.colors.surface
                  }} bodyStyle={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: '#e6f7ff',
                        borderRadius: THEME_CONSTANTS.radius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <SendOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.text, lineHeight: 1, marginBottom: '4px' }}>
                          {(selectedOrder?.stats?.sent || selectedOrder?.successCount || 0) + (selectedOrder?.failedCount || selectedOrder?.stats?.failed || 0)}
                        </div>
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600 }}>Sent</div>
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                  <Card style={{
                    borderRadius: THEME_CONSTANTS.radius.lg,
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    boxShadow: THEME_CONSTANTS.shadow.sm,
                    background: THEME_CONSTANTS.colors.surface
                  }} bodyStyle={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: THEME_CONSTANTS.colors.successLight,
                        borderRadius: THEME_CONSTANTS.radius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <CheckCircleOutlined style={{ fontSize: '20px', color: THEME_CONSTANTS.colors.success }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.text, lineHeight: 1, marginBottom: '4px' }}>
                          {selectedOrder?.totalDelivered || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600 }}>Delivered</div>
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                  <Card style={{
                    borderRadius: THEME_CONSTANTS.radius.lg,
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    boxShadow: THEME_CONSTANTS.shadow.sm,
                    background: THEME_CONSTANTS.colors.surface
                  }} bodyStyle={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: '#ede9fe',
                        borderRadius: THEME_CONSTANTS.radius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <EyeOutlined style={{ fontSize: '20px', color: '#8b5cf6' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.text, lineHeight: 1, marginBottom: '4px' }}>
                          {selectedOrder?.totalRead || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600 }}>Read</div>
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                  <Card style={{
                    borderRadius: THEME_CONSTANTS.radius.lg,
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    boxShadow: THEME_CONSTANTS.shadow.sm,
                    background: THEME_CONSTANTS.colors.surface
                  }} bodyStyle={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: THEME_CONSTANTS.colors.dangerLight,
                        borderRadius: THEME_CONSTANTS.radius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <CloseCircleOutlined style={{ fontSize: '20px', color: THEME_CONSTANTS.colors.danger }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.text, lineHeight: 1, marginBottom: '4px' }}>
                          {selectedOrder?.failedCount || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600 }}>Failed</div>
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                  <Card style={{
                    borderRadius: THEME_CONSTANTS.radius.lg,
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    boxShadow: THEME_CONSTANTS.shadow.sm,
                    background: THEME_CONSTANTS.colors.surface
                  }} bodyStyle={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: THEME_CONSTANTS.colors.warningLight,
                        borderRadius: THEME_CONSTANTS.radius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <MessageOutlined style={{ fontSize: '20px', color: THEME_CONSTANTS.colors.warning }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.text, lineHeight: 1, marginBottom: '4px' }}>
                          {selectedOrder?.userClickCount || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600 }}>Interactions</div>
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={4}>
                  <Card style={{
                    borderRadius: THEME_CONSTANTS.radius.lg,
                    border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                    boxShadow: THEME_CONSTANTS.shadow.sm,
                    background: THEME_CONSTANTS.colors.surface
                  }} bodyStyle={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: '#fff2f0',
                        borderRadius: THEME_CONSTANTS.radius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <ClockCircleOutlined style={{ fontSize: '20px', color: '#ff4d4f' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.text, lineHeight: 1, marginBottom: '4px' }}>
                          {selectedOrder?.expiredCount || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600 }}>Expired</div>
                      </div>
                    </div>
                  </Card>
                </Col>
                {selectedOrder?.status === 'settled' && (
                  <Col xs={24} sm={12} md={8} lg={4}>
                    <Card style={{
                      borderRadius: THEME_CONSTANTS.radius.lg,
                      border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                      boxShadow: THEME_CONSTANTS.shadow.sm,
                      background: THEME_CONSTANTS.colors.surface
                    }} bodyStyle={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          background: '#e0f2fe',
                          borderRadius: THEME_CONSTANTS.radius.md,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <span style={{ fontSize: '20px' }}>💳</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.text, lineHeight: 1, marginBottom: '4px' }}>
                            {selectedOrder?.actualCost ?? selectedOrder?.estimatedCost ?? 0}
                          </div>
                          <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600 }}>Credits Used</div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                )}
                {(selectedOrder?.status === 'completed' || selectedOrder?.status === 'settled') && selectedOrder?.completedAt && (
                  <Col xs={24} sm={12} md={8} lg={4}>
                    <Card style={{
                      borderRadius: THEME_CONSTANTS.radius.lg,
                      border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                      boxShadow: THEME_CONSTANTS.shadow.sm,
                      background: THEME_CONSTANTS.colors.surface
                    }} bodyStyle={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          background: '#f0f9ff',
                          borderRadius: THEME_CONSTANTS.radius.md,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <CheckCircleOutlined style={{ fontSize: '20px', color: '#0ea5e9' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.text, lineHeight: 1, marginBottom: '3px' }}>
                            {new Date(selectedOrder.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </div>
                          <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '3px' }}>
                            {new Date(selectedOrder.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600, marginTop: '2px' }}>Completed At</div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                )}
              </Row>
            </div>

            {/* Messages Table with Filters Inside */}
            <div style={{ padding: '24px 32px', background: THEME_CONSTANTS.colors.background }}>
              <Card
                style={{
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                  boxShadow: THEME_CONSTANTS.shadow.md
                }}
                bodyStyle={{ padding: 0 }}
              >
                {/* Table Header with Filters */}
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`, background: 'white' }}>
                  <Row gutter={[16, 16]} align="middle" justify="space-between">
                    <Col xs={24} md={10}>
                      <Input
                        placeholder="Search by phone number..."
                        prefix={<SearchOutlined style={{ color: THEME_CONSTANTS.colors.textMuted }} />}
                        value={modalSearchText}
                        onChange={(e) => setModalSearchText(e.target.value)}
                        allowClear
                        style={{ height: '40px', fontSize: '14px' }}
                      />
                    </Col>
                    <Col xs={24} md={6}>
                      <Select
                        value={modalStatusFilter}
                        onChange={setModalStatusFilter}
                        style={{ width: '100%' }}
                        size="large"
                        options={[
                          { label: 'All Status', value: 'all' },
                          { label: 'Pending', value: 'pending' },
                          { label: 'Sent', value: 'sent' },
                          { label: 'Delivered', value: 'delivered' },
                          { label: 'Read', value: 'read' },
                          { label: 'Replied', value: 'replied' },
                          { label: 'Failed', value: 'failed' },
                          { label: 'Expired', value: 'expired' },
                        ]}
                      />
                    </Col>
                    <Col xs={24} md={8}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}>
                            {messagesPagination?.total || 0} total messages
                          </span>
                        </div>
                        <Button
                          onClick={() => {
                            setModalSearchText('');
                            setModalStatusFilter('all');
                            setModalCurrentPage(1);
                            if (selectedOrder?._id) {
                              fetchCampaignMessagesData(selectedOrder._id, 1);
                            }
                          }}
                          style={{ height: '40px' }}
                          disabled={!modalSearchText && modalStatusFilter === 'all'}
                        >
                          Clear Filters
                        </Button>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={() => {
                            if (selectedOrder?._id) {
                              fetchCampaignMessagesData(selectedOrder._id, modalCurrentPage);
                            }
                          }}
                          loading={loading.messages}
                          style={{ height: '40px' }}
                        >
                          Refresh
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Table */}
                <Table
                  dataSource={campaignMessages}
                  rowKey={(record) => `msg-${record._id}-${record.phoneNumber}`}
                  loading={loading.messages}
                  pagination={{
                    current: modalCurrentPage,
                    pageSize: 10,
                    total: messagesPagination?.total || 0,
                    onChange: handleModalPageChange,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                    size: 'default',
                    showSizeChanger: false,
                    style: { padding: '16px 24px' }
                  }}
                  scroll={{ x: 1200, y: 450 }}
                  size="middle"
                  bordered
                  columns={[
                    {
                      title: 'Phone Number',
                      dataIndex: 'phoneNumber',
                      key: 'phone',
                      width: 140,
                      fixed: 'left',
                      render: (phone) => (
                        <span style={{ fontWeight: 600, fontSize: '14px', color: THEME_CONSTANTS.colors.text }}>{phone}</span>
                      )
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      width: 110,
                      render: (status) => {
                        const statusColors = {
                          pending: { color: '#faad14', bg: '#fffbe6' },
                          sent: { color: THEME_CONSTANTS.colors.primary, bg: '#e6f7ff' },
                          delivered: { color: THEME_CONSTANTS.colors.success, bg: '#f6ffed' },
                          read: { color: '#8b5cf6', bg: '#f3e8ff' },
                          replied: { color: '#10b981', bg: '#d1fae5' },
                          failed: { color: THEME_CONSTANTS.colors.danger, bg: '#fff1f0' },
                          expired: { color: '#f59e0b', bg: '#fef3c7' },
                          queued: { color: '#6366f1', bg: '#eef2ff' }
                        };
                        const config = statusColors[status] || { color: '#6b7280', bg: '#f3f4f6' };
                        return (
                          <Tag style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '4px 10px',
                            color: config.color,
                            background: config.bg,
                            border: `1px solid ${config.color}30`
                          }}>
                            {status?.toUpperCase()}
                          </Tag>
                        );
                      }
                    },
                    // {
                    //   title: 'Type',
                    //   dataIndex: 'templateType',
                    //   key: 'type',
                    //   width: 100,
                    //   render: (type) => (
                    //     <Tag style={{ fontSize: '12px', background: THEME_CONSTANTS.colors.primaryLight, color: THEME_CONSTANTS.colors.primary, border: 'none', fontWeight: 600 }}>
                    //       {type}
                    //     </Tag>
                    //   )
                    // },
                    {
                      title: 'Sent At',
                      dataIndex: 'sentAt',
                      key: 'sent',
                      width: 100,
                      render: (date) => date ? (
                        <span style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.text }}>
                          {formatISTTime(date)}
                        </span>
                      ) : <span style={{ color: THEME_CONSTANTS.colors.textMuted }}>-</span>
                    },
                    {
                      title: 'Delivered At',
                      dataIndex: 'deliveredAt',
                      key: 'delivered',
                      width: 110,
                      render: (date) => date ? (
                        <span style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.success, fontWeight: 600 }}>
                          {formatISTTime(date)}
                        </span>
                      ) : <span style={{ color: THEME_CONSTANTS.colors.textMuted }}>-</span>
                    },
                    {
                      title: 'Read At',
                      dataIndex: 'readAt',
                      key: 'read',
                      width: 100,
                      render: (date) => date ? (
                        <span style={{ fontSize: '13px', color: '#8b5cf6', fontWeight: 600 }}>
                          {formatISTTime(date)}
                        </span>
                      ) : <span style={{ color: THEME_CONSTANTS.colors.textMuted }}>-</span>
                    },
                    {
                      title: 'Engagement',
                      key: 'engagement',
                      width: 120,
                      render: (_, record) => (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {record.interactions > 0 && (
                            <Tag color="cyan" style={{ fontSize: '11px', margin: 0, fontWeight: 600 }}>
                              🖱️ {record.interactions}
                            </Tag>
                          )}
                          {record.replies > 0 && (
                            <Tag color="purple" style={{ fontSize: '11px', margin: 0, fontWeight: 600 }}>
                              💬 {record.replies}
                            </Tag>
                          )}
                          {!record.interactions && !record.replies && <span style={{ color: THEME_CONSTANTS.colors.textMuted }}>-</span>}
                        </div>
                      )
                    },
                    {
                      title: 'User Response',
                      key: 'response',
                      width: 200,
                      render: (_, record) => {
                        const response = record.userText || record.clickedAction || record.suggestionResponse?.plainText;
                        return response ? (
                          <Tooltip title={response}>
                            <div style={{
                              fontSize: '13px',
                              color: THEME_CONSTANTS.colors.text,
                              maxWidth: '180px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {response}
                            </div>
                          </Tooltip>
                        ) : <span style={{ color: THEME_CONSTANTS.colors.textMuted }}>-</span>;
                      }
                    },
                    {
                      title: 'Error Details',
                      key: 'error',
                      width: 180,
                      render: (_, record) => {
                        if (record.status === 'failed') {
                          const error = record.errorMessage || record.errorCode || 'Unknown error';
                          return (
                            <Tooltip title={error}>
                              <Tag color="red" style={{ fontSize: '11px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                                ⚠️ {error}
                              </Tag>
                            </Tooltip>
                          );
                        }
                        return <span style={{ color: THEME_CONSTANTS.colors.textMuted }}>-</span>;
                      }
                    }
                  ]}
                />
              </Card>
            </div>
          </div>
        )}
      </Modal>

      {/* Password Confirmation Modal for Restart */}
      <Modal
        title="Confirm Campaign Restart"
        open={showPasswordModal}
        onCancel={() => {
          setShowPasswordModal(false);
          setRestartPassword('');
          setSelectedCampaignId(null);
        }}
        onOk={handlePasswordConfirmRestart}
        okText="Restart Campaign"
        cancelText="Cancel"
        confirmLoading={passwordLoading}
        okButtonProps={{
          danger: true,
          disabled: !restartPassword.trim()
        }}
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ marginBottom: '16px', fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary }}>
            This action will restart the campaign. Please enter the password to confirm.
          </p>
          <Input.Password
            placeholder="Enter password"
            value={restartPassword}
            onChange={(e) => setRestartPassword(e.target.value)}
            onPressEnter={handlePasswordConfirmRestart}
            size="large"
            autoFocus
          />
        </div>
      </Modal>
    </>
  );
}
