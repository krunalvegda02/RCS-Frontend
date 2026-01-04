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
} from '@ant-design/icons';
import { _get } from '../../helper/apiClient.jsx';
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
  });

  const [recentUsers, setRecentUsers] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    if (token) {
      fetchDashboard();
    }
  }, [token]);

  const fetchDashboard = async () => {
    try {
      const res = await _get('v1/dashboard/admin', {}, {}, token);
      if (res.data.success) {
        console.log('Dashboard data:', res.data.dashboard.recentUsers); // Debug log
        setStats(res.data.dashboard.stats);
        setRecentUsers(res.data.dashboard.recentUsers || []);
        setRecentRequests(res.data.dashboard.recentWalletRequests || []);
        setRecentTransactions(res.data.dashboard.recentTransactions || []);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ================= HELPERS =================
  const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
  
  const formatDate = (d) => {
    if (!d) return '-';
    const now = new Date();
    const diffHours = Math.floor((now - new Date(d)) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(d).toLocaleDateString('en-IN', {
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
            style={{
              backgroundColor: THEME_CONSTANTS.colors.primary,
              fontWeight: 600,
            }}
            icon={<UserOutlined />}
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

  // ================= WALLET REQUESTS TABLE =================
  const walletColumns = [
    {
      title: 'User',
      dataIndex: ['userId', 'name'],
      key: 'user',
      render: (text, record) => (
        <Space size={12}>
          <Avatar
            size={36}
            style={{
              backgroundColor: '#FAAD14',
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
      responsive: ['md'],
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color, bgColor, icon;
        switch (status) {
          case 'pending':
            color = '#FAAD14';
            bgColor = '#FFFBE6';
            icon = <ClockCircleOutlined />;
            break;
          case 'approved':
            color = THEME_CONSTANTS.colors.success;
            bgColor = '#F6FFED';
            icon = <CheckOutlined />;
            break;
          case 'rejected':
            color = '#FF4D4F';
            bgColor = '#FFF1F0';
            icon = <CloseOutlined />;
            break;
          default:
            color = THEME_CONSTANTS.colors.primary;
            bgColor = '#E6F7FF';
        }
        return (
          <Tag
            icon={icon}
            color={bgColor}
            style={{
              color: color,
              border: `1px solid ${color}`,
              fontWeight: 500,
              padding: '4px 12px',
              borderRadius: THEME_CONSTANTS.radius.sm,
            }}
          >
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
          </Tag>
        );
      },
      width: '20%',
    },
    {
      title: 'Requested',
      dataIndex: 'requestedAt',
      key: 'requested',
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
      responsive: ['md'],
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
              backgroundColor:
                record.type === 'credit'
                  ? THEME_CONSTANTS.colors.success
                  : '#FF4D4F',
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
          </div>
        </Space>
      ),
      width: '28%',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const isCredit = type === 'credit';
        return (
          <Tag
            icon={
              isCredit ? (
                <ArrowDownOutlined />
              ) : (
                <ArrowUpOutlined />
              )
            }
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
      width: '15%',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <div
          style={{
            fontWeight: 600,
            color:
              record.type === 'credit'
                ? THEME_CONSTANTS.colors.success
                : '#FF4D4F',
            fontSize: '14px',
          }}
        >
          {record.type === 'credit' ? '+' : '-'}
          {formatCurrency(amount)}
        </div>
      ),
      width: '20%',
    },
    // {
    //   title: 'Purpose',
    //   dataIndex: 'purpose',
    //   key: 'purpose',
    //   render: (purpose) => (
    //     <span
    //       style={{
    //         fontSize: '13px',
    //         color: THEME_CONSTANTS.colors.textSecondary,
    //       }}
    //     >
    //       {purpose}
    //     </span>
    //   ),
    //   width: '22%',
    //   responsive: ['md'],
    // },
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
      width: '15%',
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
          <Col xs={24} sm={12} md={6}>
            <StatCard
              icon={UserOutlined}
              title="Total Users"
              value={stats.totalUsers || 0}
              color={THEME_CONSTANTS.colors.primary}
              bgColor={THEME_CONSTANTS.colors.primaryLight}
              // trend={2.5}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              icon={MessageOutlined}
              title="Messages Sent"
              value={stats.totalMessages || 0}
              color={THEME_CONSTANTS.colors.success}
              bgColor={THEME_CONSTANTS.colors.successLight}
              // trend={5.2}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              icon={ClockCircleOutlined}
              title="Pending Requests"
              value={stats.pendingRequests || 0}
              color={THEME_CONSTANTS.colors.warning}
              bgColor={THEME_CONSTANTS.colors.warningLight}
              // trend={-1.3}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              icon={WalletOutlined}
              title="Total Wallet Balance"
              value={formatCurrency(stats.totalWalletBalance || 0)}
              color={THEME_CONSTANTS.colors.danger}
              bgColor={THEME_CONSTANTS.colors.dangerLight}
              // trend={3.8}
            />
          </Col>
        </Row>

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
        <Row gutter={[screens.xs ? 12 : 20, screens.xs ? 12 : 20]}>
          {/* Wallet Requests */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space size={8}>
                  <WalletOutlined style={{ color: THEME_CONSTANTS.colors.warning, fontSize: '18px' }} />
                  <span style={{ fontSize: THEME_CONSTANTS.typography.h5.size, fontWeight: THEME_CONSTANTS.typography.h5.weight, color: THEME_CONSTANTS.colors.text }}>Wallet Requests</span>
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
                dataSource={recentRequests}
                columns={walletColumns}
                rowKey="_id"
                pagination={{ pageSize: 5, showSizeChanger: false }}
                locale={{ emptyText: <Empty description="No requests found" /> }}
                scroll={{ x: screens.md ? 0 : 500 }}
              />
            </Card>
          </Col>

          {/* Recent Transactions */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space size={8}>
                  <DollarOutlined style={{ color: THEME_CONSTANTS.colors.success, fontSize: '18px' }} />
                  <span style={{ fontSize: THEME_CONSTANTS.typography.h5.size, fontWeight: THEME_CONSTANTS.typography.h5.weight, color: THEME_CONSTANTS.colors.text }}>Recent Transactions</span>
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