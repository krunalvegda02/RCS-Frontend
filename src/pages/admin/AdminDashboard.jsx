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
        boxShadow: THEME_CONSTANTS.shadow.sm,
        height: '100%',
        transition: `all ${THEME_CONSTANTS.transition.normal}`,
        background: THEME_CONSTANTS.colors.surface,
      }}
      bodyStyle={{ padding: screens.xs ? '16px' : '24px' }}
      hoverable
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = THEME_CONSTANTS.shadow.md;
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = THEME_CONSTANTS.shadow.sm;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: THEME_CONSTANTS.spacing.md }}>
        <div>
          <div style={{ fontSize: THEME_CONSTANTS.typography.bodySmall.size, color: THEME_CONSTANTS.colors.textSecondary, marginBottom: THEME_CONSTANTS.spacing.sm }}>
            {title}
          </div>
          <div style={{ fontSize: screens.xs ? '24px' : '28px', fontWeight: 700, color: THEME_CONSTANTS.colors.text, marginBottom: THEME_CONSTANTS.spacing.xs }}>
            {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          </div>
          {trend !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.xs, fontSize: THEME_CONSTANTS.typography.caption.size, color: trend > 0 ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.danger }}>
              {trend > 0 ? <ArrowUpOutlined style={{ fontSize: '11px' }} /> : <ArrowDownOutlined style={{ fontSize: '11px' }} />}
              <span>{Math.abs(trend)}% {screens.xs ? '' : 'this month'}</span>
            </div>
          )}
        </div>
        <div style={{ width: screens.xs ? 40 : 48, height: screens.xs ? 40 : 48, borderRadius: THEME_CONSTANTS.radius.lg, background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, fontSize: screens.xs ? 18 : 24 }}>
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
                  Dashboard
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
                      <DashboardOutlined style={{
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
                        '@media (max-width: 768px)': {
                          fontSize: THEME_CONSTANTS.typography.h2.size,
                        }
                      }}>
                        Admin Dashboard 📊
                      </h1>
                      <p style={{
                        color: THEME_CONSTANTS.colors.textSecondary,
                        fontSize: THEME_CONSTANTS.typography.body.size,
                        fontWeight: 500,
                        lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                        margin: 0
                      }}>
                        Real-time platform analytics, user management, and comprehensive system monitoring.
                      </p>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col xs={24} lg={6}>
                <div style={{ textAlign: { xs: 'center', lg: 'right' } }}>
                  {/* Dashboard actions can go here if needed */}
                </div>
              </Col>
            </Row>
          </div>

        {/* STAT CARDS - 4 COLUMN GRID */}
        <Row gutter={[THEME_CONSTANTS.spacing.lg, THEME_CONSTANTS.spacing.lg]} style={{ marginBottom: THEME_CONSTANTS.spacing.xxl }}>
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

        {/* USERS TABLE */}
        <Card
          title={
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              <UserOutlined style={{ marginRight: 8, color: THEME_CONSTANTS.colors.primary }} />
              Recent Users
            </div>
          }
          style={{
            borderRadius: THEME_CONSTANTS.radius.lg,
            boxShadow: THEME_CONSTANTS.shadow.sm,
            marginBottom: 24,
          }}
          extra={
            <Button type="primary" href="/admin/users">
              View All Users
            </Button>
          }
        >
          <Table
            dataSource={recentUsers}
            columns={userColumns}
            rowKey="_id"
            pagination={{ pageSize: 5 }}
            locale={{ emptyText: <Empty /> }}
            scroll={{ x: screens.md ? 0 : 600 }}
            style={{ fontSize: 14 }}
          />
        </Card>

        {/* WALLET REQUESTS & TRANSACTIONS - 2 COLUMN GRID */}
        <Row gutter={[THEME_CONSTANTS.spacing.lg, THEME_CONSTANTS.spacing.lg]}>
          {/* WALLET REQUESTS */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  <WalletOutlined style={{ marginRight: 8, color: THEME_CONSTANTS.colors.warning }} />
                  Wallet Requests
                </div>
              }
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                boxShadow: THEME_CONSTANTS.shadow.sm,
              }}
            >
              <Table
                dataSource={recentRequests}
                columns={walletColumns}
                rowKey="_id"
                pagination={{ pageSize: 5 }}
                locale={{ emptyText: <Empty /> }}
                scroll={{ x: screens.md ? 0 : 500 }}
                style={{ fontSize: 14 }}
              />
            </Card>
          </Col>

          {/* TRANSACTIONS */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  <DollarOutlined style={{ marginRight: 8, color: THEME_CONSTANTS.colors.danger }} />
                  Recent Transactions
                </div>
              }
              style={{
                borderRadius: THEME_CONSTANTS.radius.lg,
                boxShadow: THEME_CONSTANTS.shadow.sm,
              }}
            >
              <Table
                dataSource={recentTransactions}
                columns={transactionColumns}
                rowKey="_id"
                pagination={{ pageSize: 5 }}
                locale={{ emptyText: <Empty /> }}
                scroll={{ x: screens.md ? 0 : 500 }}
                style={{ fontSize: 14 }}
              />
            </Card>
          </Col>
        </Row>
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;