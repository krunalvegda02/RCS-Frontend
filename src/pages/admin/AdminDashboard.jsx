import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Space,
  Button,
  Avatar,
  Empty,
  Tooltip,
  Breadcrumb,
  Spin,
  Grid,
} from 'antd';
import {
  UserOutlined,
  MessageOutlined,
  WalletOutlined,
  CreditCardOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  DashboardOutlined,
  RightOutlined,
  ExperimentOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { _get, _post } from '../../helper/apiClient.jsx';
import { THEME_CONSTANTS } from '../../theme';

const { useBreakpoint } = Grid;

function AdminDashboard() {
  const screens = useBreakpoint();
  const [loading, setLoading] = useState(true);
  const { token } = useSelector(state => state.auth);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalMessages: 0,
    totalCost: 0,
    pendingRequests: 0,
    totalTransactions: 0,
    totalWalletBalance: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  });

  const [monthlyStats, setMonthlyStats] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(true);

  const [recentUsers, setRecentUsers] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [demoRequests, setDemoRequests] = useState([]);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (token) {
      fetchDashboard();
    }
  }, [token]);

  const fetchDashboard = async () => {
    try {
      const [dashRes, demoRes, monthlyRes] = await Promise.all([
        _get('v1/dashboard/admin', {}, {}, token),
        _get('demo-requests', {}, {}, token),
        _get('v1/dashboard/admin/monthly-stats', { monthsBack: 1 }, {}, token)
      ]);
      
      if (dashRes.data.success) {
        setStats(dashRes.data.dashboard.stats);
        setRecentUsers(dashRes.data.dashboard.recentUsers || []);
        setRecentRequests(dashRes.data.dashboard.recentWalletRequests || []);
        setRecentTransactions(dashRes.data.dashboard.recentTransactions || []);
      }
      
      const demos = demoRes.data?.data || demoRes.data || [];
      setDemoRequests(demos.slice(0, 5));

      if (monthlyRes.data.success) {
        setMonthlyStats(monthlyRes.data.data);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setMonthlyLoading(false);
    }
  };

  // ================= HELPERS =================
  const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ================= STAT CARD COMPONENT =================
  const StatCard = ({ icon: Icon, title, value, color, bgColor, trend }) => (
    <Card
      style={{
        borderRadius: THEME_CONSTANTS.radius.lg,
        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
        boxShadow: THEME_CONSTANTS.shadow.base,
        height: '100%',
        transition: THEME_CONSTANTS.transition.normal,
        background: THEME_CONSTANTS.colors.surface,
        overflow: 'hidden'
      }}
      bodyStyle={{ padding: screens.xs ? '20px' : '24px' }}
      hoverable
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = THEME_CONSTANTS.shadow.lg;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = THEME_CONSTANTS.shadow.base;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = THEME_CONSTANTS.colors.border;
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: THEME_CONSTANTS.spacing.md }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: THEME_CONSTANTS.typography.label.size,
            color: THEME_CONSTANTS.colors.textSecondary,
            marginBottom: THEME_CONSTANTS.spacing.sm,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {title}
          </div>
          <div style={{
            fontSize: screens.xs ? '26px' : '32px',
            fontWeight: 700,
            color: THEME_CONSTANTS.colors.text,
            marginBottom: trend !== undefined ? THEME_CONSTANTS.spacing.xs : 0,
            lineHeight: 1.2
          }}>
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </div>
          {trend !== undefined && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: THEME_CONSTANTS.spacing.xs,
              fontSize: THEME_CONSTANTS.typography.caption.size,
              color: trend > 0 ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.danger,
              fontWeight: 600
            }}>
              {trend > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              <span>{Math.abs(trend)}% vs last month</span>
            </div>
          )}
        </div>
        <div style={{
          width: screens.xs ? 56 : 64,
          height: screens.xs ? 56 : 64,
          borderRadius: THEME_CONSTANTS.radius.xl,
          background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          fontSize: screens.xs ? 24 : 28,
          flexShrink: 0
        }}>
          <Icon />
        </div>
      </div>
    </Card>
  );

  // ================= USERS TABLE =================
  const userColumns = [
    {
      title: 'User Details',
      dataIndex: 'name',
      key: 'user',
      render: (text, record) => (
        <Space size={12}>
          <Avatar
            size={40}
            style={{ background: THEME_CONSTANTS.colors.primaryLight, color: THEME_CONSTANTS.colors.primary }}
          >
            {record.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <div
              style={{
                fontWeight: 600,
                color: THEME_CONSTANTS.colors.textPrimary,
                fontSize: '14px',
              }}
            >
              {record.name}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: THEME_CONSTANTS.colors.textSecondary,
              }}
            >
              {record.email}
            </div>
            {record.companyname && (
              <div
                style={{
                  fontSize: '11px',
                  color: THEME_CONSTANTS.colors.primary,
                  fontWeight: 500,
                }}
              >
                {record.companyname}
              </div>
            )}
          </div>
        </Space>
      ),
      width: '30%',
    },
    {
      title: 'Contact',
      dataIndex: 'phone',
      key: 'contact',
      render: (phone) => (
        <div
          style={{
            fontSize: '13px',
            color: THEME_CONSTANTS.colors.textSecondary,
          }}
        >
          {phone ? `+${phone}` : '-'}
        </div>
      ),
      width: '15%',
      responsive: ['md'],
    },
    {
      title: 'Wallet Balance',
      dataIndex: 'Wallet',
      key: 'wallet',
      render: (balance) => (
        <div
          style={{
            fontWeight: 600,
            color: THEME_CONSTANTS.colors.success,
            fontSize: '14px',
          }}
        >
          {formatCurrency(balance || 0)}
        </div>
      ),
      width: '18%',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const isActive = status === 'active';
        return (
          <Tag
            icon={isActive ? <CheckOutlined /> : <CloseOutlined />}
            color={isActive ? '#F6FFED' : '#FFF1F0'}
            style={{
              color: isActive ? THEME_CONSTANTS.colors.success : '#FF4D4F',
              border: `1px solid ${isActive ? THEME_CONSTANTS.colors.success : '#FF4D4F'}`,
              fontWeight: 500,
              padding: '4px 12px',
              borderRadius: THEME_CONSTANTS.radius.sm,
            }}
          >
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
          </Tag>
        );
      },
      width: '15%',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <Tooltip title={new Date(date).toLocaleDateString('en-IN')}>
          <span
            style={{
              fontSize: '13px',
              color: THEME_CONSTANTS.colors.textSecondary,
            }}
          >
            {formatDate(date)}
          </span>
        </Tooltip>
      ),
      width: '22%',
      responsive: ['md'],
    },
  ];


  // ================= DEMO REQUESTS TABLE =================
  const demoColumns = [
    {
      title: 'User Details',
      key: 'user',
      render: (_, record) => (
        <Space size={12}>
          <Avatar size={40} style={{ background: THEME_CONSTANTS.colors.primaryLight, color: THEME_CONSTANTS.colors.primary }}>
            {record.name?.charAt(0)?.toUpperCase() || 'G'}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, fontSize: '14px' }}>{record.name || 'Guest'}</div>
            <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary }}>{record.email}</div>
            {record.company && <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.primary, fontWeight: 500 }}>{record.company}</div>}
          </div>
        </Space>
      ),
    },
    {
      title: 'Contact',
      dataIndex: 'phone',
      render: (phone) => <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>{phone || '-'}</div>,
      responsive: ['md'],
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => {
        const st = status?.toUpperCase() || 'SCHEDULED';
        const config = { 
          SCHEDULED: { color: THEME_CONSTANTS.colors.primary, bg: `${THEME_CONSTANTS.colors.primary}15`, icon: <ClockCircleOutlined /> },
          COMPLETED: { color: THEME_CONSTANTS.colors.success, bg: '#F6FFED', icon: <CheckOutlined /> },
          CANCELLED: { color: '#FF4D4F', bg: '#FFF1F0', icon: <CloseOutlined /> },
          NO_SHOW: { color: '#FAAD14', bg: '#FFFBE6', icon: <CloseOutlined /> }
        }[st] || { color: THEME_CONSTANTS.colors.primary, bg: `${THEME_CONSTANTS.colors.primary}15`, icon: <ClockCircleOutlined /> };
        return <Tag icon={config.icon} color={config.bg} style={{ color: config.color, border: `1px solid ${config.color}`, fontWeight: 500, padding: '4px 12px', borderRadius: THEME_CONSTANTS.radius.sm }}>{st}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      render: (date) => <Tooltip title={new Date(date).toLocaleDateString('en-IN')}><span style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary }}>{formatDate(date)}</span></Tooltip>,
      responsive: ['lg'],
    },
  ];

  // ================= TRANSACTIONS TABLE =================
  const transactionColumns = [
    {
      title: 'User',
      dataIndex: ['userId', 'name'],
      key: 'user',
      render: (text, record) => (
        <Space size={12}>
          <Avatar
            size={36}
            style={{
              backgroundColor: THEME_CONSTANTS.colors.primaryLight,
              color: THEME_CONSTANTS.colors.primary,
              fontWeight: 600,
            }}
            icon={<UserOutlined />}
          >
            {record.userId?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <div
              style={{
                fontWeight: 600,
                color: THEME_CONSTANTS.colors.textPrimary,
                fontSize: '14px',
              }}
            >
              {record.userId?.name}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: THEME_CONSTANTS.colors.textSecondary,
              }}
            >
              {record.userId?.email}
            </div>
          </div>
        </Space>
      ),
      width: '35%',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <div
          style={{
            fontWeight: 600,
            color: THEME_CONSTANTS.colors.success,
            fontSize: '14px',
          }}
        >
          {formatCurrency(amount)}
        </div>
      ),
      width: '20%',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const isCredit = type === 'credit';
        return (
          <Tag
            icon={isCredit ? <CheckOutlined /> : <CloseOutlined />}
            color={isCredit ? '#F6FFED' : '#FFF1F0'}
            style={{
              color: isCredit ? THEME_CONSTANTS.colors.success : '#FF4D4F',
              border: `1px solid ${isCredit ? THEME_CONSTANTS.colors.success : '#FF4D4F'}`,
              fontWeight: 500,
              padding: '4px 12px',
              borderRadius: THEME_CONSTANTS.radius.sm,
            }}
          >
            {type?.toUpperCase()}
          </Tag>
        );
      },
      width: '20%',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => (
        <Tooltip title={new Date(date).toLocaleDateString('en-IN')}>
          <span
            style={{
              fontSize: '13px',
              color: THEME_CONSTANTS.colors.textSecondary,
            }}
          >
            {formatDate(date)}
          </span>
        </Tooltip>
      ),
      width: '25%',
    },
  ];

  if (loading) {
    return (
      <>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '400px',
          }}
        >
          <Spin size="large" />
        </div>
      </>
    );
  }

  return (
    <div style={{ background: THEME_CONSTANTS.colors.background, minHeight: '100vh', padding: screens.xs ? THEME_CONSTANTS.spacing.lg : THEME_CONSTANTS.spacing.xxl }}>
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
              <span style={{ color: THEME_CONSTANTS.colors.primary, fontSize: THEME_CONSTANTS.typography.caption.size, fontWeight: 600 }}>Dashboard</span>
            </Breadcrumb.Item>
          </Breadcrumb>

          <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.lg }}>
            <div style={{
              width: screens.xs ? '56px' : '72px',
              height: screens.xs ? '56px' : '72px',
              background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight} 0%, ${THEME_CONSTANTS.colors.primaryLight} 100%)`,
              borderRadius: THEME_CONSTANTS.radius.xl,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 16px -4px ${THEME_CONSTANTS.colors.primary}40`,
              flexShrink: 0
            }}>
              <DashboardOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: screens.xs ? '28px' : '36px' }} />
            </div>
            <div>
              <h1 style={{
                fontSize: screens.xs ? THEME_CONSTANTS.typography.h2.size : THEME_CONSTANTS.typography.h1.size,
                fontWeight: THEME_CONSTANTS.typography.h1.weight,
                color: THEME_CONSTANTS.colors.text,
                marginBottom: THEME_CONSTANTS.spacing.xs,
                lineHeight: 1.2,
                letterSpacing: '-0.02em'
              }}>
                Admin Dashboard
              </h1>
              <p style={{
                color: THEME_CONSTANTS.colors.textSecondary,
                fontSize: THEME_CONSTANTS.typography.body.size,
                lineHeight: 1.5,
                margin: 0,
                maxWidth: '600px'
              }}>
                Monitor platform analytics, manage users, and track system performance in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <Row gutter={[screens.xs ? 12 : 20, screens.xs ? 12 : 20]} style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              icon={UserOutlined}
              title="Total Users"
              value={stats.totalUsers || 0}
              color={THEME_CONSTANTS.colors.primary}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              icon={CheckOutlined}
              title="Active Users"
              value={stats.activeUsers || 0}
              color={THEME_CONSTANTS.colors.success}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              icon={MessageOutlined}
              title="Messages Delivered"
              value={stats.totalMessages || 0}
              color="#1890ff"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              icon={WalletOutlined}
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue || 0)}
              color="#52c41a"
            />
          </Col>
        </Row>

        {/* Secondary Stats */}
        <Row gutter={[screens.xs ? 12 : 20, screens.xs ? 12 : 20]} style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl }}>
          <Col xs={24} sm={12} lg={8}>
            <StatCard
              icon={CreditCardOutlined}
              title="Pending Payments"
              value={stats.pendingPayments || 0}
              color="#faad14"
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <StatCard
              icon={WalletOutlined}
              title="User Wallet Balance"
              value={formatCurrency(stats.totalWalletBalance || 0)}
              color="#722ed1"
            />
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <StatCard
              icon={DollarOutlined}
              title="Total Cost"
              value={formatCurrency(stats.totalCost || 0)}
              color="#eb2f96"
            />
          </Col>
        </Row>

        {/* Monthly Statistics Section */}
        {!monthlyLoading && monthlyStats && (
          <Card
            title={
              <Space size={8}>
                <MessageOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '18px' }} />
                <span style={{ fontSize: THEME_CONSTANTS.typography.h5.size, fontWeight: THEME_CONSTANTS.typography.h5.weight, color: THEME_CONSTANTS.colors.text }}>
                  {monthlyStats.period.monthName} Campaign Statistics
                </span>
              </Space>
            }
            style={{
              borderRadius: THEME_CONSTANTS.radius.lg,
              border: `1px solid ${THEME_CONSTANTS.colors.border}`,
              boxShadow: THEME_CONSTANTS.shadow.base,
              marginBottom: THEME_CONSTANTS.spacing.xxl,
              background: THEME_CONSTANTS.colors.surface
            }}
          >
            {/* Campaign Overview */}
            <Row gutter={[16, 16]} style={{ marginBottom: THEME_CONSTANTS.spacing.xl }}>
              <Col xs={24} sm={12} md={6}>
                <div style={{ textAlign: 'center', padding: '16px', background: `${THEME_CONSTANTS.colors.primary}10`, borderRadius: THEME_CONSTANTS.radius.md }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: THEME_CONSTANTS.colors.primary }}>
                    {monthlyStats.stats.totalCampaigns.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>Total Campaigns</div>
                  <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textMuted, marginTop: '2px' }}>
                    Active: {monthlyStats.stats.activeCampaigns} | Archived: {monthlyStats.stats.archivedCampaigns}
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ textAlign: 'center', padding: '16px', background: `${THEME_CONSTANTS.colors.success}10`, borderRadius: THEME_CONSTANTS.radius.md }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: THEME_CONSTANTS.colors.success }}>
                    {monthlyStats.stats.totalMessages.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>Total Messages</div>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ textAlign: 'center', padding: '16px', background: '#1890ff15', borderRadius: THEME_CONSTANTS.radius.md }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#1890ff' }}>
                    {monthlyStats.stats.deliveryRate}%
                  </div>
                  <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>Delivery Rate</div>
                  <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textMuted, marginTop: '2px' }}>
                    {monthlyStats.stats.totalDelivered.toLocaleString()} delivered
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ textAlign: 'center', padding: '16px', background: '#52c41a15', borderRadius: THEME_CONSTANTS.radius.md }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#52c41a' }}>
                    {formatCurrency(monthlyStats.stats.netRevenue)}
                  </div>
                  <div style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>Net Revenue</div>
                  <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textMuted, marginTop: '2px' }}>
                    Cost: {formatCurrency(monthlyStats.stats.totalCost)} | Refund: {formatCurrency(monthlyStats.stats.totalRefunded)}
                  </div>
                </div>
              </Col>
            </Row>

            {/* Message Breakdown */}
            <Row gutter={[16, 16]} style={{ marginBottom: THEME_CONSTANTS.spacing.xl }}>
              <Col xs={24} md={12}>
                <div style={{ padding: '20px', background: THEME_CONSTANTS.colors.background, borderRadius: THEME_CONSTANTS.radius.md }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: THEME_CONSTANTS.colors.text }}>Message Statistics</h4>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: THEME_CONSTANTS.colors.textSecondary }}>Sent</span>
                      <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.success }}>
                        {monthlyStats.stats.totalSent.toLocaleString()} ({((monthlyStats.stats.totalSent / monthlyStats.stats.totalMessages) * 100).toFixed(2)}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: THEME_CONSTANTS.colors.textSecondary }}>Delivered</span>
                      <span style={{ fontWeight: 600, color: '#1890ff' }}>
                        {monthlyStats.stats.totalDelivered.toLocaleString()} ({monthlyStats.stats.deliveryRate}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: THEME_CONSTANTS.colors.textSecondary }}>Read</span>
                      <span style={{ fontWeight: 600, color: '#722ed1' }}>
                        {monthlyStats.stats.totalRead.toLocaleString()} ({monthlyStats.stats.readRate}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: THEME_CONSTANTS.colors.textSecondary }}>Replied</span>
                      <span style={{ fontWeight: 600, color: '#13c2c2' }}>
                        {monthlyStats.stats.totalReplied.toLocaleString()} ({((monthlyStats.stats.totalReplied / monthlyStats.stats.totalMessages) * 100).toFixed(2)}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: THEME_CONSTANTS.colors.textSecondary }}>Failed</span>
                      <span style={{ fontWeight: 600, color: '#ff4d4f' }}>
                        {monthlyStats.stats.totalFailed.toLocaleString()} ({monthlyStats.stats.failureRate}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: THEME_CONSTANTS.colors.textSecondary }}>Expired</span>
                      <span style={{ fontWeight: 600, color: '#faad14' }}>
                        {monthlyStats.stats.totalExpired.toLocaleString()} ({((monthlyStats.stats.totalExpired / monthlyStats.stats.totalMessages) * 100).toFixed(2)}%)
                      </span>
                    </div>
                  </Space>
                </div>
              </Col>

              {/* Top Users */}
              <Col xs={24} md={12}>
                <div style={{ padding: '20px', background: THEME_CONSTANTS.colors.background, borderRadius: THEME_CONSTANTS.radius.md }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: THEME_CONSTANTS.colors.text }}>Top 5 Users by Campaigns</h4>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {monthlyStats.topUsers.map((user, idx) => (
                      <div key={idx} style={{ padding: '12px', background: THEME_CONSTANTS.colors.surface, borderRadius: THEME_CONSTANTS.radius.sm, border: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <Avatar size={32} style={{ background: THEME_CONSTANTS.colors.primaryLight, color: THEME_CONSTANTS.colors.primary, fontWeight: 600 }}>
                            {idx + 1}
                          </Avatar>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: THEME_CONSTANTS.colors.text }}>{user.name}</div>
                            <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary }}>{user.email}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textMuted, marginLeft: '40px' }}>
                          Campaigns: {user.campaigns} | Messages: {user.messages.toLocaleString()} | Cost: {formatCurrency(user.cost)}
                        </div>
                      </div>
                    ))}
                  </Space>
                </div>
              </Col>
            </Row>

            {/* Campaign Status Breakdown */}
            <div style={{ padding: '20px', background: THEME_CONSTANTS.colors.background, borderRadius: THEME_CONSTANTS.radius.md }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: THEME_CONSTANTS.colors.text }}>Campaign Status Breakdown</h4>
              <Row gutter={[12, 12]}>
                {monthlyStats.statusBreakdown.map((status, idx) => (
                  <Col key={idx} xs={12} sm={8} md={6}>
                    <div style={{ textAlign: 'center', padding: '12px', background: THEME_CONSTANTS.colors.surface, borderRadius: THEME_CONSTANTS.radius.sm, border: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: THEME_CONSTANTS.colors.primary }}>{status.count}</div>
                      <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, textTransform: 'capitalize', marginTop: '4px' }}>{status._id}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </Card>
        )}

        {/* Recent Users */}
        <Card
          title={
            <Space size={8}>
              <UserOutlined style={{ color: THEME_CONSTANTS.colors.primary, fontSize: '18px' }} />
              <span style={{ fontSize: THEME_CONSTANTS.typography.h5.size, fontWeight: THEME_CONSTANTS.typography.h5.weight, color: THEME_CONSTANTS.colors.text }}>Recent Users</span>
            </Space>
          }
          style={{
            borderRadius: THEME_CONSTANTS.radius.lg,
            border: `1px solid ${THEME_CONSTANTS.colors.border}`,
            boxShadow: THEME_CONSTANTS.shadow.base,
            marginBottom: THEME_CONSTANTS.spacing.xxl,
            background: THEME_CONSTANTS.colors.surface
          }}
          extra={
            <Button type="primary" href="/admin/users" style={{ borderRadius: THEME_CONSTANTS.radius.md, fontWeight: 500 }}>
              View All <RightOutlined style={{ fontSize: '12px' }} />
            </Button>
          }
          bodyStyle={{ padding: 0 }}
        >
          <Table
            dataSource={recentUsers}
            columns={userColumns}
            rowKey="_id"
            pagination={{ pageSize: 5, showSizeChanger: false }}
            locale={{ emptyText: <Empty description="No users found" /> }}
            scroll={{ x: screens.md ? 0 : 600 }}
          />
        </Card>

        {/* Activity Overview */}
        <Row gutter={[screens.xs ? 12 : 20, screens.xs ? 12 : 20]} style={{ marginBottom: THEME_CONSTANTS.spacing.xxl }}>
          {/* Demo Requests */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space size={8}>
                  <ExperimentOutlined style={{ color: THEME_CONSTANTS.colors.warning, fontSize: '18px' }} />
                  <span style={{ fontSize: THEME_CONSTANTS.typography.h5.size, fontWeight: THEME_CONSTANTS.typography.h5.weight, color: THEME_CONSTANTS.colors.text }}>Demo Requests</span>
                </Space>
              }
              extra={
                <Button type="link" href="/admin/demo-requests" style={{ fontWeight: 500 }}>
                  View All <RightOutlined style={{ fontSize: '12px' }} />
                </Button>
              }
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                boxShadow: THEME_CONSTANTS.shadow.base,
                background: THEME_CONSTANTS.colors.surface,
                height: '100%'
              }}
              bodyStyle={{ padding: 0 }}
            >
              <Table
                dataSource={demoRequests}
                columns={demoColumns}
                rowKey="_id"
                pagination={false}
                locale={{ emptyText: <Empty description="No demo requests" /> }}
                scroll={{ x: screens.md ? 0 : 500 }}
              />
            </Card>
          </Col>

          {/* Recent Transactions */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space size={8}>
                  <CreditCardOutlined style={{ color: THEME_CONSTANTS.colors.success, fontSize: '18px' }} />
                  <span style={{ fontSize: THEME_CONSTANTS.typography.h5.size, fontWeight: THEME_CONSTANTS.typography.h5.weight, color: THEME_CONSTANTS.colors.text }}>Recent Payments</span>
                </Space>
              }
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                boxShadow: THEME_CONSTANTS.shadow.base,
                background: THEME_CONSTANTS.colors.surface,
                height: '100%'
              }}
              bodyStyle={{ padding: 0 }}
            >
              <Table
                dataSource={recentTransactions}
                columns={transactionColumns}
                rowKey="_id"
                pagination={{ pageSize: 5, showSizeChanger: false }}
                locale={{ emptyText: <Empty description="No transactions found" /> }}
                scroll={{ x: screens.md ? 0 : 500 }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default AdminDashboard;