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

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateRange, setDateRange] = useState([null, null]);
  const [sortOrder, setSortOrder] = useState('newest');

  // Fetch all campaigns from all users
  const fetchAllCampaigns = () => {
    dispatch(getAllCampaignsForAdmin());
  };

  // Fetch campaign messages
  const fetchCampaignMessagesHandler = (campaignId, page = 1) => {
    dispatch(getCampaignMessages({ campaignId, page, limit: 20 }));
  };

  useEffect(() => {
    fetchAllCampaigns();
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Socket.IO setup for real-time updates
  useEffect(() => {
    if (!token) return;

    try {
      const socketUrl = 'http://localhost:3000';
      
      const newSocket = io(socketUrl, {
        auth: { token },
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to real-time updates');
        setSocketConnected(true);
        // Request initial stats for all campaigns
        if (campaigns?.length > 0) {
          campaigns.forEach(campaign => {
            newSocket.emit('request_stats', campaign._id);
          });
        }
      });

      newSocket.on('connect_error', (error) => {
        console.warn('❌ Socket connection failed:', error.message);
        setSocketConnected(false);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        setSocketConnected(false);
      });

      // Real-time stats updates
      newSocket.on('stats_update', (data) => {
        setRealTimeStats(prev => ({
          ...prev,
          [data.campaignId]: data.stats
        }));
      });

      // Message status updates
      newSocket.on('message_status_update', (data) => {
        setLiveEvents(prev => [{
          id: Date.now() + Math.random(),
          campaignId: data.campaignId,
          messageId: data.messageId,
          phoneNumber: data.phoneNumber,
          status: data.status,
          timestamp: data.timestamp,
          eventType: data.eventType
        }, ...prev.slice(0, 19)]);
      });

      // User interactions
      newSocket.on('user_interaction', (data) => {
        setLiveEvents(prev => [{
          id: Date.now() + Math.random(),
          campaignId: data.campaignId,
          messageId: data.messageId,
          phoneNumber: data.phoneNumber,
          status: 'interaction',
          interactionType: data.interactionType,
          text: data.text,
          timestamp: data.timestamp
        }, ...prev.slice(0, 19)]);
      });

      setSocket(newSocket);

      return () => {
        console.log('🔌 Disconnecting socket');
        setSocketConnected(false);
        newSocket.disconnect();
      };
    } catch (error) {
      console.warn('Failed to initialize socket connection:', error);
      setSocketConnected(false);
    }
  }, [token, campaigns]);

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
    setShowModal(true);
    if (campaign._id) {
      fetchCampaignMessagesHandler(campaign._id, 1);
      if (socket) {
        socket.emit('join_campaign', campaign._id);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    if (socket && selectedCampaign?._id) {
      socket.emit('leave_campaign', selectedCampaign._id);
    }
    dispatch(clearCurrentCampaign());
    dispatch(clearCampaignMessages());
  };

  // Filter campaigns
  const getFilteredCampaigns = () => {
    let filtered = [...campaigns];
    
    if (searchText) {
      filtered = filtered.filter(campaign => 
        campaign.CampaignName?.toLowerCase().includes(searchText.toLowerCase()) ||
        campaign._id?.toLowerCase().includes(searchText.toLowerCase()) ||
        campaign.userId?.name?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(campaign => {
        switch (statusFilter) {
          case 'completed':
            return campaign?.status === 'completed';
          case 'processing':
            return campaign?.status === 'running' || campaign?.status === 'processing';
          case 'failed':
            return campaign?.status === 'failed';
          default:
            return true;
        }
      });
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(campaign => campaign.type === typeFilter);
    }
    
    if (userFilter !== 'all') {
      filtered = filtered.filter(campaign => campaign.userId?.name === userFilter);
    }
    
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(campaign => {
        const campaignDate = dayjs(campaign.createdAt);
        return campaignDate.isAfter(dateRange[0].startOf('day')) && 
               campaignDate.isBefore(dateRange[1].endOf('day'));
      });
    }
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return filtered;
  };

  const filteredCampaigns = getFilteredCampaigns();

  const exportToExcel = () => {
    try {
      if (!campaigns || campaigns?.length === 0) {
        toast.error('No data to export');
        return;
      }

      const exportData = campaigns?.map((campaign, idx) => {
        const successCount = campaign?.successCount || 0;
        const failedCount = campaign?.failedCount || 0;
        const totalRecipients = campaign?.cost || 0;

        return {
          'ID': `#${idx + 1}`,
          'Campaign Name': campaign?.CampaignName || 'N/A',
          'User': campaign?.userId?.name || 'N/A',
          'Message Type': campaign?.type || 'N/A',
          'Total Recipients': totalRecipients,
          'Successful': successCount,
          'Failed': failedCount,
          'Date': new Date(campaign.createdAt).toLocaleDateString(),
          'Time': new Date(campaign.createdAt).toLocaleTimeString(),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'All Campaign Reports');

      XLSX.writeFile(workbook, `all-campaign-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: 'id',
      render: (text, record, index) => (
        <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.primary, fontSize: '13px' }}>
          #{index + 1}
        </span>
      ),
      width: '8%',
    },
    {
      title: 'Campaign Details',
      dataIndex: 'CampaignName',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, fontSize: '14px' }}>
            {text || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>
            {record._id}
          </div>
        </div>
      ),
      width: '20%',
    },
    {
      title: 'User',
      dataIndex: 'userId',
      key: 'user',
      render: (user) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar
            size={32}
            style={{ background: THEME_CONSTANTS.colors.primary }}
          >
            {user?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, fontSize: '13px' }}>
              {user?.name || 'N/A'}
            </div>
            <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary }}>
              {user?.email || 'N/A'}
            </div>
          </div>
        </div>
      ),
      width: '18%',
    },
    {
      title: 'Message Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const professionalName = getProfessionalTypeName(type);
        
        const getTypeColor = (type) => {
          switch (type) {
            case 'plainText':
              return { bg: '#e6f7ff', color: '#1890ff' };
            case 'carousel':
              return { bg: '#f6ffed', color: '#52c41a' };
            case 'richCard':
              return { bg: '#fff2e8', color: '#fa8c16' };
            case 'textWithAction':
              return { bg: '#f9f0ff', color: '#722ed1' };
            default:
              return { bg: '#f6f8fb', color: '#667085' };
          }
        };
        
        const colors = getTypeColor(type);
        
        return (
          <Tag
            style={{
              background: colors.bg,
              color: colors.color,
              border: `1px solid ${colors.color}20`,
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: THEME_CONSTANTS.radius.md,
              fontSize: '12px',
            }}
          >
            {professionalName}
          </Tag>
        );
      },
      width: '15%',
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
      width: '10%',
    },
    {
      title: 'Success / Failed',
      key: 'results',
      render: (text, record) => {
        const campaignId = record._id;
        const liveStats = realTimeStats[campaignId];
        const successCount = liveStats?.delivered || record?.successCount || 0;
        const failedCount = liveStats?.failed || record?.failedCount || 0;
        const totalMessages = liveStats?.total || record?.cost || 0;
        
        const deliveryRate = totalMessages > 0 ? (successCount / totalMessages) * 100 : 0;
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Progress
              type="circle"
              size={24}
              percent={Math.round(deliveryRate) || 0}
              strokeColor={deliveryRate >= 80 ? THEME_CONSTANTS.colors.success : deliveryRate >= 50 ? '#fa8c16' : '#ff4d4f'}
              trailColor="#f0f0f0"
              strokeWidth={8}
              format={(percent) => (
                <span style={{ 
                  fontSize: '8px', 
                  fontWeight: 700, 
                  color: deliveryRate >= 80 ? THEME_CONSTANTS.colors.success : deliveryRate >= 50 ? '#fa8c16' : '#ff4d4f'
                }}>
                  {percent || 0}%
                </span>
              )}
            />
            <div>
              <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.success, fontSize: '13px' }}>
                {successCount}
              </span>
              <span style={{ color: THEME_CONSTANTS.colors.textSecondary, margin: '0 4px' }}>|</span>
              <span style={{ fontWeight: 600, color: '#ff4d4f', fontSize: '13px' }}>
                {failedCount}
              </span>
            </div>
          </div>
        );
      },
      width: '15%',
    },
    {
      title: 'Status',
      key: 'status',
      render: (text, record) => getStatusBadge(record),
      width: '12%',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => (
        <Tooltip title={new Date(date).toLocaleString()}>
          <span style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>
            {new Date(date).toLocaleDateString()}
          </span>
        </Tooltip>
      ),
      width: '12%',
      responsive: ['md'],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => viewCampaignDetails(record)}
          style={{ color: THEME_CONSTANTS.colors.primary }}
          title="View Details"
        />
      ),
      width: '8%',
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
                <span style={{ color: THEME_CONSTANTS.colors.textMuted }}>Admin</span>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <span style={{ 
                  color: THEME_CONSTANTS.colors.primary,
                  fontWeight: THEME_CONSTANTS.typography.h6.weight
                }}>
                  All Campaigns
                </span>
              </Breadcrumb.Item>
            </Breadcrumb>

            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col xs={24} lg={18}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={4} md={3} lg={3}>
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
                      <TeamOutlined style={{
                        color: THEME_CONSTANTS.colors.primary,
                        fontSize: '32px'
                      }} />
                    </div>
                  </Col>
                  <Col xs={24} sm={20} md={21} lg={21}>
                    <div>
                      <h1 style={{
                        fontSize: 'clamp(24px, 4vw, 32px)',
                        fontWeight: THEME_CONSTANTS.typography.h1.weight,
                        color: THEME_CONSTANTS.colors.text,
                        marginBottom: THEME_CONSTANTS.spacing.sm,
                        lineHeight: THEME_CONSTANTS.typography.h1.lineHeight
                      }}>
                        All Campaign Reports 📊
                      </h1>
                      <p style={{
                        color: THEME_CONSTANTS.colors.textSecondary,
                        fontSize: 'clamp(13px, 2.5vw, 14px)',
                        fontWeight: 500,
                        lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                        margin: 0
                      }}>
                        Monitor and analyze all user campaigns with detailed insights and performance metrics.
                      </p>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col xs={24} lg={6}>
                <div style={{ textAlign: 'right' }}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={exportToExcel}
                      style={{
                        background: THEME_CONSTANTS.colors.primary,
                        borderColor: THEME_CONSTANTS.colors.primary,
                      }}
                    >
                      Export Report
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={fetchAllCampaigns}
                      loading={loading.adminCampaigns}
                    >
                      Refresh
                    </Button>
                  </Space>
                </div>
              </Col>
            </Row>
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

          {/* Summary Stats */}
          {campaigns.length > 0 && (
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
                    value={campaigns?.length}
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
                    value={Object.values(realTimeStats).reduce((acc, stats) => acc + (stats?.delivered || 0), 0) || 
                           campaigns?.reduce((acc, campaign) => acc + (campaign?.successCount || 0), 0)}
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
                    value={Object.values(realTimeStats).reduce((acc, stats) => acc + (stats?.failed || 0), 0) || 
                           campaigns?.reduce((acc, campaign) => acc + (campaign?.failedCount || 0), 0)}
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
                        const totalDelivered = Object.values(realTimeStats).reduce((acc, stats) => acc + (stats?.delivered || 0), 0) || 
                                             campaigns?.reduce((acc, campaign) => acc + (campaign?.successCount || 0), 0);
                        const totalSent = Object.values(realTimeStats).reduce((acc, stats) => acc + (stats?.sent || 0), 0) || 
                                        campaigns?.reduce((acc, campaign) => acc + ((campaign?.successCount || 0) + (campaign?.failedCount || 0)), 0);
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
            style={{
              borderRadius: THEME_CONSTANTS.radius.xl,
              border: `1px solid ${THEME_CONSTANTS.colors.border}`,
              background: THEME_CONSTANTS.colors.surface,
              boxShadow: THEME_CONSTANTS.shadow.lg,
            }}
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ padding: '32px 32px 24px 32px', borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: THEME_CONSTANTS.colors.text, margin: 0, marginBottom: '4px' }}>
                    📈 All Campaign Overview
                  </h3>
                  <p style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>
                    {filteredCampaigns.length} of {campaigns?.length || 0} campaigns shown
                  </p>
                </div>
               
              </div>
            </div>
            {loading.adminCampaigns ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '60px 20px',
                }}
              >
                <Spin size="large" />
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
            ) : filteredCampaigns.length === 0 ? (
              <Empty
                description="No campaigns match your filters"
                style={{ padding: '60px 20px' }}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table
                columns={columns}
                dataSource={filteredCampaigns}
                rowKey={(record) => `campaign-${record._id}-${record.createdAt}`}
                pagination={{
                  current: currentPage,
                  pageSize: 10,
                  total: filteredCampaigns.length,
                  onChange: setCurrentPage,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} campaigns`,
                }}
                scroll={{ x: 1200 }}
                style={{ padding: '0 32px 32px 32px' }}
              />
            )}
          </Card>
        </div>
      </div>

      {/* Enhanced Campaign Details Modal */}
      <Modal
        title={null}
        open={showModal}
        onCancel={closeModal}
        footer={null}
        width={1400}
        style={{ top: 20 }}
        bodyStyle={{ padding: 0 }}
      >
        {selectedCampaign && (
          <div>
            {/* Professional Modal Header */}
            <div style={{
              background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
              padding: '32px',
              borderRadius: '8px 8px 0 0',
              color: 'white'
            }}>
              <Row align="middle" justify="space-between">
                <Col flex={1}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <BarChartOutlined style={{ fontSize: '28px', color: 'white' }} />
                    </div>
                    <div>
                      <h2 style={{
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: 700,
                        margin: 0,
                        marginBottom: '4px'
                      }}>
                        {selectedCampaign.CampaignName || 'Campaign Details'}
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: 0.9 }}>
                        <span style={{ fontSize: '14px' }}>ID: {selectedCampaign._id}</span>
                        <span style={{ fontSize: '14px' }}>User: {selectedCampaign.userId?.name}</span>
                        <span style={{ fontSize: '14px' }}>Type: {getProfessionalTypeName(selectedCampaign.type)}</span>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col>
                  <Button
                    type="text"
                    onClick={closeModal}
                    style={{ color: 'white', fontSize: '16px' }}
                    icon={<CloseCircleOutlined />}
                  >
                    Close
                  </Button>
                </Col>
              </Row>
            </div>

            {/* Enhanced Statistics Grid */}
            <div style={{ padding: '32px' }}>
              <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                <Col xs={24} sm={12} md={8} lg={4}>
                  <Card
                    style={{
                      textAlign: 'center',
                      borderRadius: THEME_CONSTANTS.radius.lg,
                      border: `2px solid ${THEME_CONSTANTS.colors.primaryLight}`,
                      background: THEME_CONSTANTS.colors.primaryLight
                    }}
                    bodyStyle={{ padding: '20px 16px' }}
                  >
                    <div style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '32px', marginBottom: '8px' }}>
                      <UserOutlined />
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.primary, marginBottom: '4px' }}>
                      {selectedCampaign.cost || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600 }}>
                      Total Recipients
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8} lg={4}>
                  <Card
                    style={{
                      textAlign: 'center',
                      borderRadius: THEME_CONSTANTS.radius.lg,
                      border: `2px solid ${THEME_CONSTANTS.colors.successLight}`,
                      background: THEME_CONSTANTS.colors.successLight
                    }}
                    bodyStyle={{ padding: '20px 16px' }}
                  >
                    <div style={{ color: THEME_CONSTANTS.colors.success, fontSize: '32px', marginBottom: '8px' }}>
                      <SendOutlined />
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.success, marginBottom: '4px' }}>
                      {realTimeStats[selectedCampaign._id]?.sent || selectedCampaign.successCount || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600 }}>
                      Successfully Sent
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8} lg={4}>
                  <Card
                    style={{
                      textAlign: 'center',
                      borderRadius: THEME_CONSTANTS.radius.lg,
                      border: `2px solid ${THEME_CONSTANTS.colors.successLight}`,
                      background: THEME_CONSTANTS.colors.successLight
                    }}
                    bodyStyle={{ padding: '20px 16px' }}
                  >
                    <div style={{ color: THEME_CONSTANTS.colors.success, fontSize: '32px', marginBottom: '8px' }}>
                      <CheckCircleOutlined />
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.success, marginBottom: '4px' }}>
                      {realTimeStats[selectedCampaign._id]?.delivered || selectedCampaign.successCount || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600 }}>
                      Delivered
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8} lg={4}>
                  <Card
                    style={{
                      textAlign: 'center',
                      borderRadius: THEME_CONSTANTS.radius.lg,
                      border: `2px solid ${THEME_CONSTANTS.colors.successLight}`,
                      background: THEME_CONSTANTS.colors.successLight
                    }}
                    bodyStyle={{ padding: '20px 16px' }}
                  >
                    <div style={{ color: THEME_CONSTANTS.colors.success, fontSize: '32px', marginBottom: '8px' }}>
                      <EyeOutlined />
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.success, marginBottom: '4px' }}>
                      {realTimeStats[selectedCampaign._id]?.read || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600 }}>
                      Read
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8} lg={4}>
                  <Card
                    style={{
                      textAlign: 'center',
                      borderRadius: THEME_CONSTANTS.radius.lg,
                      border: '2px solid #fff1f0',
                      background: '#fff1f0'
                    }}
                    bodyStyle={{ padding: '20px 16px' }}
                  >
                    <div style={{ color: '#ff4d4f', fontSize: '32px', marginBottom: '8px' }}>
                      <CloseCircleOutlined />
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#ff4d4f', marginBottom: '4px' }}>
                      {realTimeStats[selectedCampaign._id]?.failed || selectedCampaign.failedCount || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600 }}>
                      Failed
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={12} md={8} lg={4}>
                  <Card
                    style={{
                      textAlign: 'center',
                      borderRadius: THEME_CONSTANTS.radius.lg,
                      border: `2px solid ${THEME_CONSTANTS.colors.primaryLight}`,
                      background: THEME_CONSTANTS.colors.primaryLight
                    }}
                    bodyStyle={{ padding: '20px 16px' }}
                  >
                    <div style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '32px', marginBottom: '8px' }}>
                      <MessageOutlined />
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: THEME_CONSTANTS.colors.primary, marginBottom: '4px' }}>
                      {realTimeStats[selectedCampaign._id]?.interactions || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600 }}>
                      Interactions
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Enhanced Message Details Table */}
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <MessageOutlined style={{ color: THEME_CONSTANTS.colors.primary }} />
                    <span style={{ fontSize: '18px', fontWeight: 700 }}>Message Details</span>
                    <Badge 
                      count={campaignMessages?.length || 0} 
                      style={{ backgroundColor: THEME_CONSTANTS.colors.primary }}
                    />
                  </div>
                }
                style={{
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                  boxShadow: THEME_CONSTANTS.shadow.sm
                }}
                bodyStyle={{ padding: 0 }}
              >
                <Table
                  dataSource={campaignMessages}
                  columns={[
                    {
                      title: 'Phone Number',
                      dataIndex: 'phoneNumber',
                      key: 'phone',
                      width: '15%',
                      render: (phone) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <PhoneOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '14px' }} />
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>{phone}</span>
                        </div>
                      ),
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      width: '12%',
                      render: (status) => {
                        const getStatusConfig = () => {
                          switch (status?.toLowerCase()) {
                            case 'delivered':
                              return { color: THEME_CONSTANTS.colors.success, bg: THEME_CONSTANTS.colors.successLight, icon: '✅' };
                            case 'failed':
                              return { color: '#ff4d4f', bg: '#fff1f0', icon: '❌' };
                            case 'sent':
                              return { color: THEME_CONSTANTS.colors.primary, bg: THEME_CONSTANTS.colors.primaryLight, icon: '📤' };
                            case 'pending':
                              return { color: THEME_CONSTANTS.colors.warning, bg: THEME_CONSTANTS.colors.warningLight, icon: '⏳' };
                            case 'read':
                              return { color: THEME_CONSTANTS.colors.success, bg: THEME_CONSTANTS.colors.successLight, icon: '👁️' };
                            case 'replied':
                              return { color: THEME_CONSTANTS.colors.primary, bg: THEME_CONSTANTS.colors.primaryLight, icon: '💬' };
                            case 'clicked':
                              return { color: THEME_CONSTANTS.colors.primary, bg: THEME_CONSTANTS.colors.primaryLight, icon: '💆' };
                            default:
                              return { color: THEME_CONSTANTS.colors.textSecondary, bg: '#f5f5f5', icon: '❓' };
                          }
                        };
                        const config = getStatusConfig();
                        return (
                          <Tag
                            style={{
                              color: config.color,
                              background: config.bg,
                              border: `1px solid ${config.color}`,
                              borderRadius: THEME_CONSTANTS.radius.sm,
                              fontWeight: 600,
                              fontSize: '11px',
                              padding: '4px 8px'
                            }}
                          >
                            {config.icon} {status || 'Unknown'}
                          </Tag>
                        );
                      },
                    },
                    {
                      title: 'Sent At',
                      dataIndex: 'sentAt',
                      key: 'sentAt',
                      width: '15%',
                      render: (date) => (
                        <div style={{ fontSize: '12px' }}>
                          {date ? (
                            <>
                              <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary }}>
                                {new Date(date).toLocaleDateString()}
                              </div>
                              <div style={{ color: THEME_CONSTANTS.colors.textSecondary }}>
                                {new Date(date).toLocaleTimeString()}
                              </div>
                            </>
                          ) : (
                            <span style={{ color: THEME_CONSTANTS.colors.textMuted }}>Not sent</span>
                          )}
                        </div>
                      ),
                    },
                    {
                      title: 'Delivered At',
                      dataIndex: 'deliveredAt',
                      key: 'deliveredAt',
                      width: '15%',
                      render: (date) => (
                        <div style={{ fontSize: '12px' }}>
                          {date ? (
                            <>
                              <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.success }}>
                                {new Date(date).toLocaleDateString()}
                              </div>
                              <div style={{ color: THEME_CONSTANTS.colors.textSecondary }}>
                                {new Date(date).toLocaleTimeString()}
                              </div>
                            </>
                          ) : (
                            <span style={{ color: THEME_CONSTANTS.colors.textMuted }}>Not delivered</span>
                          )}
                        </div>
                      ),
                    },
                    {
                      title: 'User Interactions',
                      dataIndex: 'interactions',
                      key: 'interactions',
                      width: '15%',
                      render: (interactions, record) => (
                        <div>
                          {interactions > 0 ? (
                            <div>
                              <Badge count={interactions} style={{ backgroundColor: THEME_CONSTANTS.colors.primary }} />
                              <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>
                                {record.clickedAt ? `Last: ${new Date(record.clickedAt).toLocaleTimeString()}` : 'No timestamp'}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: THEME_CONSTANTS.colors.textMuted, fontSize: '12px' }}>No interactions</span>
                          )}
                        </div>
                      ),
                    },
                    {
                      title: 'Response',
                      dataIndex: 'suggestionResponse',
                      key: 'response',
                      width: '18%',
                      render: (suggestionResponse, record) => (
                        <div>
                          {suggestionResponse ? (
                            <div style={{
                              background: THEME_CONSTANTS.colors.primaryLight,
                              padding: '8px 12px',
                              borderRadius: THEME_CONSTANTS.radius.sm,
                              fontSize: '12px',
                              border: `1px solid ${THEME_CONSTANTS.colors.primary}`
                            }}>
                              <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.primary, marginBottom: '4px' }}>
                                💬 User Response
                              </div>
                              <div style={{ color: THEME_CONSTANTS.colors.textPrimary }}>
                                "{suggestionResponse.plainText || record.userText || 'No text'}"
                              </div>
                              {record.clickedAt && (
                                <div style={{ color: THEME_CONSTANTS.colors.textSecondary, fontSize: '10px', marginTop: '4px' }}>
                                  {new Date(record.clickedAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                          ) : record.userText ? (
                            <div style={{
                              background: THEME_CONSTANTS.colors.primaryLight,
                              padding: '8px 12px',
                              borderRadius: THEME_CONSTANTS.radius.sm,
                              fontSize: '12px',
                              border: `1px solid ${THEME_CONSTANTS.colors.primary}`
                            }}>
                              <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.primary, marginBottom: '4px' }}>
                                💬 User Text
                              </div>
                              <div style={{ color: THEME_CONSTANTS.colors.textPrimary }}>
                                "{record.userText}"
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: THEME_CONSTANTS.colors.textMuted, fontSize: '12px' }}>No response</span>
                          )}
                        </div>
                      ),
                    },
                    {
                      title: 'Error Details',
                      dataIndex: 'errorMessage',
                      key: 'error',
                      width: '15%',
                      render: (error) => (
                        <div>
                          {error ? (
                            <Tooltip title={error} placement="topLeft">
                              <div style={{
                                background: '#fff1f0',
                                padding: '6px 10px',
                                borderRadius: THEME_CONSTANTS.radius.sm,
                                fontSize: '11px',
                                border: '1px solid #ff4d4f',
                                maxWidth: '150px'
                              }}>
                                <div style={{ fontWeight: 600, color: '#ff4d4f', marginBottom: '2px' }}>
                                  ⚠️ Error
                                </div>
                                <div style={{ 
                                  color: THEME_CONSTANTS.colors.textPrimary,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {error.length > 30 ? `${error.substring(0, 30)}...` : error}
                                </div>
                              </div>
                            </Tooltip>
                          ) : (
                            <span style={{ color: THEME_CONSTANTS.colors.textMuted, fontSize: '12px' }}>No errors</span>
                          )}
                        </div>
                      ),
                    },
                  ]}
                  rowKey="_id"
                  pagination={{
                    current: modalCurrentPage,
                    pageSize: 20,
                    total: campaignMessages?.length || 0,
                    onChange: (page) => {
                      setModalCurrentPage(page);
                      fetchCampaignMessagesHandler(selectedCampaign._id, page);
                    },
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} messages`,
                    style: { padding: '16px 24px' }
                  }}
                  scroll={{ x: 1200 }}
                  loading={loading.messages}
                  size="small"
                  style={{ borderRadius: THEME_CONSTANTS.radius.lg }}
                />
              </Card>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}