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
  Tooltip,
  Breadcrumb,
  Space,
  Empty,
  Statistic,
  DatePicker,
  Badge,
  Timeline,
  Avatar,
  Spin,
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
  UserOutlined,
  SendOutlined,
  MessageOutlined,
  TeamOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { io } from 'socket.io-client';
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

// Professional message type mapping
const MESSAGE_TYPE_MAPPING = {
  'plainText': 'Text Message',
  'carousel': 'Interactive Carousel',
  'richCard': 'Rich Media Card',
  'textWithAction': 'Action-Based Message'
};

// Get professional type name
const getProfessionalTypeName = (type) => {
  return MESSAGE_TYPE_MAPPING[type] || type || 'Standard Message';
};

export default function AllCampaigns() {
  const { user, token } = useAuth();
  const dispatch = useDispatch();
  
  // Redux state
  const { 
    adminCampaigns: campaigns, 
    campaignMessages, 
    currentCampaign: selectedCampaign,
    messagesPagination,
    pagination: campaignsPagination,
    loading, 
    error 
  } = useSelector(state => state.campaigns);
  
  // Local state
  const [realTimeStats, setRealTimeStats] = useState({});
  const [liveEvents, setLiveEvents] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalSearchText, setModalSearchText] = useState('');
  const [modalStatusFilter, setModalStatusFilter] = useState('all');

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateRange, setDateRange] = useState([null, null]);
  const [sortOrder, setSortOrder] = useState('newest');

  // Fetch all campaigns with pagination
  const fetchAllCampaigns = (page = 1, filters = {}) => {
    const params = { page, limit: 10, sort: sortOrder, ...filters };
    dispatch(getAllCampaignsForAdmin(params));
  };

  const fetchCampaignMessagesHandler = (campaignId, page = 1, search = '', status = 'all') => {
    const params = { campaignId, page, limit: 20 };
    if (search) params.search = search;
    if (status !== 'all') params.status = status;
    dispatch(getCampaignMessages(params));
  };

  useEffect(() => {
    const filters = {};
    if (searchText) filters.search = searchText;
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (typeFilter !== 'all') filters.type = typeFilter;
    if (userFilter !== 'all') filters.user = userFilter;
    
    setCurrentPage(1);
    fetchAllCampaigns(1, filters);
  }, [dispatch, searchText, statusFilter, typeFilter, userFilter, sortOrder]);

  useEffect(() => {
    const filters = {};
    if (searchText) filters.search = searchText;
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (typeFilter !== 'all') filters.type = typeFilter;
    if (userFilter !== 'all') filters.user = userFilter;
    
    fetchAllCampaigns(currentPage, filters);
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const getUniqueTypes = () => {
    return [...new Set(campaigns.map((campaign) => campaign.type).filter(Boolean))];
  };

  const getUniqueUsers = () => {
    return [...new Set(campaigns.map((campaign) => campaign.userId?.name).filter(Boolean))];
  };

  const getStatusBadge = (campaign) => {
    const campaignId = campaign._id;
    const liveStats = realTimeStats[campaignId];
    
    const successCount = liveStats?.delivered || campaign?.successCount || 0;
    const failedCount = liveStats?.failed || campaign?.failedCount || 0;
    const sentCount = liveStats?.sent || campaign?.successCount || 0;
    const totalMessages = liveStats?.total || campaign?.cost || 0;
    const pendingCount = liveStats?.pending || 0;
    const processingCount = liveStats?.processing || 0;

    const isCompleted = campaign?.status === 'completed';
    const isProcessing = campaign?.status === 'processing' || campaign?.status === 'running';
    const isFailed = campaign?.status === 'failed';
    
    if (isCompleted) {
      return (
        <Tag
          color={THEME_CONSTANTS.colors.successLight}
          style={{
            color: THEME_CONSTANTS.colors.success,
            border: `1px solid ${THEME_CONSTANTS.colors.success}`,
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: THEME_CONSTANTS.radius.sm,
            fontSize: '11px'
          }}
        >
          ✅ Completed
        </Tag>
      );
    }

    if (isFailed) {
      return (
        <Tag
          color={THEME_CONSTANTS.colors.dangerLight}
          style={{
            color: THEME_CONSTANTS.colors.danger,
            border: `1px solid ${THEME_CONSTANTS.colors.danger}`,
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: THEME_CONSTANTS.radius.sm,
            fontSize: '11px'
          }}
        >
          ❌ Failed
        </Tag>
      );
    }

    if (isProcessing || pendingCount > 0 || processingCount > 0) {
      return (
        <Tag
          color={THEME_CONSTANTS.colors.warningLight}
          style={{
            color: THEME_CONSTANTS.colors.warning,
            border: `1px solid ${THEME_CONSTANTS.colors.warning}`,
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: THEME_CONSTANTS.radius.sm,
            fontSize: '11px'
          }}
        >
          🔄 {isProcessing ? 'Processing' : 'Pending'}
        </Tag>
      );
    }

    if (sentCount === 0 && !isCompleted) {
      return (
        <Tag
          color={THEME_CONSTANTS.colors.warningLight}
          style={{
            color: THEME_CONSTANTS.colors.warning,
            border: `1px solid ${THEME_CONSTANTS.colors.warning}`,
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: THEME_CONSTANTS.radius.sm,
            fontSize: '11px'
          }}
        >
          ⏳ Pending
        </Tag>
      );
    }

    const successRate = totalMessages > 0 ? (successCount / totalMessages) * 100 : 0;
    
    const getStatusText = () => {
      if (successRate >= 80) return '✅ Success';
      if (successRate > 0) return '⚠️ Partial';
      return '❌ Failed';
    };

    const getStatusColor = () => {
      if (successRate >= 80) return THEME_CONSTANTS.colors.success;
      if (successRate > 0) return THEME_CONSTANTS.colors.warning;
      return THEME_CONSTANTS.colors.danger;
    };

    const getStatusBg = () => {
      if (successRate >= 80) return THEME_CONSTANTS.colors.successLight;
      if (successRate > 0) return THEME_CONSTANTS.colors.warningLight;
      return THEME_CONSTANTS.colors.dangerLight;
    };

    return (
      <Tag
        color={getStatusBg()}
        style={{
          color: getStatusColor(),
          border: `1px solid ${getStatusColor()}`,
          fontWeight: 600,
          padding: '4px 8px',
          borderRadius: THEME_CONSTANTS.radius.sm,
          fontSize: '11px'
        }}
      >
        {getStatusText()}
      </Tag>
    );
  };

  const viewCampaignDetails = (campaign) => {
    dispatch(setCurrentCampaign(campaign));
    setModalCurrentPage(1);
    setModalSearchText('');
    setModalStatusFilter('all');
    setShowModal(true);
    if (campaign._id) {
      fetchCampaignMessagesHandler(campaign._id, 1, '', 'all');
      if (socket) {
        socket.emit('join_campaign', campaign._id);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalSearchText('');
    setModalStatusFilter('all');
    setModalCurrentPage(1);
    if (socket && selectedCampaign?._id) {
      socket.emit('leave_campaign', selectedCampaign._id);
    }
    dispatch(clearCurrentCampaign());
    dispatch(clearCampaignMessages());
  };

  const handleModalSearch = (searchValue) => {
    setModalSearchText(searchValue);
    setModalCurrentPage(1);
    if (selectedCampaign?._id) {
      fetchCampaignMessagesHandler(selectedCampaign._id, 1, searchValue, modalStatusFilter);
    }
  };

  const handleModalStatusFilter = (status) => {
    setModalStatusFilter(status);
    setModalCurrentPage(1);
    if (selectedCampaign?._id) {
      fetchCampaignMessagesHandler(selectedCampaign._id, 1, modalSearchText, status);
    }
  };

  const handleModalPageChange = (page) => {
    setModalCurrentPage(page);
    if (selectedCampaign?._id) {
      fetchCampaignMessagesHandler(selectedCampaign._id, page, modalSearchText, modalStatusFilter);
    }
  };

  const exportCampaignDetails = async () => {
    try {
      if (!selectedCampaign?._id) {
        toast.error('No campaign selected');
        return;
      }

      const result = await dispatch(getAllCampaignMessagesForExport({ campaignId: selectedCampaign._id })).unwrap();
      const allMessages = result.data || [];

      if (allMessages.length === 0) {
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
      XLSX.writeFile(workbook, `campaign-${selectedCampaign?.CampaignName}-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success(`Exported ${exportData.length} messages successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export campaign details');
    }
  };

  // Remove client-side filtering - use server data directly
  const filteredCampaigns = campaigns;

  const exportToExcel = async () => {
    try {
      toast.loading('Fetching all campaigns for export...');
      
      const filters = { sort: sortOrder };
      if (searchText) filters.search = searchText;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (typeFilter !== 'all') filters.type = typeFilter;
      if (userFilter !== 'all') filters.user = userFilter;

      const result = await dispatch(getAllCampaignsForExport(filters)).unwrap();
      const allCampaigns = result.data || [];

      if (allCampaigns.length === 0) {
        toast.dismiss();
        toast.error('No campaigns to export');
        return;
      }

      const exportData = allCampaigns.map((campaign, idx) => {
        const successCount = campaign?.successCount || 0;
        const failedCount = campaign?.failedCount || 0;
        const totalRecipients = campaign?.cost || 0;

        return {
          'ID': `#${idx + 1}`,
          'Campaign Name': campaign?.CampaignName || 'N/A',
          'User': campaign?.userId?.name || 'N/A',
          'User Email': campaign?.userId?.email || 'N/A',
          'Message Type': campaign?.type || 'N/A',
          'Total Recipients': totalRecipients,
          'Successful': successCount,
          'Failed': failedCount,
          'Success Rate': totalRecipients > 0 ? `${((successCount / totalRecipients) * 100).toFixed(2)}%` : '0%',
          'Status': campaign?.status || 'N/A',
          'Date': new Date(campaign.createdAt).toLocaleDateString(),
          'Time': new Date(campaign.createdAt).toLocaleTimeString(),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [
        { wch: 8 }, { wch: 25 }, { wch: 20 }, { wch: 30 },
        { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'All Campaign Reports');

      XLSX.writeFile(workbook, `all-campaign-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.dismiss();
      toast.success(`Exported ${exportData.length} campaigns successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to export campaigns');
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
      key: 'success',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <CheckCircleOutlined style={{ color: THEME_CONSTANTS.colors.success, fontSize: '16px' }} />
          <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.success, fontSize: '15px' }}>
            {record?.successCount || 0}
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
            {record?.failedCount || 0}
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
        const successCount = record?.successCount || 0;
        const totalMessages = record?.cost || 0;
        const rate = totalMessages > 0 ? (successCount / totalMessages) * 100 : 0;
        const color = rate >= 80 ? THEME_CONSTANTS.colors.success : rate >= 50 ? '#fa8c16' : THEME_CONSTANTS.colors.danger;
        
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
                fontSize: '13px', 
                fontWeight: 700, 
                color
              }}>
                {Math.round(rate)}%
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
                  background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
                  borderRadius: THEME_CONSTANTS.radius.xl,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 16px -4px ${THEME_CONSTANTS.colors.primary}40`,
                  flexShrink: 0
                }}>
                  <TeamOutlined style={{ color: '#fff', fontSize: '36px' }} />
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
                  style={{
                    borderRadius: THEME_CONSTANTS.radius.md,
                    fontWeight: 600,
                    height: '44px',
                    padding: '0 24px',
                    boxShadow: `0 4px 12px ${THEME_CONSTANTS.colors.primary}30`
                  }}
                >
                  Export
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchAllCampaigns}
                  loading={loading.adminCampaigns}
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
          {liveEvents.length > 0 && (
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
                    value={campaignsPagination?.totalCampaigns || 0}
                    prefix={<BarChartOutlined style={{ marginRight: '8px', color: THEME_CONSTANTS.colors.primary }} />}
                    valueStyle={{ color: THEME_CONSTANTS.colors.primary, fontSize: '28px', fontWeight: 700 }}
                    titleStyle={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}
                  />
                </Card>
              </Col>

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
                    title="Total Delivered"
                    value={campaignsPagination?.totalDelivered || 0}
                    prefix={<CheckCircleOutlined style={{ marginRight: '8px', color: THEME_CONSTANTS.colors.success }} />}
                    valueStyle={{ color: THEME_CONSTANTS.colors.success, fontSize: '28px', fontWeight: 700 }}
                    titleStyle={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}
                  />
                </Card>
              </Col>

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
                    title="Total Failed"
                    value={campaignsPagination?.totalFailed || 0}
                    prefix={<CloseCircleOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />}
                    valueStyle={{ color: '#ff4d4f', fontSize: '28px', fontWeight: 700 }}
                    titleStyle={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}
                  />
                </Card>
              </Col>

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
                    title="Success Rate"
                    value={
                      (() => {
                        const totalDelivered = campaignsPagination?.totalDelivered || 0;
                        const totalMessages = (campaignsPagination?.totalDelivered || 0) + (campaignsPagination?.totalFailed || 0);
                        return totalMessages > 0 ? ((totalDelivered / totalMessages) * 100).toFixed(2) : 0;
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
                    { label: 'All Message Types', value: 'all' },
                    ...getUniqueTypes().map((type) => ({ 
                      label: getProfessionalTypeName(type), 
                      value: type 
                    })),
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
                      {getProfessionalTypeName(selectedCampaign?.type)}
                    </Tag>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={exportCampaignDetails}
                      style={{
                        background: THEME_CONSTANTS.colors.primary,
                        borderColor: THEME_CONSTANTS.colors.primary,
                        fontWeight: 600,
                        height: '44px',
                        padding: '0 24px',
                        borderRadius: THEME_CONSTANTS.radius.md
                      }}
                    >
                      Export Messages
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
                          {selectedCampaign?.successCount || 0}
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
                          {selectedCampaign?.totalRead || 0}
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
                          {selectedCampaign?.userClickCount || 0}
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
                              fetchCampaignMessagesHandler(selectedCampaign._id, 1, '', 'all');
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
                              fetchCampaignMessagesHandler(selectedCampaign._id, modalCurrentPage, modalSearchText, modalStatusFilter);
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
                    pageSize: 20,
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