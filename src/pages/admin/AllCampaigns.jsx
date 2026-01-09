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
  Tag,
  Modal,
  Tooltip,
  Breadcrumb,
  Space,
  Empty,
  Statistic,
  DatePicker,
  Spin,
  Grid,
} from 'antd';
import {
  DownloadOutlined,
  FilterOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
  EyeOutlined,
  ReloadOutlined,
  HomeOutlined,
  DeleteOutlined,
  TeamOutlined,
  SendOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import { 
  getAllCampaignsForAdmin, 
  getCampaignMessages, 
  getAllCampaignMessagesForExport,
  getAllCampaignsForExport,
  setCurrentCampaign, 
  clearCurrentCampaign,
  clearCampaignMessages 
} from '../../redux/slices/campaignSlice';

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

export default function AllCampaigns() {
  const { user, token } = useAuth();
  const dispatch = useDispatch();
  const screens = useBreakpoint();
  
  const { 
    adminCampaigns: campaigns, 
    campaignMessages, 
    currentCampaign: selectedCampaign,
    messagesPagination,
    pagination: campaignsPagination,
    loading, 
    error 
  } = useSelector(state => state.campaigns);
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [showModal, setShowModal] = useState(false);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateRange, setDateRange] = useState([null, null]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [modalSearchText, setModalSearchText] = useState('');
  const [modalStatusFilter, setModalStatusFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingCampaign, setIsExportingCampaign] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allCampaignsForFilters, setAllCampaignsForFilters] = useState([]);

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

  const handleUserChange = (value) => {
    setUserFilter(value);
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const params = { page: currentPage, limit: pageSize, sort: sortOrder };
      if (searchText && searchText.trim()) params.search = searchText.trim();
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
      if (userFilter && userFilter !== 'all') params.user = userFilter;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }
      await dispatch(getAllCampaignsForAdmin(params)).unwrap();
      toast.success('Campaigns refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh campaigns');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const params = { page: currentPage, limit: pageSize, sort: sortOrder };
    if (searchText && searchText.trim()) params.search = searchText.trim();
    if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
    if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
    if (userFilter && userFilter !== 'all') params.user = userFilter;
    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].toISOString();
      params.endDate = dateRange[1].toISOString();
    }
    dispatch(getAllCampaignsForAdmin(params));
  }, [dispatch, currentPage, searchText, statusFilter, typeFilter, userFilter, sortOrder, dateRange]);

  useEffect(() => {
    if (allCampaignsForFilters.length === 0) {
      dispatch(getAllCampaignsForExport({ sort: 'newest' })).unwrap()
        .then(result => setAllCampaignsForFilters(result.data || []));
    }
  }, [dispatch]);

  const getUniqueTypes = () => {
    if (!Array.isArray(allCampaignsForFilters)) return [];
    const types = allCampaignsForFilters
      .map((c) => c.type)
      .filter((type) => type && type !== 'null' && type !== null);
    return [...new Set(types)];
  };

  const getUniqueUsers = () => {
    if (!Array.isArray(allCampaignsForFilters)) return [];
    const users = allCampaignsForFilters
      .map((c) => c.userId?.name)
      .filter((name) => name && name !== 'null' && name !== null);
    return [...new Set(users)];
  };

  const getStatusBadge = (order) => {
    const status = order?.status;
    
    const statusConfig = {
      'completed': { color: '#f6ffed', textColor: THEME_CONSTANTS.colors.success, border: THEME_CONSTANTS.colors.success },
      'running': { color: '#e6f7ff', textColor: '#1890ff', border: '#1890ff' },
      'processing': { color: '#e6f7ff', textColor: '#1890ff', border: '#1890ff' },
      'pending': { color: '#fffbe6', textColor: '#faad14', border: '#faad14' },
      'draft': { color: '#f5f5f5', textColor: '#8c8c8c', border: '#d9d9d9' },
      'paused': { color: '#fff7e6', textColor: '#fa8c16', border: '#fa8c16' },
      'failed': { color: '#fff1f0', textColor: '#ff4d4f', border: '#ff4d4f' },
    };

    const config = statusConfig[status] || { color: '#f5f5f5', textColor: '#8c8c8c', border: '#d9d9d9' };

    return (
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
    );
  };

  const viewCampaignDetails = async (campaign) => {
    dispatch(setCurrentCampaign(campaign));
    setModalCurrentPage(1);
    setModalSearchText('');
    setModalStatusFilter('all');
    setShowModal(true);
    
    if (campaign._id) {
      dispatch(getCampaignMessages({ campaignId: campaign._id, page: 1, limit: 10 }));
    }
  };

  const handleModalSearch = (searchValue) => {
    setModalSearchText(searchValue);
    setModalCurrentPage(1);
    if (selectedCampaign?._id) {
      dispatch(getCampaignMessages({ 
        campaignId: selectedCampaign._id, 
        page: 1, 
        limit: 10,
        search: searchValue || undefined
      }));
    }
  };

  const handleModalStatusFilter = (status) => {
    setModalStatusFilter(status);
    setModalCurrentPage(1);
    if (selectedCampaign?._id) {
      dispatch(getCampaignMessages({ 
        campaignId: selectedCampaign._id, 
        page: 1, 
        limit: 10,
        status: status !== 'all' ? status : undefined
      }));
    }
  };

  const handleModalPageChange = (page) => {
    setModalCurrentPage(page);
    if (selectedCampaign?._id) {
      const params = { campaignId: selectedCampaign._id, page, limit: 10 };
      if (modalSearchText) params.search = modalSearchText;
      if (modalStatusFilter !== 'all') params.status = modalStatusFilter;
      dispatch(getCampaignMessages(params));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalSearchText('');
    setModalStatusFilter('all');
    dispatch(clearCurrentCampaign());
  };

  const exportCampaignDetails = async () => {
    if (isExportingCampaign) return;
    
    let toastInterval;
    try {
      if (!selectedCampaign?._id) {
        toast.error('No campaign selected');
        return;
      }

      setIsExportingCampaign(true);
      
      toastInterval = setInterval(() => {
        toast.dismiss();
      }, 10);

      await new Promise(resolve => setTimeout(resolve, 50));

      const result = await dispatch(getAllCampaignMessagesForExport({ campaignId: selectedCampaign._id })).unwrap();
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

      if (toastInterval) clearInterval(toastInterval);
      await new Promise(resolve => setTimeout(resolve, 150));
      toast.dismiss();

      XLSX.writeFile(workbook, `campaign-${selectedCampaign?.CampaignName}-${new Date().toISOString().split('T')[0]}.xlsx`);
      
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

  const filteredCampaigns = campaigns || [];
  const paginatedMessages = campaignMessages || [];

  const exportToExcel = async () => {
    if (isExporting) return;
    
    let toastInterval;
    try {
      setIsExporting(true);
      
      toastInterval = setInterval(() => {
        toast.dismiss();
      }, 10);

      await new Promise(resolve => setTimeout(resolve, 50));

      const filters = { sort: sortOrder };
      if (searchText) filters.search = searchText;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (typeFilter !== 'all') filters.type = typeFilter;
      if (userFilter !== 'all') filters.user = userFilter;

      const campaignsResult = await dispatch(getAllCampaignsForExport(filters)).unwrap();
      const allCampaigns = campaignsResult.data || [];

      if (allCampaigns.length === 0) {
        clearInterval(toastInterval);
        await new Promise(resolve => setTimeout(resolve, 100));
        toast.dismiss();
        toast.error('No campaigns to export');
        setIsExporting(false);
        return;
      }

      const messagesResults = await Promise.all(
        allCampaigns.map(campaign => 
          dispatch(getAllCampaignMessagesForExport({ campaignId: campaign._id }))
            .unwrap()
            .then(result => result)
            .catch(() => ({ data: [] }))
        )
      );

      const campaignsData = allCampaigns.map((order, idx) => {
        const deliveredCount = order?.totalDelivered || 0;
        const failedCount = order?.failedCount || 0;
        const totalRecipients = order?.cost || 0;
        const successRate = totalRecipients > 0 ? ((deliveredCount / totalRecipients) * 100).toFixed(2) : 0;

        return {
          'S.No': idx + 1,
          'Campaign ID': order?._id || 'N/A',
          'Campaign Name': order?.CampaignName || 'N/A',
          'User': order?.userId?.name || 'N/A',
          'User Email': order?.userId?.email || 'N/A',
          'Message Type': order?.type || 'N/A',
          'Status': order?.status || 'N/A',
          'Total Recipients': totalRecipients,
          'Successfully Delivered': deliveredCount,
          'Failed': failedCount,
          'Success Rate (%)': successRate,
          'Created Date': new Date(order.createdAt).toLocaleDateString(),
          'Created Time': new Date(order.createdAt).toLocaleTimeString(),
        };
      });

      const allMessagesData = [];
      allCampaigns.forEach((campaign, campaignIdx) => {
        const messages = messagesResults[campaignIdx]?.data || [];
        messages.forEach((msg) => {
          allMessagesData.push({
            'S.No': allMessagesData.length + 1,
            'Campaign Name': campaign.CampaignName,
            'Campaign ID': campaign._id,
            'User': campaign.userId?.name || 'N/A',
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
          });
        });
      });

      const workbook = XLSX.utils.book_new();

      const campaignsSheet = XLSX.utils.json_to_sheet(campaignsData);
      campaignsSheet['!cols'] = [
        { wch: 8 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 30 },
        { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 20 },
        { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(workbook, campaignsSheet, 'Campaigns Overview');

      if (allMessagesData.length > 0) {
        const messagesSheet = XLSX.utils.json_to_sheet(allMessagesData);
        messagesSheet['!cols'] = [
          { wch: 8 }, { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
          { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
          { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 30 }, { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(workbook, messagesSheet, 'All Messages');
      }

      if (toastInterval) clearInterval(toastInterval);
      await new Promise(resolve => setTimeout(resolve, 150));
      toast.dismiss();
      
      XLSX.writeFile(workbook, `complete-campaign-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      toast.success(`Exported ${allCampaigns.length} campaigns with ${allMessagesData.length} messages`);
    } catch (error) {
      console.error('Export error:', error);
      if (toastInterval) clearInterval(toastInterval);
      await new Promise(resolve => setTimeout(resolve, 150));
      toast.dismiss();
      toast.error('Failed to export report');
    } finally {
      if (toastInterval) clearInterval(toastInterval);
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
      title: 'User',
      dataIndex: 'userId',
      key: 'user',
      render: (user) => (
        <div>
          <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, fontSize: '13px' }}>
            {user?.name || 'N/A'}
          </div>
          <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary }}>
            {user?.email || 'N/A'}
          </div>
        </div>
      ),
      width: 180,
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
      title: 'Delivered',
      key: 'delivered',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <CheckCircleOutlined style={{ color: THEME_CONSTANTS.colors.success, fontSize: '16px' }} />
          <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.success, fontSize: '15px' }}>
            {record.totalDelivered || 0}
          </span>
        </div>
      ),
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
            {record.failedCount || 0}
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
        const deliveredCount = record.totalDelivered || 0;
        const totalMessages = record.cost || 0;
        const rate = totalMessages > 0 ? (deliveredCount / totalMessages) * 100 : 0;
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
              onClick={() => viewCampaignDetails(record)}
              size="middle"
              style={{ padding: '4px 15px' }}
            />
          </Tooltip>
        </Space>
      ),
      width: 140,
      align: 'center',
      fixed: 'right',
    },
  ];

  return (
    <>
      <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh', padding: THEME_CONSTANTS.spacing.xxl }}>
        <div style={{ maxWidth: THEME_CONSTANTS.layout.maxContentWidth, margin: '0 auto' }}>
          {/* Header Section - Left Aligned */}
          <div style={{
            marginBottom: THEME_CONSTANTS.spacing.xxxl,
            paddingBottom: THEME_CONSTANTS.spacing.xxl,
            borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`
          }}>
            <Breadcrumb style={{ marginBottom: THEME_CONSTANTS.spacing.lg }}>
              <Breadcrumb.Item>
                <span style={{ color: THEME_CONSTANTS.colors.textMuted, fontSize: THEME_CONSTANTS.typography.caption.size }}>Admin</span>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <span style={{ color: THEME_CONSTANTS.colors.primary, fontSize: THEME_CONSTANTS.typography.caption.size, fontWeight: 600 }}>All Campaigns</span>
              </Breadcrumb.Item>
            </Breadcrumb>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: THEME_CONSTANTS.spacing.lg, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.lg }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight} 0%, ${THEME_CONSTANTS.colors.primaryLight} 100%)`,
                  borderRadius: THEME_CONSTANTS.radius.xl,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 16px -4px ${THEME_CONSTANTS.colors.primary}40`,
                  flexShrink: 0
                }}>
                  <TeamOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '36px' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: THEME_CONSTANTS.typography.h1.size,
                    fontWeight: THEME_CONSTANTS.typography.h1.weight,
                    color: THEME_CONSTANTS.colors.text,
                    marginBottom: THEME_CONSTANTS.spacing.xs,
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em'
                  }}>
                    All Campaign Reports
                  </h1>
                  <p style={{
                    color: THEME_CONSTANTS.colors.textSecondary,
                    fontSize: THEME_CONSTANTS.typography.body.size,
                    lineHeight: 1.5,
                    margin: 0
                  }}>
                    Monitor and analyze all user campaigns with detailed insights and performance metrics.
                  </p>
                </div>
              </div>
              <Space>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={exportToExcel}
                  loading={isExporting}
                  disabled={isExporting}
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.md,
                    fontWeight: 600,
                    height: '44px',
                    padding: '0 24px',
                    boxShadow: `0 4px 12px ${THEME_CONSTANTS.colors.primary}30`
                  }}
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  loading={isRefreshing}
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.md,
                    height: '44px'
                  }}
                >
                  Refresh
                </Button>
              </Space>
            </div>
          </div>

          {/* Live Events Feed */}
          {false && (
            <Card
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                boxShadow: THEME_CONSTANTS.shadow.sm,
                marginBottom: '24px',
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>🔴 Live Activity Feed</h3>
                <Badge 
                  status={socketConnected ? "processing" : "error"} 
                  text={socketConnected ? "Real-time" : "Disconnected"} 
                />
              </div>
              <Timeline mode="left">
                {liveEvents.slice(0, 5).map((event) => (
                  <Timeline.Item
                    key={event.id}
                    color={event.status === 'delivered' ? 'green' : event.status === 'failed' ? 'red' : 'blue'}
                    dot={event.status === 'delivered' ? <CheckCircleOutlined /> : 
                         event.status === 'failed' ? <CloseCircleOutlined /> : 
                         event.status === 'interaction' ? <MessageOutlined /> : <SendOutlined />}
                  >
                    <div>
                      <strong>{event.phoneNumber}</strong>
                      <Tag 
                        color={event.status === 'delivered' ? 'green' : 
                               event.status === 'failed' ? 'red' : 
                               event.status === 'interaction' ? 'purple' : 'blue'} 
                        style={{ marginLeft: '8px' }}
                      >
                        {event.status === 'interaction' ? event.interactionType : event.status}
                      </Tag>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        {new Date(event.timestamp).toLocaleTimeString()}
                        {event.text && (
                          <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
                            "{event.text}"
                          </div>
                        )}
                      </div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          )}

          {/* Summary Stats - Universal Data */}
          {campaignsPagination?.totalCampaigns > 0 && (
            <Row gutter={[20, 20]} style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl }}>
              <Col xs={24} sm={12} lg={8}>
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
                    value={campaignsPagination?.totalCampaigns || 0}
                    prefix={<BarChartOutlined style={{ marginRight: '8px', color: THEME_CONSTANTS.colors.primary }} />}
                    valueStyle={{ color: THEME_CONSTANTS.colors.primary, fontSize: '28px', fontWeight: 700 }}
                    titleStyle={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
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
                    value={campaignsPagination?.totalSent || (campaignsPagination?.totalDelivered || 0) + (campaignsPagination?.totalFailed || 0)}
                    prefix={<SendOutlined style={{ marginRight: '8px', color: THEME_CONSTANTS.colors.primary }} />}
                    valueStyle={{ color: THEME_CONSTANTS.colors.primary, fontSize: '28px', fontWeight: 700 }}
                    titleStyle={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
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
                    value={campaignsPagination?.totalDelivered || 0}
                    prefix={<CheckCircleOutlined style={{ marginRight: '8px', color: THEME_CONSTANTS.colors.success }} />}
                    valueStyle={{ color: THEME_CONSTANTS.colors.success, fontSize: '28px', fontWeight: 700 }}
                    titleStyle={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
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
                    value={campaignsPagination?.totalFailed || 0}
                    prefix={<CloseCircleOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />}
                    valueStyle={{ color: '#ff4d4f', fontSize: '28px', fontWeight: 700 }}
                    titleStyle={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Card
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.lg,
                    border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                    boxShadow: THEME_CONSTANTS.shadow.sm,
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <Statistic
                    title="Success Rate"
                    value={
                      (() => {
                        const totalDelivered = campaignsPagination?.totalDelivered || 0;
                        const totalSent = campaignsPagination?.totalSent || (campaignsPagination?.totalDelivered || 0) + (campaignsPagination?.totalFailed || 0);
                        return totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(2) : 0;
                      })()
                    }
                    suffix="%"
                    valueStyle={{ color: THEME_CONSTANTS.colors.primary, fontSize: '28px', fontWeight: 700 }}
                    titleStyle={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* Enhanced Filters */}
          <Card
            style={{
              borderRadius: THEME_CONSTANTS.radius.xl,
              border: `1px solid ${THEME_CONSTANTS.colors.border}`,
              background: THEME_CONSTANTS.colors.surface,
              boxShadow: THEME_CONSTANTS.shadow.lg,
              marginBottom: '32px',
            }}
            bodyStyle={{ padding: '32px' }}
          >
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: THEME_CONSTANTS.colors.text, margin: 0, marginBottom: '8px' }}>
                🔍 Filter & Search
              </h3>
              <p style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>
                Use filters to find specific campaigns and analyze performance across all users
              </p>
            </div>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.text }}>Search Campaigns</label>
                </div>
                <Input
                  placeholder="Search by name, ID, or user..."
                  prefix={<SearchOutlined style={{ color: THEME_CONSTANTS.colors.textMuted }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.md,
                    border: `2px solid ${THEME_CONSTANTS.colors.border}`,
                    padding: '8px 12px',
                    fontSize: '14px'
                  }}
                />
              </Col>

              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.text }}>Status Filter</label>
                </div>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%' }}
                  size="large"
                  options={[
                    { label: 'All Status', value: 'all' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Processing', value: 'processing' },
                    { label: 'Failed', value: 'failed' },
                  ]}
                />
              </Col>

              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.text }}>Message Type</label>
                </div>
                <Select
                  value={typeFilter}
                  onChange={setTypeFilter}
                  style={{ width: '100%' }}
                  size="large"
                  options={[
                    { label: '📊 All Message Types', value: 'all' },
                    { label: '📝 Text Message', value: 'plainText' },
                    { label: '🎴 Rich Card', value: 'richCard' },
                    { label: '🎠 Carousel', value: 'carousel' },
                    { label: '⚡ Action Message', value: 'textWithAction' },
                  ]}
                />
              </Col>

              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.text }}>User Filter</label>
                </div>
                <Select
                  value={userFilter}
                  onChange={setUserFilter}
                  style={{ width: '100%' }}
                  size="large"
                  showSearch
                  optionFilterProp="label"
                  options={[
                    { label: 'All Users', value: 'all' },
                    ...getUniqueUsers().map((user) => ({
                      label: user,
                      value: user,
                    })),
                  ]}
                />
              </Col>

              <Col xs={24} md={12}>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.text }}>Date Range</label>
                </div>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  style={{ width: '100%', height: '40px', borderRadius: THEME_CONSTANTS.radius.md }}
                  format="DD/MM/YYYY"
                />
              </Col>

              <Col xs={24} md={12}>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.text }}>Sort Order</label>
                </div>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                  style={{ 
                    width: '100%', 
                    height: '40px',
                    borderRadius: THEME_CONSTANTS.radius.md,
                    border: `2px solid ${THEME_CONSTANTS.colors.border}`,
                    background: sortOrder === 'newest' ? THEME_CONSTANTS.colors.primary : THEME_CONSTANTS.colors.surface,
                    color: sortOrder === 'newest' ? 'white' : THEME_CONSTANTS.colors.text
                  }}
                >
                  {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Enhanced Campaign Table */}
          <Card
            title={
              <Space size={8}>
                <BarChartOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '18px' }} />
                <span style={{ fontSize: THEME_CONSTANTS.typography.h5.size, fontWeight: THEME_CONSTANTS.typography.h5.weight, color: THEME_CONSTANTS.colors.text }}>All Campaign Overview</span>
              </Space>
            }
            extra={
              <span style={{ fontSize: THEME_CONSTANTS.typography.body.size, color: THEME_CONSTANTS.colors.textSecondary }}>
                {filteredCampaigns.length} of {campaigns?.length || 0} campaigns
              </span>
            }
            style={{
              borderRadius: THEME_CONSTANTS.radius.lg,
              border: `1px solid ${THEME_CONSTANTS.colors.border}`,
              boxShadow: THEME_CONSTANTS.shadow.base,
              background: THEME_CONSTANTS.colors.surface
            }}
            bodyStyle={{ padding: 0 }}
          >
            {loading.adminCampaigns ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 20px' }}>
                <Spin size="large" />
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <Empty description="No campaigns match your filters" style={{ padding: '60px 20px' }} />
            ) : (
              <Table
                columns={columns}
                dataSource={filteredCampaigns}
                rowKey={(record) => `campaign-${record._id}-${record.createdAt}`}
                pagination={{ 
                  current: currentPage, 
                  pageSize: 10, 
                  total: campaignsPagination?.total || 0, 
                  onChange: (page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 
                  showSizeChanger: false,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                  style: { padding: '16px 24px' }
                }}
                scroll={{ x: 1200 }}
                size="middle"
              />
            )}
          </Card>
        </div>
      </div>

      {/* Campaign Analytics Modal */}
      <Modal
        title={null}
        open={showModal}
        onCancel={closeModal}
        width={1400}
        footer={null}
        bodyStyle={{ padding: 0 }}
        style={{ top: 20 }}
      >
        {selectedCampaign && (
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
                        {selectedCampaign?.CampaignName}
                      </h2>
                      <p style={{
                        color: THEME_CONSTANTS.colors.textSecondary,
                        fontSize: THEME_CONSTANTS.typography.bodySmall.size,
                        margin: 0
                      }}>
                        Campaign Analytics Dashboard • User: {selectedCampaign.userId?.name}
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
                      {selectedCampaign?.type || 'RCS'}
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
                          {selectedCampaign?.cost || 0}
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
                        background: THEME_CONSTANTS.colors.successLight, 
                        borderRadius: THEME_CONSTANTS.radius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <SendOutlined style={{ fontSize: '20px', color: THEME_CONSTANTS.colors.success }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.text, lineHeight: 1, marginBottom: '4px' }}>
                          {(selectedCampaign?.totalDelivered || 0) + (selectedCampaign?.failedCount || 0)}
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
                          {selectedCampaign?.totalDelivered || 0}
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
                          {campaignMessages?.filter(msg => msg.readAt).length || 0}
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
                          {selectedCampaign?.failedCount || 0}
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
                          {campaignMessages?.reduce((sum, msg) => sum + (msg.interactions || 0), 0) || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600 }}>Interactions</div>
                      </div>
                    </div>
                  </Card>
                </Col>
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
                          { label: 'Sent', value: 'sent' },
                          { label: 'Delivered', value: 'delivered' },
                          { label: 'Read', value: 'read' },
                          { label: 'Failed', value: 'failed' },
                        ]}
                      />
                    </Col>
                    <Col xs={24} md={8}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                        <Button
                          onClick={() => {
                            setModalSearchText('');
                            setModalStatusFilter('all');
                            setModalCurrentPage(1);
                            if (selectedCampaign?._id) {
                              dispatch(getCampaignMessages({ campaignId: selectedCampaign._id, page: 1, limit: 10 }));
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
                            if (selectedCampaign?._id) {
                              dispatch(getCampaignMessages({ campaignId: selectedCampaign._id, page: modalCurrentPage, limit: 10 }));
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
                    total: messagesPagination.total || 0,
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
                        const colors = {
                          sent: THEME_CONSTANTS.colors.primary,
                          delivered: THEME_CONSTANTS.colors.success,
                          read: '#8b5cf6',
                          failed: THEME_CONSTANTS.colors.danger,
                          queued: THEME_CONSTANTS.colors.warning
                        };
                        return (
                          <Tag color={colors[status] || '#8c8c8c'} style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px' }}>
                            {status?.toUpperCase()}
                          </Tag>
                        );
                      }
                    },
                    {
                      title: 'Type',
                      dataIndex: 'templateType',
                      key: 'type',
                      width: 100,
                      render: (type) => (
                        <Tag style={{ fontSize: '12px', background: THEME_CONSTANTS.colors.primaryLight, color: THEME_CONSTANTS.colors.primary, border: 'none', fontWeight: 600 }}>
                          {type}
                        </Tag>
                      )
                    },
                    {
                      title: 'Sent At',
                      dataIndex: 'sentAt',
                      key: 'sent',
                      width: 100,
                      render: (date) => date ? (
                        <span style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.text }}>
                          {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                          {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                          {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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