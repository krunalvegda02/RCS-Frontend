import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { useAuth } from '../../context/AuthContext';
import {
  fetchOrders,
  setSelectedOrder,
  clearSelectedOrder,
  addLiveEvent,
  updateRealTimeStats,
  setSocketConnected,
  updateCampaignFromSocket,
  fetchCampaignMessages,
  deleteOrder,
  fetchAllCampaignMessages,
  fetchAllCampaigns
} from '../../redux/slices/ordersSlice';
import * as XLSX from 'xlsx';
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

export default function Orders() {
  const { user, token } = useAuth();
  const dispatch = useDispatch();
  const screens = useBreakpoint();

  // Redux state
  const {
    orders,
    pagination,
    selectedOrder,
    campaignMessages,
    messagesPagination,
    realTimeStats,
    liveEvents,
    socketConnected,
    loading,
    error
  } = useSelector(state => state.orders);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [showModal, setShowModal] = useState(false);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);


  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [dateRange, setDateRange] = useState([null, null]);
  const [sortOrder, setSortOrder] = useState('newest');

  // Reset to page 1 when filters change
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

  const handleCampaignChange = (value) => {
    setCampaignFilter(value);
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

  const [modalSearchText, setModalSearchText] = useState('');
  const [modalStatusFilter, setModalStatusFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingCampaign, setIsExportingCampaign] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allCampaignsForFilters, setAllCampaignsForFilters] = useState([]);

  // Manual refresh handler
  const handleRefresh = async () => {
    if (user?._id) {
      setIsRefreshing(true);
      try {
        await dispatch(fetchOrders({ userId: user._id, page: currentPage, limit: pageSize })).unwrap();
        toast.success('Campaigns refreshed successfully');
      } catch (error) {
        toast.error('Failed to refresh campaigns');
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Fetch orders with filters whenever filters or page changes
  useEffect(() => {
    if (!user?._id) return;

    const params = {
      userId: user._id,
      page: currentPage,
      limit: pageSize,
      sort: sortOrder
    };

    if (searchText && searchText.trim()) params.search = searchText.trim();
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
    if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
    if (campaignFilter && campaignFilter !== 'all') params.campaign = campaignFilter;
    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].toISOString();
      params.endDate = dateRange[1].toISOString();
    }

    console.log('Fetching orders with params:', params);
    dispatch(fetchOrders(params)).unwrap().then(result => {
      console.log('Pagination data:', result.pagination);
    });
  }, [dispatch, user?._id, currentPage, searchText, statusFilter, typeFilter, campaignFilter, sortOrder, dateRange]);

  // Fetch all campaigns once for filter dropdowns
  useEffect(() => {
    if (user?._id && allCampaignsForFilters.length === 0) {
      dispatch(fetchAllCampaigns(user._id)).unwrap()
        .then(result => setAllCampaignsForFilters(result.data || []));
    }
  }, [user?._id, dispatch]);

  const fetchAllCampaignStats = async () => {
    for (const order of orders) {
      if (order._id) {
        dispatch(fetchRealTimeCampaignStats({ campaignId: order._id }));
      }
    }
  };

  const getUniqueTypes = () => {
    if (!Array.isArray(allCampaignsForFilters)) return [];
    const types = allCampaignsForFilters
      .map((order) => order.type)
      .filter((type) => type && type !== 'null' && type !== null);
    return [...new Set(types)];
  };

  const getUniqueCampaigns = () => {
    if (!Array.isArray(allCampaignsForFilters)) return [];
    const campaigns = allCampaignsForFilters
      .map((order) => order.CampaignName)
      .filter((name) => name && name !== 'null' && name !== null);
    return [...new Set(campaigns)];
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

  const modalOrder = selectedOrder;

  const viewOrderDetails = async (order) => {
    dispatch(setSelectedOrder(order));
    setModalCurrentPage(1);
    setModalSearchText('');
    setModalStatusFilter('all');
    setShowModal(true);

    // Fetch first page of messages
    if (order._id) {
      dispatch(fetchCampaignMessages({ campaignId: order._id, page: 1, limit: 10 }));
    }
  };

  // Debounced fetch effect for Search and Filter
  useEffect(() => {
    if (!showModal || !selectedOrder?._id) return;

    const timer = setTimeout(() => {
      dispatch(fetchCampaignMessages({
        campaignId: selectedOrder._id,
        page: 1,
        limit: 10,
        search: modalSearchText || undefined,
        status: modalStatusFilter !== 'all' ? modalStatusFilter : undefined
      }));
      setModalCurrentPage(1);
    }, 400); // Slightly faster debounce

    return () => clearTimeout(timer);
  }, [modalSearchText, modalStatusFilter, showModal, selectedOrder?._id]);

  const handleModalSearch = (searchValue) => {
    setModalSearchText(searchValue);
  };

  const handleModalStatusFilter = (status) => {
    setModalStatusFilter(status);
  };

  const handleModalPageChange = (page) => {
    setModalCurrentPage(page);
    if (selectedOrder?._id) {
      const params = { campaignId: selectedOrder._id, page, limit: 10 };
      if (modalSearchText) params.search = modalSearchText;
      if (modalStatusFilter !== 'all') params.status = modalStatusFilter;
      dispatch(fetchCampaignMessages(params));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalSearchText('');
    setModalStatusFilter('all');
    dispatch(clearSelectedOrder());
  };

  const exportCampaignDetails = async () => {
    if (isExportingCampaign) return;

    let toastInterval;
    try {
      if (!selectedOrder?._id) {
        toast.error('No campaign selected');
        return;
      }

      setIsExportingCampaign(true);

      // Start dismissing toasts immediately
      toastInterval = setInterval(() => {
        toast.dismiss();
      }, 10);

      await new Promise(resolve => setTimeout(resolve, 50));

      const result = await dispatch(fetchAllCampaignMessages(selectedOrder._id)).unwrap();
      const allMessages = result.data || [];

      if (allMessages.length === 0) {
        if (toastInterval) clearInterval(toastInterval);
        await new Promise(resolve => setTimeout(resolve, 100));
        toast.dismiss();
        toast.error('No messages to export');
        return;
      }

      const exportData = allMessages.map((msg, idx) => ({
        'S.No': idx + 1,
        'Phone Number': msg.phoneNumber || 'N/A',
        'Status': msg.status?.toUpperCase() || 'N/A',
        'Template Type': msg.templateType || 'N/A',
        'Sent At': msg.sentAt ? new Date(msg.sentAt).toLocaleString() : 'N/A',
        'Delivered At': msg.deliveredAt ? new Date(msg.deliveredAt).toLocaleString() : 'N/A',
        'Read At': msg.readAt ? new Date(msg.readAt).toLocaleString() : 'N/A',
        'Interactions': msg.interactions || 0,
        'Replies': msg.replies || 0,
        'User Response': msg.userText || msg.clickedAction || msg.suggestionResponse?.plainText || 'N/A',
        'Error': msg.status === 'failed' ? (msg.errorMessage || msg.errorCode || 'Unknown') : 'N/A',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [
        { wch: 8 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
        { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
        { wch: 10 }, { wch: 30 }, { wch: 30 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Campaign Messages');

      // Stop dismissing toasts before file write
      if (toastInterval) clearInterval(toastInterval);
      await new Promise(resolve => setTimeout(resolve, 150));
      toast.dismiss();

      XLSX.writeFile(workbook, `campaign-${selectedOrder?.CampaignName}-${new Date().toISOString().split('T')[0]}.xlsx`);

      // Show success toast after file download
      await new Promise(resolve => setTimeout(resolve, 200));
      toast.success(`Exported ${exportData.length} messages successfully`);
    } catch (error) {
      console.error('Export error:', error);
      if (toastInterval) clearInterval(toastInterval);
      await new Promise(resolve => setTimeout(resolve, 150));
      toast.dismiss();
      toast.error(error.message || 'Failed to export campaign details');
    } finally {
      if (toastInterval) clearInterval(toastInterval);
      setIsExportingCampaign(false);
    }
  };

  // Use orders directly from backend (already filtered and sorted)
  const filteredOrders = orders || [];

  // Use messages from Redux (already paginated by backend)
  const paginatedMessages = campaignMessages || [];

  const deleteOrderHandler = async (orderId) => {
    Modal.confirm({
      title: 'Delete Campaign Report',
      content: 'Are you sure you want to delete this campaign report? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await dispatch(deleteOrder(orderId)).unwrap();
          toast.success('Campaign report deleted successfully');
        } catch (err) {
          console.error('Error deleting order:', err);
          toast.error('Failed to delete campaign report');
        }
      },
    });
  };

  const exportToExcel = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);

      // Use orders from Redux state which already has rcsCapableCount
      const allCampaigns = orders || [];

      if (allCampaigns.length === 0) {
        toast.error('No campaigns to export');
        return;
      }

      const campaignsData = allCampaigns.map((order, idx) => {
        // Backend already sends correct totalDelivered
        const totalDelivered = order?.totalDelivered || 0;
        const failed = order?.failedCount || 0;
        const sentCount = totalDelivered + failed;
        const expired = order?.expiredCount || 0;
        const rcsCapableCount = order?.rcsCapableCount || 0;
        const totalRecipients = order?.cost || 0;
        const successRate = rcsCapableCount > 0 ? ((totalDelivered / rcsCapableCount) * 100).toFixed(2) : 0;

        return {
          'S.No': idx + 1,
          'Campaign ID': order?._id || 'N/A',
          'Campaign Name': order?.CampaignName || 'N/A',
          'Message Type': order?.type || 'N/A',
          'Status': order?.status || 'N/A',
          'Total Recipients': totalRecipients,
          'RCS Capable': rcsCapableCount,
          'Sent': sentCount,
          'Delivered': totalDelivered,
          'Failed': failed,
          'Expired': expired,
          'Success Rate (%)': successRate,
          'Created Date': new Date(order.createdAt).toLocaleDateString(),
          'Created Time': new Date(order.createdAt).toLocaleTimeString(),
        };
      });

      const workbook = XLSX.utils.book_new();
      const campaignsSheet = XLSX.utils.json_to_sheet(campaignsData);
      campaignsSheet['!cols'] = [
        { wch: 8 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 12 },
        { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 10 },
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(workbook, campaignsSheet, 'Campaigns Report');

      XLSX.writeFile(workbook, `campaigns-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`Exported ${allCampaigns.length} campaigns successfully`);
    } catch (error) {
      console.error('Export error:', error);
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
            ID: {record._id.slice(-8)}
          </div>
        </div>
      ),
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
        // Sent = totalDelivered + failed
        const totalDelivered = record?.totalDelivered || 0;
        const failed = record?.failedCount || 0;
        const sentCount = totalDelivered + failed;
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
        // Backend already sends correct totalDelivered
        const totalDelivered = record?.totalDelivered || 0;
        const rcsCapableCount = record.rcsCapableCount || 0;
        const rate = rcsCapableCount > 0 ? (totalDelivered / rcsCapableCount) * 100 : 0;
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
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => viewOrderDetails(record)}
              size="middle"
              style={{ padding: '4px 15px' }}
            />
          </Tooltip>
          {/* <Tooltip title="Delete">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => deleteOrderHandler(record._id)}
              size="middle"
              style={{ padding: '4px 15px' }}
            />
          </Tooltip> */}
        </Space>
      ),
      width: 140,
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
                      Campaign Reports
                    </h1>
                    <p style={{
                      color: THEME_CONSTANTS.colors.textSecondary,
                      fontSize: THEME_CONSTANTS.typography.body.size,
                      fontWeight: 500,
                      lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                      margin: 0
                    }}>
                      Manage and track all your message campaigns with detailed insights and performance metrics.
                    </p>
                  </div>
                </div>
              </Col>
              <Col xs={24} lg={6}>
                <div style={{ textAlign: screens.lg ? 'right' : 'left', display: 'flex', gap: '12px', justifyContent: screens.lg ? 'flex-end' : 'flex-start' }}>
                  <Button
                    icon={<ReloadOutlined spin={isRefreshing} />}
                    onClick={handleRefresh}
                    loading={isRefreshing}
                    disabled={isRefreshing}
                    style={{
                      height: '44px',
                    }}
                  >
                    Refresh
                  </Button>
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

              {(searchText || statusFilter !== 'all' || typeFilter !== 'all' || campaignFilter !== 'all' || (dateRange && dateRange[0])) && (
                <Button
                  danger
                  type="primary"
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    setSearchText('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setCampaignFilter('all');
                    setDateRange([null, null]);
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

                {/* Campaign Filter */}
                <Col xs={24} md={12} lg={8}>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: THEME_CONSTANTS.colors.text,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Campaign
                    </label>
                  </div>
                  <Select
                    value={campaignFilter}
                    onChange={handleCampaignChange}
                    style={{ width: '100%' }}
                    size="large"
                    showSearch
                    placeholder="Select campaign"
                    optionFilterProp="label"
                    options={[
                      { label: 'All Campaigns', value: 'all' },
                      ...getUniqueCampaigns().map((campaign) => ({
                        label: campaign,
                        value: campaign,
                      })),
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
                  onClick={() => dispatch(fetchOrders({ userId: user._id, page: currentPage, limit: 10 }))}
                  loading={loading.orders}
                  style={{
                    height: '40px',
                  }}
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
            ) : error?.orders ? (
              <Empty
                description={error?.orders || 'Failed to load campaigns'}
                style={{ padding: '60px 20px' }}
              />
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
                          {(selectedOrder?.totalDelivered || 0) + (selectedOrder?.failedCount || 0)}
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
                        onChange={(e) => handleModalSearch(e.target.value)}
                        allowClear
                        style={{ height: '40px', fontSize: '14px' }}
                      />
                    </Col>
                    <Col xs={24} md={6}>
                      <Select
                        value={modalStatusFilter}
                        onChange={handleModalStatusFilter}
                        style={{ width: '100%' }}
                        size="large"
                        options={[
                          { label: 'All Status', value: 'all' },
                          // { label: 'Draft', value: 'draft' },
                          // { label: 'Draft', value: 'draft' },
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
                              dispatch(fetchCampaignMessages({ campaignId: selectedOrder._id, page: 1, limit: 10 }));
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
                              dispatch(fetchCampaignMessages({ campaignId: selectedOrder._id, page: modalCurrentPage, limit: 10 }));
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
    </>
  );
}
