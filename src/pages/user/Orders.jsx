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
  deleteOrder
} from '../../redux/slices/ordersSlice';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { io } from 'socket.io-client';

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

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
  const [showModal, setShowModal] = useState(false);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [socket, setSocket] = useState(null);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [dateRange, setDateRange] = useState([null, null]);
  const [sortOrder, setSortOrder] = useState('newest');

  // Fetch orders on component mount and page change
  useEffect(() => {
    if (user?._id) {
      dispatch(fetchOrders({ userId: user._id, page: currentPage, limit: 10 }));
    }
  }, [dispatch, user?._id, currentPage]);

  // Auto-request stats when orders change
  useEffect(() => {
    if (Array.isArray(orders) && orders.length > 0 && socket?.connected) {
      orders.forEach(order => {
        if (order._id) {
          socket.emit('request_stats', order._id);
        }
      });
    }
  }, [orders, socket?.connected]);

  // Socket.IO setup for real-time updates
  useEffect(() => {
    if (!token || !user?._id) return;

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
        dispatch(setSocketConnected(true));
        // Request initial stats for all campaigns
        if (orders?.length > 0) {
          orders.forEach(order => {
            newSocket.emit('request_stats', order._id);
          });
        }
      });

      newSocket.on('connect_error', (error) => {
        console.warn('❌ Socket connection failed:', error.message);
        dispatch(setSocketConnected(false));
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        dispatch(setSocketConnected(false));
      });

      // Real-time stats updates
      newSocket.on('stats_update', (data) => {
        dispatch(updateRealTimeStats({
          campaignId: data.campaignId,
          stats: data.stats
        }));
      });

      // Campaign updates
      newSocket.on('campaign_update', (data) => {
        dispatch(updateRealTimeStats({
          campaignId: data.campaignId,
          stats: data
        }));
      });

      // Message status updates
      newSocket.on('message_status_update', (data) => {
        // Add to live events
        dispatch(addLiveEvent({
          id: Date.now() + Math.random(),
          campaignId: data.campaignId,
          messageId: data.messageId,
          phoneNumber: data.phoneNumber,
          status: data.status,
          timestamp: data.timestamp,
          eventType: data.eventType
        }));
      });

      // User interactions
      newSocket.on('user_interaction', (data) => {
        dispatch(addLiveEvent({
          id: Date.now() + Math.random(),
          campaignId: data.campaignId,
          messageId: data.messageId,
          phoneNumber: data.phoneNumber,
          status: 'interaction',
          interactionType: data.interactionType,
          text: data.text,
          timestamp: data.timestamp
        }));
      });

      setSocket(newSocket);

      return () => {
        console.log('🔌 Disconnecting socket');
        dispatch(setSocketConnected(false));
        newSocket.disconnect();
      };
    } catch (error) {
      console.warn('Failed to initialize socket connection:', error);
      dispatch(setSocketConnected(false));
    }
  }, [token, user?._id, dispatch]);

  const fetchAllCampaignStats = async () => {
    for (const order of orders) {
      if (order._id) {
        dispatch(fetchRealTimeCampaignStats({ campaignId: order._id }));
      }
    }
  };

  const getUniqueTypes = () => {
    if (!Array.isArray(orders)) return [];
    return [...new Set(orders.map((order) => order.type).filter(Boolean))];
  };

  const getUniqueCampaigns = () => {
    if (!Array.isArray(orders)) return [];
    return [...new Set(orders.map((order) => order.CampaignName).filter(Boolean))];
  };

  const getStatusBadge = (order) => {
    const campaignId = order._id;
    const liveStats = realTimeStats[campaignId];
    console.log(liveStats,":===========")
    
    // Use real-time stats if available, fallback to order data
    const successCount = liveStats?.delivered || order?.successCount || 0;
    const failedCount = liveStats?.failed || order?.failedCount || 0;
    const sentCount = liveStats?.sent || order?.successCount || 0;
    const totalMessages = liveStats?.total || order?.cost || 0;

    // Check campaign status first
    const isCompleted = order?.status === 'completed';
    const isProcessing = order?.status === 'processing' || order?.status === 'running';
    
    // If campaign is completed, show completed status
    if (isCompleted) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
          <div>
            <Tag
              color="#f6ffed"
              style={{
                color: THEME_CONSTANTS.colors.success,
                border: `1px solid ${THEME_CONSTANTS.colors.success}`,
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: THEME_CONSTANTS.radius.sm,
                fontSize: '11px'
              }}
            >
              Completed
            </Tag>
          </div>
        </div>
      );
    }

    // If no messages sent yet and campaign is not completed, show pending
    if (sentCount === 0 && !isCompleted) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
          <div>
            <Tag
              color="#fffbe6"
              style={{
                color: '#faad14',
                border: '1px solid #faad14',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: THEME_CONSTANTS.radius.sm,
                fontSize: '11px'
              }}
            >
              {isProcessing ? 'Processing' : 'Pending'}
            </Tag>
          </div>
        </div>
      );
    }

    // Show status for active campaigns
    const successRate = totalMessages > 0 ? (successCount / totalMessages) * 100 : 0;
    
    const getStatusText = () => {
      if (successRate >= 80) return 'Success';
      if (successRate > 0) return 'Partial';
      return 'Failed';
    };

    const getStatusColor = () => {
      if (successRate >= 80) return THEME_CONSTANTS.colors.success;
      if (successRate > 0) return '#fa8c16';
      return '#ff4d4f';
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
        <div>
          <Tag
            color={successRate >= 80 ? "#f6ffed" : successRate > 0 ? "#fff7e6" : "#fff1f0"}
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
        </div>
      </div>
    );
  };

  const modalOrder = selectedOrder;

  const viewOrderDetails = (order) => {
    dispatch(setSelectedOrder(order));
    setModalCurrentPage(1);
    setShowModal(true);
    // Fetch messages for the campaign
    if (order._id) {
      dispatch(fetchCampaignMessages({ campaignId: order._id, page: 1, limit: 20 }));
      // Join campaign room for real-time updates
      if (socket) {
        socket.emit('join_campaign', order._id);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    // Leave campaign room
    if (socket && selectedOrder?._id) {
      socket.emit('leave_campaign', selectedOrder._id);
    }
    dispatch(clearSelectedOrder());
  };

  // Filter and sort orders based on current filters
  const getFilteredOrders = () => {
    if (!Array.isArray(orders)) return [];
    
    let filtered = [...orders];
    
    // Search filter
    if (searchText) {
      filtered = filtered.filter(order => 
        order.CampaignName?.toLowerCase().includes(searchText.toLowerCase()) ||
        order._id?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => {
        const campaignId = order._id;
        const liveStats = realTimeStats[campaignId];
        const successCount = liveStats?.delivered || order?.successCount || 0;
        const failedCount = liveStats?.failed || order?.failedCount || 0;
        const totalMessages = liveStats?.total || order?.cost || 0;
        const successRate = totalMessages > 0 ? (successCount / totalMessages) * 100 : 0;
        
        switch (statusFilter) {
          case 'completed':
            return order?.status === 'completed';
          case 'processing':
            return order?.status === 'processing' || order?.status === 'running';
          case 'failed':
            return successRate === 0 && totalMessages > 0;
          case 'pending':
            return successCount === 0 && !order?.status === 'completed';
          default:
            return true;
        }
      });
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(order => order.type === typeFilter);
    }
    
    // Campaign filter
    if (campaignFilter !== 'all') {
      filtered = filtered.filter(order => order.CampaignName === campaignFilter);
    }
    
    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(order => {
        const orderDate = dayjs(order.createdAt);
        return orderDate.isAfter(dateRange[0].startOf('day')) && 
               orderDate.isBefore(dateRange[1].endOf('day'));
      });
    }
    
    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return filtered;
  };

  const filteredOrders = getFilteredOrders();

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

  const exportToExcel = () => {
    try {
      if (!orders || orders?.length === 0) {
        toast.error('No data to export');
        return;
      }

      const exportData = orders?.map((order, idx) => {
        const successCount = order?.successCount || 0;
        const failedCount = order?.failedCount || 0;
        const totalRecipients = order?.cost || 0;

        return {
          'ID': `#${(currentPage - 1) * 10 + idx + 1}`,
          'Campaign Name': order?.CampaignName || 'N/A',
          'Message Type': order?.type || 'N/A',
          'Total Recipients': totalRecipients,
          'Successful': successCount,
          'Failed': failedCount,
          'Date': new Date(order.createdAt).toLocaleDateString(),
          'Time': new Date(order.createdAt).toLocaleTimeString(),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Campaign Reports');

      XLSX.writeFile(workbook, `campaign-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
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
          #{(currentPage - 1) * 10 + index + 1}
        </span>
      ),
      width: '10%',
    },
    {
      title: 'Campaign Name',
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
      width: '25%',
    },
    {
      title: 'Message Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag
          style={{
            background: type === 'SMS' ? '#e6f7ff' : '#f6f8fb',
            color: type === 'SMS' ? THEME_CONSTANTS.colors.primary : '#667085',
            border: 'none',
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: THEME_CONSTANTS.radius.sm,
            fontSize: '12px',
          }}
        >
          {type}
        </Tag>
      ),
      width: '12%',
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
      width: '12%',
    },
    {title: 'Success / Failed',
      key: 'results',
      render: (text, record) => {
        const campaignId = record._id;
        const liveStats = realTimeStats[campaignId];
        const successCount = liveStats?.delivered || record?.successCount || 0;
        const failedCount = liveStats?.failed || record?.failedCount || 0;
        const totalMessages = liveStats?.total || record?.cost || 0;
        
        // Calculate delivery rate
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
      title: 'Date Created',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => (
        <Tooltip title={new Date(date).toLocaleString()}>
          <span style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>
            {new Date(date).toLocaleDateString()}
          </span>
        </Tooltip>
      ),
      width: '14%',
      responsive: ['md'],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => viewOrderDetails(record)}
            style={{ color: THEME_CONSTANTS.colors.primary }}
            title="View Details"
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => deleteOrderHandler(record._id)}
            style={{ color: '#ff4d4f' }}
            title="Delete Campaign"
          />
        </Space>
      ),
      width: '10%',
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
                      <BarChartOutlined style={{
                        color: THEME_CONSTANTS.colors.primary,
                        fontSize: '32px'
                      }} />
                    </div>
                  </Col>
                  <Col xs={24} sm={20} md={21} lg={21}>
                    <div style={{ textAlign: { xs: 'center', sm: 'left' } }}>
                      <h1 style={{
                        fontSize: THEME_CONSTANTS.typography.h1.size,
                        fontWeight: THEME_CONSTANTS.typography.h1.weight,
                        color: THEME_CONSTANTS.colors.text,
                        marginBottom: THEME_CONSTANTS.spacing.sm,
                        lineHeight: THEME_CONSTANTS.typography.h1.lineHeight,
                        fontFamily: THEME_CONSTANTS.typography.fontFamily,
                        letterSpacing: '-0.02em',
                        '@media (max-width: 768px)': {
                          fontSize: THEME_CONSTANTS.typography.h2.size,
                        }
                      }}>
                        Campaign Reports 📊
                      </h1>
                      <p style={{
                        color: THEME_CONSTANTS.colors.textSecondary,
                        fontSize: THEME_CONSTANTS.typography.body.size,
                        fontWeight: 500,
                        lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                        margin: 0,
                        fontFamily: THEME_CONSTANTS.typography.fontFamily,
                        letterSpacing: '-0.01em'
                      }}>
                        Manage and track all your message campaigns with detailed insights and performance metrics.
                      </p>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col xs={24} lg={6}>
                <div style={{ textAlign: { xs: 'center', lg: 'right' } }}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={exportToExcel}
                      style={{
                        background: THEME_CONSTANTS.colors.primary,
                        borderColor: THEME_CONSTANTS.colors.primary,
                        height: '44px',
                        padding: '0 24px',
                        fontSize: '15px',
                        fontWeight: 600,
                        borderRadius: '8px'
                      }}
                    >
                      Export Report
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => dispatch(fetchOrders({ userId: user._id, page: currentPage, limit: 10 }))}
                      loading={loading.orders}
                      style={{
                        height: '44px',
                        padding: '0 20px',
                        fontSize: '15px',
                        fontWeight: 500,
                        borderRadius: '8px'
                      }}
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
        {/* Summary Stats with Real-time Data */}
        {Array.isArray(orders) && orders.length > 0 && (
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
                  value={orders?.length}
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
                         orders?.reduce((acc, order) => acc + (order?.successCount || 0), 0)}
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
                         orders?.reduce((acc, order) => acc + (order?.failedCount || 0), 0)}
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
                                           orders?.reduce((acc, order) => acc + (order?.successCount || 0), 0);
                      const totalSent = Object.values(realTimeStats).reduce((acc, stats) => acc + (stats?.sent || 0), 0) || 
                                      orders?.reduce((acc, order) => acc + ((order?.successCount || 0) + (order?.failedCount || 0)), 0);
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
            borderRadius: '16px',
            border: 'none',
            background: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            marginBottom: '32px',
          }}
          bodyStyle={{ padding: '32px' }}
        >
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1a202c', margin: 0, marginBottom: '8px' }}>
              🔍 Filter & Search
            </h3>
            <p style={{ fontSize: '14px', color: '#718096', margin: 0 }}>
              Use filters to find specific campaigns and analyze performance
            </p>
          </div>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#4a5568' }}>Search Campaigns</label>
              </div>
              <Input
                placeholder="Search by name or ID..."
                prefix={<SearchOutlined style={{ color: '#a0aec0' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  padding: '8px 12px',
                  fontSize: '14px'
                }}
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#4a5568' }}>Status Filter</label>
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
                  { label: 'Pending', value: 'pending' },
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#4a5568' }}>Message Type</label>
              </div>
              <Select
                value={typeFilter}
                onChange={setTypeFilter}
                style={{ width: '100%' }}
                size="large"
                options={[
                  { label: 'All Types', value: 'all' },
                  ...getUniqueTypes().map((type) => ({ label: type, value: type })),
                ]}
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#4a5568' }}>Campaign Name</label>
              </div>
              <Select
                value={campaignFilter}
                onChange={setCampaignFilter}
                style={{ width: '100%' }}
                size="large"
                options={[
                  { label: 'All Campaigns', value: 'all' },
                  ...getUniqueCampaigns().map((campaign) => ({
                    label: campaign,
                    value: campaign,
                  })),
                ]}
              />
            </Col>

            <Col xs={24} md={12}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#4a5568' }}>Date Range</label>
              </div>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                style={{ width: '100%', height: '40px', borderRadius: '8px' }}
                format="DD/MM/YYYY"
              />
            </Col>

            <Col xs={24} md={12}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#4a5568' }}>Sort Order</label>
              </div>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                style={{ 
                  width: '100%', 
                  height: '40px',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  background: sortOrder === 'newest' ? '#667eea' : 'white',
                  color: sortOrder === 'newest' ? 'white' : '#4a5568'
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
            borderRadius: '16px',
            border: 'none',
            background: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ padding: '32px 32px 24px 32px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1a202c', margin: 0, marginBottom: '4px' }}>
                  📈 Campaign Overview
                </h3>
                <p style={{ fontSize: '14px', color: '#718096', margin: 0 }}>
                  {filteredOrders.length} of {orders?.length || 0} campaigns shown
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Badge 
                  status={socketConnected ? "processing" : "error"} 
                  text={socketConnected ? "Live Data" : "Offline"}
                  style={{ fontSize: '12px' }}
                />
              </div>
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
                rowKey={(record) => `campaign-${record._id}-${record.createdAt}`}
                pagination={{
                  current: currentPage,
                  pageSize: 10,
                  total: filteredOrders.length,
                  onChange: (page) => {
                    setCurrentPage(page);
                  },
                  showSizeChanger: false,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} campaigns`,
                  style: { padding: '16px 32px' }
                }}
                scroll={{ 
                  x: 1200, 
                  y: 600 
                }}
                sticky={{
                  offsetHeader: 0,
                  offsetScroll: 0,
                  getContainer: () => window,
                }}
                size="middle"
                bordered={false}
                style={{ 
                  '.ant-table-thead > tr > th': {
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    background: '#fafafa',
                    borderBottom: '2px solid #f0f0f0',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#4a5568',
                    padding: '16px 12px'
                  },
                  '.ant-table-tbody > tr': {
                    transition: 'all 0.2s ease'
                  },
                  '.ant-table-tbody > tr:hover': {
                    background: '#f8fafc',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  },
                  '.ant-table-tbody > tr > td': {
                    padding: '16px 12px',
                    borderBottom: '1px solid #f1f5f9'
                  }
                }}
              />
            </>
          )}
        </Card>
        </div>
      </div>

      {/* Professional Modal for Campaign Details */}
      <Modal
        title={null}
        open={showModal}
        onCancel={closeModal}
        width={1200}
        footer={null}
        bodyStyle={{ padding: 0 }}
        style={{ top: 20 }}
        className="campaign-details-modal"
      >
        {modalOrder && (
          <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', minHeight: '100%' }}>
            {/* Enhanced Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '32px',
              borderRadius: '12px 12px 0 0',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
              <Row align="middle" justify="space-between" style={{ position: 'relative', zIndex: 1 }}>
                <Col>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <BarChartOutlined style={{ fontSize: '32px', color: 'white' }} />
                    </div>
                    <div>
                      <h2 style={{ color: 'white', margin: 0, fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
                        Campaign Analytics
                      </h2>
                      <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>
                        {selectedOrder?.CampaignName}
                      </div>
                      <Tag style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', fontWeight: 600 }}>
                        {selectedOrder?.type}
                      </Tag>
                    </div>
                  </div>
                </Col>
                <Col>
                  <div style={{ textAlign: 'right', color: 'white' }}>
                    <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>Created</div>
                    <div style={{ fontSize: '18px', fontWeight: 600 }}>
                      {new Date(selectedOrder?.createdAt).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>
                      {new Date(selectedOrder?.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Professional Stats Grid */}
            <div style={{ padding: '32px', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
              {(() => {
                const campaignId = selectedOrder?._id;
                const liveStats = realTimeStats[campaignId] || {};
                
                return (
                  <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
                    <Col xs={12} sm={8} md={4}>
                      <Card style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '16px',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                        height: '120px',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }} bodyStyle={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '70px', height: '70px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                        <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                        <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: 'white' }}>
                          {liveStats.total || modalOrder?.cost || 0}
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Total Recipients</div>
                      </Card>
                    </Col>

                    <Col xs={12} sm={8} md={4}>
                      <Card style={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        border: 'none',
                        borderRadius: '16px',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(79, 172, 254, 0.3)',
                        height: '120px',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }} bodyStyle={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '70px', height: '70px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                        <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                        <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: 'white' }}>
                          {liveStats.sent || modalOrder?.successCount || 0}
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Successfully Sent</div>
                      </Card>
                    </Col>

                    <Col xs={12} sm={8} md={4}>
                      <Card style={{
                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                        border: 'none',
                        borderRadius: '16px',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(17, 153, 142, 0.3)',
                        height: '120px',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }} bodyStyle={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '70px', height: '70px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                        <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                        <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: 'white' }}>
                          {liveStats.delivered || modalOrder?.totalDelivered || 0}
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Delivered</div>
                      </Card>
                    </Col>

                    <Col xs={12} sm={8} md={4}>
                      <Card style={{
                        background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                        border: 'none',
                        borderRadius: '16px',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(168, 237, 234, 0.2)',
                        height: '120px',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }} bodyStyle={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '70px', height: '70px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }} />
                        <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                        <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: '#2d3748' }}>
                          {liveStats.read || modalOrder?.totalRead || 0}
                        </div>
                        <div style={{ fontSize: '13px', color: '#4a5568', fontWeight: 500 }}>Read</div>
                      </Card>
                    </Col>

                    <Col xs={12} sm={8} md={4}>
                      <Card style={{
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                        border: 'none',
                        borderRadius: '16px',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(255, 107, 107, 0.3)',
                        height: '120px',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }} bodyStyle={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '70px', height: '70px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                        <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                        <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: 'white' }}>
                          {liveStats.failed || modalOrder?.failedCount || 0}
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>Failed</div>
                      </Card>
                    </Col>

                    <Col xs={12} sm={8} md={4}>
                      <Card style={{
                        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                        border: 'none',
                        borderRadius: '16px',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(255, 236, 210, 0.2)',
                        height: '120px',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }} bodyStyle={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '70px', height: '70px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }} />
                        <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                        <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: '#2d3748' }}>
                          {liveStats.interactions || modalOrder?.userClickCount || 0}
                        </div>
                        <div style={{ fontSize: '13px', color: '#4a5568', fontWeight: 500 }}>Interactions</div>
                      </Card>
                    </Col>
                  </Row>
                );
              })()}

              {/* Enhanced Message Details Table */}
              <Card style={{
                background: 'white',
                border: 'none',
                borderRadius: '16px',
                marginBottom: '24px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
              }} bodyStyle={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#1a202c', marginBottom: '4px' }}>
                      📋 Message Details
                    </h3>
                    <p style={{ fontSize: '14px', color: '#718096', margin: 0 }}>
                      {messagesPagination?.total || 0} total messages • Real-time tracking
                    </p>
                  </div>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={() => dispatch(fetchCampaignMessages({ campaignId: selectedOrder._id, page: modalCurrentPage, limit: 20 }))}
                    loading={loading.messages}
                    style={{
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    Refresh Data
                  </Button>
                </div>
                
                {/* Debug Info */}
                {process.env.NODE_ENV === 'development' && (
                  <div style={{ marginBottom: '16px', padding: '8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>
                    Debug: Messages Array Length: {campaignMessages?.length || 0} | 
                    Loading: {loading.messages ? 'Yes' : 'No'} | 
                    Error: {error?.messages || 'None'}
                  </div>
                )}
                
                <Table
                  dataSource={Array.isArray(campaignMessages) ? campaignMessages : []}
                  rowKey={(record) => `msg-${record._id}-${record.phoneNumber}-${record.createdAt}`}
                  loading={loading.messages}
                  pagination={{
                    current: modalCurrentPage,
                    pageSize: 20,
                    total: messagesPagination?.total || 0,
                    onChange: (page) => {
                      setModalCurrentPage(page);
                      dispatch(fetchCampaignMessages({ campaignId: selectedOrder._id, page, limit: 20 }));
                    },
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} messages`,
                    size: 'small'
                  }}
                  scroll={{ 
                    x: 1400, 
                    y: 400 
                  }}
                  sticky={{
                    offsetHeader: 0,
                    offsetScroll: 0,
                  }}
                  size="small"
                  bordered
                  locale={{
                    emptyText: campaignMessages === null ? 'Loading messages...' : 'No messages found'
                  }}
                  style={{
                    '.ant-table-thead > tr > th': {
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      background: '#fafafa',
                      fontWeight: 600
                    },
                    '.ant-table-tbody > tr:hover': {
                      background: '#f5f5f5'
                    }
                  }}
                  columns={[
                    {
                      title: 'Phone Number',
                      dataIndex: 'phoneNumber',
                      key: 'phoneNumber',
                      width: 140,
                      render: (phone) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <PhoneOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '12px' }} />
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>{phone}</span>
                        </div>
                      )
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      width: 100,
                      render: (status) => {
                        const statusConfig = {
                          sent: { color: '#1890ff', icon: <SendOutlined /> },
                          delivered: { color: '#52c41a', icon: <CheckCircleOutlined /> },
                          read: { color: '#722ed1', icon: <EyeOutlined /> },
                          replied: { color: '#13c2c2', icon: <MessageOutlined /> },
                          failed: { color: '#ff4d4f', icon: <CloseCircleOutlined /> },
                          queued: { color: '#faad14', icon: <ClockCircleOutlined /> }
                        };
                        const config = statusConfig[status] || { color: '#8c8c8c', icon: null };
                        return (
                          <Tag color={config.color} icon={config.icon} style={{ fontSize: '11px', fontWeight: 600 }}>
                            {status?.toUpperCase()}
                          </Tag>
                        );
                      }
                    },
                    {
                      title: 'Template',
                      dataIndex: 'templateType',
                      key: 'templateType',
                      width: 110,
                      render: (type) => (
                        <Tag style={{ fontSize: '11px', background: '#f0f5ff', color: '#1890ff', border: 'none' }}>
                          {type}
                        </Tag>
                      )
                    },
                    {
                      title: 'Sent',
                      dataIndex: 'sentAt',
                      key: 'sentAt',
                      width: 90,
                      render: (date) => date ? (
                        <Tooltip title={new Date(date).toLocaleString()}>
                          <span style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>
                            {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </Tooltip>
                      ) : <span style={{ color: '#d9d9d9' }}>-</span>
                    },
                    {
                      title: 'Delivered',
                      dataIndex: 'deliveredAt',
                      key: 'deliveredAt',
                      width: 90,
                      render: (date) => date ? (
                        <Tooltip title={new Date(date).toLocaleString()}>
                          <span style={{ fontSize: '12px', color: '#52c41a', fontWeight: 600 }}>
                            {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </Tooltip>
                      ) : <span style={{ color: '#d9d9d9' }}>-</span>
                    },
                    {
                      title: 'Read',
                      dataIndex: 'readAt',
                      key: 'readAt',
                      width: 90,
                      render: (date) => date ? (
                        <Tooltip title={new Date(date).toLocaleString()}>
                          <span style={{ fontSize: '12px', color: '#722ed1', fontWeight: 600 }}>
                            {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </Tooltip>
                      ) : <span style={{ color: '#d9d9d9' }}>-</span>
                    },
                    {
                      title: 'Interactions',
                      key: 'engagement',
                      width: 110,
                      render: (_, record) => (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {record.interactions > 0 && (
                            <Tag color="cyan" style={{ fontSize: '11px', margin: 0 }}>
                              🖱️ {record.interactions}
                            </Tag>
                          )}
                          {record.replies > 0 && (
                            <Tag color="purple" style={{ fontSize: '11px', margin: 0 }}>
                              💬 {record.replies}
                            </Tag>
                          )}
                          {record.interactions === 0 && record.replies === 0 && (
                            <span style={{ color: '#d9d9d9', fontSize: '12px' }}>-</span>
                          )}
                        </div>
                      )
                    },
                    {
                      title: 'User Response',
                      key: 'response',
                      width: 200,
                      render: (_, record) => {
                        if (record.userText) {
                          return (
                            <Tooltip title={record.userText}>
                              <div style={{ 
                                fontSize: '12px', 
                                color: THEME_CONSTANTS.colors.text,
                                maxWidth: '180px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                💬 "{record.userText}"
                              </div>
                            </Tooltip>
                          );
                        }
                        if (record.clickedAction) {
                          return (
                            <div style={{ fontSize: '12px', color: '#1890ff' }}>
                              🖱️ Clicked: {record.clickedAction}
                            </div>
                          );
                        }
                        if (record.suggestionResponse?.plainText) {
                          return (
                            <Tooltip title={record.suggestionResponse.plainText}>
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#722ed1',
                                maxWidth: '180px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                ✅ {record.suggestionResponse.plainText}
                              </div>
                            </Tooltip>
                          );
                        }
                        return <span style={{ color: '#d9d9d9', fontSize: '12px' }}>-</span>;
                      }
                    },
                    {
                      title: 'Error Details',
                      key: 'errorDetails',
                      width: 200,
                      render: (_, record) => {
                        if (record.status === 'failed') {
                          const errorMsg = record.errorMessage || record.errorCode || 'Unknown error';
                          const failedAt = record.failedAt ? new Date(record.failedAt).toLocaleString() : 'Unknown time';
                          
                          return (
                            <div>
                              <Tooltip title={`Error: ${errorMsg} | Failed at: ${failedAt}`}>
                                <Tag color="red" style={{ fontSize: '11px', marginBottom: '4px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  ⚠️ {errorMsg}
                                </Tag>
                              </Tooltip>
                              <div style={{ fontSize: '10px', color: '#999' }}>
                                {new Date(record.failedAt || record.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          );
                        }
                        return <span style={{ color: '#d9d9d9', fontSize: '12px' }}>-</span>;
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