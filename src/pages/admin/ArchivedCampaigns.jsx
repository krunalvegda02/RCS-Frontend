import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Tag, Space, Modal, Breadcrumb, Spin, Empty, message, DatePicker, Select, Row, Col, Statistic } from 'antd';
import { DownloadOutlined, UserOutlined, FolderOpenOutlined, SearchOutlined, HomeOutlined, CalendarOutlined, BarChartOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import { _get } from '../../helper/apiClient.jsx';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ArchivedCampaigns() {
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useSelector(state => state.auth);
  
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [quickFilter, setQuickFilter] = useState('all');
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalMessages: 0,
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    totalPending: 0,
    totalExpired: 0,
    uniqueUsers: 0,
    deliveryRate: 0,
    sentRate: 0
  });

  // Check authentication and admin role
  useEffect(() => {
    if (!isAuthenticated || !token) {
      message.error('Please login to access this page');
      navigate('/login');
      return;
    }
    
    if (user?.role !== 'ADMIN') {
      message.error('Admin access required');
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, token, user, navigate]);

  useEffect(() => {
    // Only fetch if user is authenticated and is admin
    if (isAuthenticated && token && user?.role === 'ADMIN') {
      fetchUsers();
      fetchStats();
    }
  }, [isAuthenticated, token, user]);

  useEffect(() => {
    // Only fetch if user is authenticated and is admin
    if (isAuthenticated && token && user?.role === 'ADMIN') {
      fetchStats();
      fetchUsers();
    }
  }, [dateRange, quickFilter, isAuthenticated, token, user]);

  useEffect(() => {
    // Refresh campaigns when modal is open and filters change
    if (isAuthenticated && token && user?.role === 'ADMIN' && showModal && selectedUser) {
      fetchUserCampaigns(selectedUser._id);
    }
  }, [dateRange, quickFilter, showModal, selectedUser, isAuthenticated, token, user]);

  const getDateRangeFromFilter = (filter) => {
    const now = dayjs();
    switch (filter) {
      case 'today':
        return [now.startOf('day'), now.endOf('day')];
      case 'yesterday':
        return [now.subtract(1, 'day').startOf('day'), now.subtract(1, 'day').endOf('day')];
      case 'thisWeek':
        return [now.startOf('week'), now.endOf('week')];
      case 'lastWeek':
        return [now.subtract(1, 'week').startOf('week'), now.subtract(1, 'week').endOf('week')];
      case 'thisMonth':
        return [now.startOf('month'), now.endOf('month')];
      case 'lastMonth':
        return [now.subtract(1, 'month').startOf('month'), now.subtract(1, 'month').endOf('month')];
      case 'last3Months':
        return [now.subtract(2, 'month').startOf('month'), now.endOf('month')];
      case 'last6Months':
        return [now.subtract(5, 'month').startOf('month'), now.endOf('month')];
      case 'thisYear':
        return [now.startOf('year'), now.endOf('year')];
      case 'lastYear':
        return [now.subtract(1, 'year').startOf('year'), now.subtract(1, 'year').endOf('year')];
      default:
        return [];
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      let params = {};
      
      if (quickFilter !== 'all' && quickFilter !== 'custom') {
        const range = getDateRangeFromFilter(quickFilter);
        if (range.length === 2) {
          params.startDate = range[0].toISOString();
          params.endDate = range[1].toISOString();
        }
      } else if (quickFilter === 'custom' && dateRange.length === 2) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }

      const response = await _get('archived-campaigns/stats', params);
      setStats(response.data.data || {});
    } catch (error) {
      console.error('Fetch stats error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load statistics';
      message.error(errorMessage);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let params = {};
      
      // Apply same date filters to users list
      if (quickFilter !== 'all' && quickFilter !== 'custom') {
        const range = getDateRangeFromFilter(quickFilter);
        if (range.length === 2) {
          params.startDate = range[0].toISOString();
          params.endDate = range[1].toISOString();
        }
      } else if (quickFilter === 'custom' && dateRange.length === 2) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }
      
      const response = await _get('archived-campaigns/users', params);
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Fetch users error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load users';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFilterChange = (value) => {
    setQuickFilter(value);
    if (value !== 'custom') {
      setDateRange([]);
    }
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
      setQuickFilter('custom');
    } else {
      setDateRange([]);
      setQuickFilter('all');
    }
  };

  const fetchUserCampaigns = async (userId) => {
    setCampaignsLoading(true);
    try {
      let params = { userId, limit: 100 };
      
      console.log('[ArchivedCampaigns] Fetching campaigns for userId:', userId);
      
      // Apply date filters to campaigns as well
      if (quickFilter !== 'all' && quickFilter !== 'custom') {
        const range = getDateRangeFromFilter(quickFilter);
        if (range.length === 2) {
          params.startDate = range[0].toISOString();
          params.endDate = range[1].toISOString();
        }
      } else if (quickFilter === 'custom' && dateRange.length === 2) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }
      
      console.log('[ArchivedCampaigns] Request params:', params);
      
      const response = await _get('archived-campaigns', params);
      console.log('[ArchivedCampaigns] Response:', response.data.data?.length, 'campaigns');
      setCampaigns(response.data.data || []);
    } catch (error) {
      console.error('Fetch campaigns error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load campaigns';
      message.error(errorMessage);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const handleViewCampaigns = (user) => {
    setSelectedUser(user);
    setShowModal(true);
    fetchUserCampaigns(user._id);
  };

  const filteredUsers = users.filter(user =>
    user.userName?.toLowerCase().includes(searchText.toLowerCase()) ||
    user.userEmail?.toLowerCase().includes(searchText.toLowerCase())
  );

  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: THEME_CONSTANTS.colors.primaryLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: THEME_CONSTANTS.colors.primary,
            fontWeight: 700
          }}>
            {record.userName?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.text }}>{record.userName}</div>
            <div style={{ fontSize: 12, color: THEME_CONSTANTS.colors.textSecondary }}>{record.userEmail}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Archived Campaigns',
      dataIndex: 'totalArchived',
      key: 'count',
      align: 'center',
      render: (count) => (
        <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px', fontWeight: 600 }}>
          {count}
        </Tag>
      ),
    },
    {
      title: 'Last Campaign Created',
      dataIndex: 'lastCampaignCreated',
      key: 'lastCreated',
      render: (date) => date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<FolderOpenOutlined />}
          onClick={() => handleViewCampaigns(record)}
        >
          View Campaigns
        </Button>
      ),
    },
  ];

  const campaignColumns = [
    {
      title: 'Campaign Name',
      dataIndex: 'campaignName',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: 11, color: THEME_CONSTANTS.colors.textSecondary }}>
            ID: {record.campaignId.slice(-8)}
          </div>
        </div>
      ),
    },
    {
      title: 'Bot',
      dataIndex: 'botId',
      key: 'bot',
      align: 'center',
      render: (botId) => <Tag>{botId}</Tag>,
    },
    {
      title: 'Stats',
      key: 'stats',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 12 }}>Total: {record.stats?.total || 0}</span>
          <span style={{ fontSize: 12, color: THEME_CONSTANTS.colors.success }}>
            Delivered: {record.stats?.delivered || 0}
          </span>
          <span style={{ fontSize: 12, color: THEME_CONSTANTS.colors.danger }}>
            Failed: {record.stats?.failed || 0}
          </span>
        </Space>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'campaignCreatedAt',
      key: 'created',
      render: (date, record) => {
        if (!date) {
          return <span style={{ fontSize: 11, color: THEME_CONSTANTS.colors.textSecondary }}>N/A</span>;
        }
        
        const createdDate = new Date(date);
        const archivedDate = new Date(record.archivedAt);
        const diffInHours = Math.round((archivedDate - createdDate) / (1000 * 60 * 60));
        
        let durationText = '';
        if (diffInHours < 24) {
          durationText = `${diffInHours}h`;
        } else {
          const diffInDays = Math.round(diffInHours / 24);
          durationText = `${diffInDays}d`;
        }
        
        return (
          <div>
            <div style={{ fontSize: 13 }}>
              {createdDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
            </div>
            <div style={{ fontSize: 11, color: THEME_CONSTANTS.colors.textSecondary }}>
              {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: 10, color: THEME_CONSTANTS.colors.primary, fontWeight: 600 }}>
              Duration: {durationText}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Archived Date',
      dataIndex: 'archivedAt',
      key: 'archived',
      render: (date) => (
        <div>
          <div style={{ fontSize: 13 }}>
            {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
          </div>
          <div style={{ fontSize: 11, color: THEME_CONSTANTS.colors.textSecondary }}>
            {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      title: 'Download',
      key: 'download',
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => window.open(record.excelUrl, '_blank')}
        >
          Excel
        </Button>
      ),
    },
  ];

  return (
    <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh', padding: THEME_CONSTANTS.spacing.xl }}>
      <div style={{ maxWidth: THEME_CONSTANTS.layout.maxContentWidth, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl, paddingBottom: THEME_CONSTANTS.spacing.xl, borderBottom: `2px solid ${THEME_CONSTANTS.colors.primaryLight}` }}>
          <Breadcrumb style={{ marginBottom: THEME_CONSTANTS.spacing.md }}>
            <Breadcrumb.Item><HomeOutlined /> Admin</Breadcrumb.Item>
            <Breadcrumb.Item>Archived Campaigns</Breadcrumb.Item>
          </Breadcrumb>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64,
              height: 64,
              background: THEME_CONSTANTS.colors.primaryLight,
              borderRadius: THEME_CONSTANTS.radius.xl,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FolderOpenOutlined style={{ fontSize: 32, color: THEME_CONSTANTS.colors.primary }} />
            </div>
            <div>
              <h1 style={{ fontSize: THEME_CONSTANTS.typography.h1.size, fontWeight: 700, margin: 0 }}>
                Archived Campaigns
              </h1>
              <p style={{ color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>
                View campaigns filtered by creation date and download archived data
                {quickFilter !== 'all' && (
                  <span style={{ color: THEME_CONSTANTS.colors.primary, fontWeight: 600 }}>
                    {' '}• Showing campaigns created {quickFilter === 'custom' ? 'in custom range' : 
                      quickFilter.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: THEME_CONSTANTS.radius.lg }}>
              <Statistic
                title="Total Campaigns"
                value={stats.totalCampaigns}
                prefix={<FolderOpenOutlined style={{ color: THEME_CONSTANTS.colors.primary }} />}
                loading={statsLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: THEME_CONSTANTS.radius.lg }}>
              <Statistic
                title="Total Messages"
                value={stats.totalMessages}
                formatter={(value) => value.toLocaleString()}
                prefix={<SendOutlined style={{ color: THEME_CONSTANTS.colors.info }} />}
                loading={statsLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: THEME_CONSTANTS.radius.lg }}>
              <Statistic
                title="Sent Messages"
                value={stats.totalSent}
                formatter={(value) => value.toLocaleString()}
                prefix={<SendOutlined style={{ color: THEME_CONSTANTS.colors.warning }} />}
                loading={statsLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: THEME_CONSTANTS.radius.lg }}>
              <Statistic
                title="Sent Rate"
                value={stats.sentRate}
                precision={1}
                suffix="%"
                prefix={<BarChartOutlined style={{ color: THEME_CONSTANTS.colors.info }} />}
                loading={statsLoading}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: THEME_CONSTANTS.radius.lg }}>
              <Statistic
                title="Delivered"
                value={stats.totalDelivered}
                formatter={(value) => value.toLocaleString()}
                prefix={<CheckCircleOutlined style={{ color: THEME_CONSTANTS.colors.success }} />}
                loading={statsLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: THEME_CONSTANTS.radius.lg }}>
              <Statistic
                title="Delivery Rate"
                value={stats.deliveryRate}
                precision={1}
                suffix="%"
                prefix={<BarChartOutlined style={{ color: THEME_CONSTANTS.colors.success }} />}
                loading={statsLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: THEME_CONSTANTS.radius.lg }}>
              <Statistic
                title="Failed"
                value={stats.totalFailed}
                formatter={(value) => value.toLocaleString()}
                prefix={<CloseCircleOutlined style={{ color: THEME_CONSTANTS.colors.danger }} />}
                loading={statsLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card style={{ borderRadius: THEME_CONSTANTS.radius.lg }}>
              <Statistic
                title="Unique Users"
                value={stats.uniqueUsers}
                prefix={<UserOutlined style={{ color: THEME_CONSTANTS.colors.primary }} />}
                loading={statsLoading}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8} md={8}>
            <Card style={{ borderRadius: THEME_CONSTANTS.radius.lg }}>
              <Statistic
                title="Pending"
                value={stats.totalPending}
                formatter={(value) => value.toLocaleString()}
                prefix={<ClockCircleOutlined style={{ color: THEME_CONSTANTS.colors.warning }} />}
                loading={statsLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} md={8}>
            <Card style={{ borderRadius: THEME_CONSTANTS.radius.lg }}>
              <Statistic
                title="Expired"
                value={stats.totalExpired}
                formatter={(value) => value.toLocaleString()}
                prefix={<ClockCircleOutlined style={{ color: THEME_CONSTANTS.colors.textSecondary }} />}
                loading={statsLoading}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 24, borderRadius: THEME_CONSTANTS.radius.lg }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Space>
                <CalendarOutlined style={{ color: THEME_CONSTANTS.colors.primary }} />
                <span style={{ fontWeight: 600 }}>Filter by Creation Date:</span>
                <Select
                  value={quickFilter}
                  onChange={handleQuickFilterChange}
                  style={{ width: 150 }}
                >
                  <Option value="all">All Time</Option>
                  <Option value="thisMonth">This Month</Option>
                  <Option value="lastMonth">    Last Month</Option>
                  <Option value="last3Months">Last 3 Months</Option>
                  <Option value="last6Months">Last 6 Months</Option>
                  <Option value="thisYear">This Year</Option>
                  <Option value="lastYear">Last Year</Option>
                  <Option value="custom">Custom Range</Option>
                </Select>
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space>
                <span style={{ fontWeight: 600 }}>Creation Date Range:</span>
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  style={{ width: '100%' }}
                  placeholder={['Start Date', 'End Date']}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Search by user name or email..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
          </Row>
        </Card>

        {/* Users Table */}
        <Card
          title={
            <Space>
              <UserOutlined style={{ color: THEME_CONSTANTS.colors.primary }} />
              <span>Users with Archived Campaigns</span>
            </Space>
          }
          style={{ borderRadius: THEME_CONSTANTS.radius.lg }}
        >
          <Spin spinning={loading}>
            <Table
              dataSource={filteredUsers}
              columns={userColumns}
              rowKey="_id"
              pagination={{ 
                pageSize: 10,
                // showSizeChanger: true,
                // pageSizeOptions: ['5', '10', '20', '50'],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`
              }}
              locale={{ emptyText: <Empty description="No archived campaigns found" /> }}
            />
          </Spin>
        </Card>

        {/* Campaigns Modal */}
        <Modal
          title={
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <UserOutlined style={{ fontSize: 20, color: THEME_CONSTANTS.colors.primary }} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedUser?.userName}</div>
                  <div style={{ fontSize: 13, color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 400 }}>
                    {selectedUser?.userEmail}
                  </div>
                </div>
              </div>
              {(quickFilter !== 'all' || (dateRange && dateRange.length === 2)) && (
                <div style={{ 
                  fontSize: 12, 
                  color: THEME_CONSTANTS.colors.primary, 
                  fontWeight: 600,
                  padding: '4px 8px',
                  background: THEME_CONSTANTS.colors.primaryLight,
                  borderRadius: 4,
                  display: 'inline-block'
                }}>
                  Filter: Campaigns created {quickFilter === 'custom' ? 'in custom range' : 
                    quickFilter === 'all' ? 'in custom range' :
                    quickFilter.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </div>
              )}
            </div>
          }
          open={showModal}
          onCancel={() => setShowModal(false)}
          footer={null}
          width={1300}
        >
          <Spin spinning={campaignsLoading}>
            <Table
              dataSource={campaigns}
              columns={campaignColumns}
              rowKey="_id"
              pagination={{ 
                pageSize: 10,
                // showSizeChanger: true,
                // pageSizeOptions: ['5', '10', '20', '50'],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} campaigns`
              }}
              locale={{ emptyText: <Empty description="No campaigns found" /> }}
              scroll={{ x: 1100 }}
            />
          </Spin>
        </Modal>
      </div>
    </div>
  );
}
