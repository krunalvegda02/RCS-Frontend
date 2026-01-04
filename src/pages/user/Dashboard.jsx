import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Space,
  Button,
  Avatar,
  Progress,
  Divider,
  Modal,
  Tooltip,
  Breadcrumb,
  Input,
  InputNumber,
  Grid,
  Statistic,
  Empty,
  Spin,
} from 'antd';
import {
  SendOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  BarChartOutlined,
  PlusOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  PhoneOutlined,
  MailOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  UserOutlined,
  DashboardOutlined,
  HomeOutlined,
  ReloadOutlined,
  WalletOutlined,
  CreditCardOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { THEME_CONSTANTS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardStats, fetchRecentOrders, submitWalletRequest } from '../../redux/slices/dashboardSlice';

const { useBreakpoint } = Grid;

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const dispatch = useDispatch();

  const { stats, recentOrders, loading, error } = useSelector(state => state.dashboard);

  const [refreshing, setRefreshing] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');

  const [userProfile] = useState({
    name: user?.companyname,
    phone: user?.phone,
    email: user?.email,
    plan: user?.plan,
    joinedDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A',
  });

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchDashboardStats(user._id));
      dispatch(fetchRecentOrders(user._id));
    }
  }, [user, dispatch]);

  const handleAddMoney = async () => {
    if (addAmount && Number.parseFloat(addAmount) > 0) {
      try {
        const result = await dispatch(submitWalletRequest({
          amount: Number.parseFloat(addAmount),
          userId: user._id,
        })).unwrap();

        toast.success(`Wallet recharge request of ₹${addAmount} submitted for admin approval!`);
        setAddAmount('');
        setShowAddMoney(false);
        refreshUser();
      } catch (error) {
        toast.error('Error submitting request: ' + error);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchDashboardStats(user._id)),
      dispatch(fetchRecentOrders(user._id)),
      refreshUser()
    ]);
    setRefreshing(false);
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);

  const messageColumns = [
    {
      title: 'Campaign Name',
      dataIndex: 'CampaignName',
      key: 'campaignName',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, fontSize: '14px' }}>
            {text || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>
            {record.type || 'SMS'}
          </div>
        </div>
      ),
      width: '25%',
    },
    {
      title: 'Recipients',
      dataIndex: 'cost',
      key: 'recipients',
      render: (cost) => (
        <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary }}>
          {cost || 0}
        </span>
      ),
      width: '12%',
    },
    {
      title: 'Sent',
      dataIndex: 'successCount',
      key: 'sent',
      render: (sent) => (
        <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.success }}>
          {sent || 0}
        </span>
      ),
      width: '12%',
    },
    {
      title: 'Delivered',
      dataIndex: 'totalDelivered',
      key: 'delivered',
      render: (delivered) => (
        <span style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.primary }}>
          {delivered || 0}
        </span>
      ),
      width: '12%',
    },
    {
      title: 'Failed',
      dataIndex: 'failedCount',
      key: 'failed',
      render: (failed) => (
        <span style={{ fontWeight: 600, color: '#ff4d4f' }}>
          {failed || 0}
        </span>
      ),
      width: '12%',
    },
    {
      title: 'Success Rate',
      key: 'successRate',
      render: (text, record) => {
        const successCount = record.successCount || 0;
        const failedCount = record.failedCount || 0;
        const totalSent = successCount + failedCount;
        const rate = totalSent > 0 ? Math.round((successCount / totalSent) * 100) : 0;

        const getProgressColor = () => {
          if (rate >= 90) return THEME_CONSTANTS.colors.success;
          if (rate >= 70) return THEME_CONSTANTS.colors.primary;
          if (rate >= 50) return '#fa8c16';
          return '#ff4d4f';
        };

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: getProgressColor(), fontSize: '13px' }}>{rate}%</span>
            <Progress
              percent={rate}
              size="small"
              style={{ width: '50px' }}
              strokeColor={getProgressColor()}
              showInfo={false}
            />
          </div>
        );
      },
      width: '15%',
      responsive: ['md'],
    },
    {
      title: 'Status',
      key: 'status',
      render: (text, record) => {
        const successCount = record?.successCount || 0;
        const failedCount = record?.failedCount || 0;
        const totalSent = successCount + failedCount;
        const successRate = totalSent > 0 ? Math.round((successCount / totalSent) * 100) : 0;

        // If no messages sent yet, show pending
        if (totalSent === 0) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag
                icon={<ClockCircleOutlined />}
                color="#fffbe6"
                style={{
                  color: '#faad14',
                  border: '1px solid #faad14',
                  fontWeight: 600,
                }}
              >
                Pending
              </Tag>
            </div>
          );
        }

        // Determine status based on success rate
        const getStatusConfig = () => {
          if (successRate >= 90) {
            return {
              color: THEME_CONSTANTS.colors.success,
              bgColor: '#f6ffed',
              border: `1px solid ${THEME_CONSTANTS.colors.success}`,
              icon: <CheckCircleOutlined />,
              text: 'Excellent'
            };
          } else if (successRate >= 70) {
            return {
              color: THEME_CONSTANTS.colors.primary,
              bgColor: '#e6f7ff',
              border: `1px solid ${THEME_CONSTANTS.colors.primary}`,
              icon: <CheckCircleOutlined />,
              text: 'Good'
            };
          } else if (successRate >= 50) {
            return {
              color: '#fa8c16',
              bgColor: '#fff7e6',
              border: '1px solid #fa8c16',
              icon: <CloseCircleOutlined />,
              text: 'Partial'
            };
          } else {
            return {
              color: '#ff4d4f',
              bgColor: '#fff1f0',
              border: '1px solid #ff4d4f',
              icon: <CloseCircleOutlined />,
              text: 'Poor'
            };
          }
        };

        const config = getStatusConfig();

        return (
          <Tag
            icon={config.icon}
            color={config.bgColor}
            style={{
              color: config.color,
              border: config.border,
              fontWeight: 600,
            }}
          >
            {config.text}
          </Tag>
        );
      },
      width: '12%',
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
                      <BarChartOutlined style={{
                        color: THEME_CONSTANTS.colors.primary,
                        fontSize: '32px'
                      }} />
                    </div>
                  </Col>
                  <Col xs={24} sm={20} md={21} lg={21}>
                    <div>
                      <h1 style={{
                        fontSize: THEME_CONSTANTS.typography.h1.size,
                        fontWeight: THEME_CONSTANTS.typography.h1.weight,
                        color: THEME_CONSTANTS.colors.text,
                        marginBottom: THEME_CONSTANTS.spacing.sm,
                        lineHeight: THEME_CONSTANTS.typography.h1.lineHeight,
                      }}>
                        Welcome back, {user?.companyname || 'User'} 👋
                      </h1>
                      <p style={{
                        color: THEME_CONSTANTS.colors.textSecondary,
                        fontSize: THEME_CONSTANTS.typography.body.size,
                        fontWeight: 500,
                        lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                        margin: 0
                      }}>
                        Manage your campaigns, templates, and track your message delivery metrics all in one place.
                      </p>
                    </div>
                  </Col>
                </Row>
              </Col>
              <Col xs={24} lg={6}>
                <div style={{ textAlign: screens.lg ? 'right' : 'left' }}>
                  <Space>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={handleRefresh}
                      loading={refreshing}
                    >
                      Refresh
                    </Button>
                  </Space>
                </div>
              </Col>
            </Row>
          </div>

          {/* WALLET CARD */}
          <Card
            style={{
              marginBottom: THEME_CONSTANTS.spacing.xxxl,
              borderRadius: THEME_CONSTANTS.radius.lg,
              border: 'none',
              boxShadow: THEME_CONSTANTS.shadow.base,
              position: 'relative',
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight} 0%, #f5f3ff 50%, #eef2ff 100%)`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -120,
                right: -80,
                width: 280,
                height: 280,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #bfdbfe 0%, transparent 70%)',
                opacity: 0.6,
              }}
            />
            <Row gutter={[32, 24]} align="middle">
              <Col xs={24} sm={24} md={12}>
                <div>
                  <p
                    style={{
                      margin: 0,
                      marginBottom: THEME_CONSTANTS.spacing.sm,
                      color: THEME_CONSTANTS.colors.textMuted,
                      fontSize: THEME_CONSTANTS.typography.caption.size,
                      fontWeight: THEME_CONSTANTS.typography.label.weight,
                      textTransform: 'uppercase',
                    }}
                  >
                    Wallet Balance
                  </p>
                  <h2
                    style={{
                      margin: 0,
                      marginBottom: THEME_CONSTANTS.spacing.sm,
                      fontSize: '40px',
                      fontWeight: THEME_CONSTANTS.typography.h1.weight,
                      background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary} 0%, #4f46e5 50%, ${THEME_CONSTANTS.colors.primaryDark} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {formatCurrency(user?.Wallet || 0)}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      color: THEME_CONSTANTS.colors.textSecondary,
                      fontSize: THEME_CONSTANTS.typography.body.size
                    }}
                  >
                    Ready to use for your campaigns. No hidden charges.
                  </p>
                </div>
              </Col>
              <Col xs={24} sm={24} md={12}>
                <Row gutter={[16, 16]} justify={{ xs: 'center', md: 'end' }}>
                  <Col xs={24} sm={12} md={24} lg={12}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<PlusOutlined />}
                      onClick={() => setShowAddMoney(true)}
                      block
                      style={{
                        height: '48px',
                        fontWeight: THEME_CONSTANTS.typography.label.weight,
                        background: THEME_CONSTANTS.colors.primary,
                        border: 'none',
                        borderRadius: THEME_CONSTANTS.radius.md,
                      }}
                    >
                      Add Money
                    </Button>
                  </Col>

                </Row>
              </Col>
            </Row>
            <Row gutter={[24, 16]} style={{ marginTop: THEME_CONSTANTS.spacing.xl }}>
              <Col xs={24} sm={12}>
                <div>
                  <p
                    style={{
                      margin: 0,
                      marginBottom: THEME_CONSTANTS.spacing.sm,
                      fontSize: THEME_CONSTANTS.typography.caption.size,
                      textTransform: 'uppercase',
                      fontWeight: THEME_CONSTANTS.typography.label.weight,
                      color: THEME_CONSTANTS.colors.textMuted,
                    }}
                  >
                    Credits Used This Month
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: THEME_CONSTANTS.spacing.sm,
                      marginBottom: THEME_CONSTANTS.spacing.sm,
                      flexWrap: 'wrap'
                    }}
                  >
                    <span
                      style={{
                        fontSize: THEME_CONSTANTS.typography.h4.size,
                        fontWeight: THEME_CONSTANTS.typography.h4.weight,
                        color: THEME_CONSTANTS.colors.text,
                      }}
                    >
                      ₹{loading ? 0 : (() => {
                        const totalCost = messageReports.reduce((total, report) => {
                          console.log("report:", report);
                          return total + (report.cost || 0);
                        }, 0);
                        console.log("Total cost calculated:", totalCost);
                        console.log("Message reports:", messageReports);
                        return totalCost;
                      })()}
                    </span>
                    <span
                      style={{
                        fontSize: THEME_CONSTANTS.typography.bodySmall.size,
                        color: THEME_CONSTANTS.colors.textMuted
                      }}
                    >
                      of {formatCurrency(user?.Wallet || 0)}
                    </span>
                  </div>
                  <Progress
                    percent={user?.Wallet && messageReports.length > 0 ? Math.min(100, Math.round(((messageReports.reduce((total, report) => total + (report.cost || 0), 0)) / user.Wallet) * 100)) : 0}
                    strokeColor={{ '0%': THEME_CONSTANTS.colors.primary, '100%': THEME_CONSTANTS.colors.primaryDark }}
                  />
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div>
                  <p
                    style={{
                      margin: 0,
                      marginBottom: THEME_CONSTANTS.spacing.sm,
                      fontSize: THEME_CONSTANTS.typography.caption.size,
                      textTransform: 'uppercase',
                      fontWeight: THEME_CONSTANTS.typography.label.weight,
                      color: THEME_CONSTANTS.colors.textMuted,
                    }}
                  >
                    Remaining Balance
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: THEME_CONSTANTS.spacing.sm,
                      marginBottom: THEME_CONSTANTS.spacing.sm,
                    }}
                  >
                    <span
                      style={{
                        fontSize: THEME_CONSTANTS.typography.h4.size,
                        fontWeight: THEME_CONSTANTS.typography.h4.weight,
                        color: THEME_CONSTANTS.colors.success,
                      }}
                    >
                      {formatCurrency((user?.Wallet || 0) - (loading ? 0 : messageReports.reduce((total, report) => total + (report.cost || 0), 0)))}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: THEME_CONSTANTS.typography.bodySmall.size,
                      color: THEME_CONSTANTS.colors.textMuted
                    }}
                  >
                    Available for campaigns.
                  </p>
                </div>
              </Col>
            </Row>
          </Card>

          {/* METRIC CARDS */}
          <Row gutter={[16, 16]} style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl }}>
            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  border: 'none',
                  boxShadow: THEME_CONSTANTS.shadow.base,
                  height: '100%'
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: THEME_CONSTANTS.spacing.md,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: THEME_CONSTANTS.typography.caption.size,
                        textTransform: 'uppercase',
                        color: THEME_CONSTANTS.colors.textMuted,
                        fontWeight: THEME_CONSTANTS.typography.label.weight,
                        margin: 0,
                        marginBottom: THEME_CONSTANTS.spacing.sm,
                      }}
                    >
                      Total Campaigns
                    </p>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '30px',
                        fontWeight: THEME_CONSTANTS.typography.h1.weight,
                        color: THEME_CONSTANTS.colors.text,
                      }}
                    >
                      {loading ? '-' : stats.totalCampaigns}
                    </h3>
                  </div>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: THEME_CONSTANTS.radius.md,
                      background: THEME_CONSTANTS.colors.primaryLight,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: THEME_CONSTANTS.colors.primary,
                      fontSize: '20px',
                      flexShrink: 0
                    }}
                  >
                    <MessageOutlined />
                  </div>
                </div>
                {/* <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: THEME_CONSTANTS.spacing.xs,
                    fontSize: THEME_CONSTANTS.typography.bodySmall.size,
                    color: THEME_CONSTANTS.colors.success,
                    fontWeight: THEME_CONSTANTS.typography.label.weight,
                  }}
                >
                  <ArrowUpOutlined /> {loading ? '-' : stats.totalCampaigns > 0 ? `${Math.max(0, stats.totalCampaigns - (stats.totalCampaigns - 2))} new this month` : 'No new campaigns'}
                </div> */}
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  border: 'none',
                  boxShadow: THEME_CONSTANTS.shadow.base,
                  height: '100%'
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: THEME_CONSTANTS.spacing.md,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: THEME_CONSTANTS.typography.caption.size,
                        textTransform: 'uppercase',
                        color: THEME_CONSTANTS.colors.textMuted,
                        fontWeight: THEME_CONSTANTS.typography.label.weight,
                        margin: 0,
                        marginBottom: THEME_CONSTANTS.spacing.sm,
                      }}
                    >
                      Total Templates
                    </p>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '30px',
                        fontWeight: THEME_CONSTANTS.typography.h1.weight,
                        color: THEME_CONSTANTS.colors.text,
                      }}
                    >
                      {loading ? '-' : stats.sendtoteltemplet}
                    </h3>
                  </div>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: THEME_CONSTANTS.radius.md,
                      background: '#e0e7ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4f46e5',
                      fontSize: '20px',
                      flexShrink: 0
                    }}
                  >
                    <FileTextOutlined />
                  </div>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: THEME_CONSTANTS.typography.bodySmall.size,
                    color: THEME_CONSTANTS.colors.textMuted
                  }}
                >
                  Ready to use.
                </p>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  border: 'none',
                  boxShadow: THEME_CONSTANTS.shadow.base,
                  height: '100%'
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: THEME_CONSTANTS.spacing.md,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: THEME_CONSTANTS.typography.caption.size,
                        textTransform: 'uppercase',
                        color: THEME_CONSTANTS.colors.textMuted,
                        fontWeight: THEME_CONSTANTS.typography.label.weight,
                        margin: 0,
                        marginBottom: THEME_CONSTANTS.spacing.sm,
                      }}
                    >
                      Total Messages
                    </p>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '30px',
                        fontWeight: THEME_CONSTANTS.typography.h1.weight,
                        color: THEME_CONSTANTS.colors.text,
                      }}
                    >
                      {loading ? '-' : (stats.totalMessages / 1000).toFixed(1)}K
                    </h3>
                  </div>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: THEME_CONSTANTS.radius.md,
                      background: THEME_CONSTANTS.colors.successLight,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: THEME_CONSTANTS.colors.success,
                      fontSize: '20px',
                      flexShrink: 0
                    }}
                  >
                    <SendOutlined />
                  </div>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: THEME_CONSTANTS.typography.bodySmall.size,
                    color: THEME_CONSTANTS.colors.textMuted
                  }}
                >
                  Sent successfully.
                </p>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  border: 'none',
                  boxShadow: THEME_CONSTANTS.shadow.base,
                  height: '100%'
                }}
                bodyStyle={{ padding: '20px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: THEME_CONSTANTS.spacing.md,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: THEME_CONSTANTS.typography.caption.size,
                        textTransform: 'uppercase',
                        color: THEME_CONSTANTS.colors.textMuted,
                        fontWeight: THEME_CONSTANTS.typography.label.weight,
                        margin: 0,
                        marginBottom: THEME_CONSTANTS.spacing.sm,
                      }}
                    >
                      Success Rate
                    </p>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '30px',
                        fontWeight: THEME_CONSTANTS.typography.h1.weight,
                        color: THEME_CONSTANTS.colors.text,
                      }}
                    >
                      {loading ? '-' : (() => {
                        const totalSent = stats.totalSuccessCount + stats.totalFailedCount;
                        return totalSent > 0 ? ((stats.totalSuccessCount / totalSent) * 100).toFixed(1) : 0;
                      })()}%
                    </h3>
                  </div>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: THEME_CONSTANTS.radius.md,
                      background: THEME_CONSTANTS.colors.warningLight,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: THEME_CONSTANTS.colors.warning,
                      fontSize: '20px',
                      flexShrink: 0
                    }}
                  >
                    <ThunderboltOutlined />
                  </div>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: THEME_CONSTANTS.typography.bodySmall.size,
                    color: THEME_CONSTANTS.colors.success,
                    fontWeight: THEME_CONSTANTS.typography.label.weight,
                  }}
                >
                  {loading ? 'Loading...' : (() => {
                    const totalSent = stats.totalSuccessCount + stats.totalFailedCount;
                    const successRate = totalSent > 0 ? ((stats.totalSuccessCount / totalSent) * 100) : 0;
                    return successRate >= 90 ? 'Excellent performance.' : totalSent > 0 ? 'Good performance.' : 'No data yet.';
                  })()}
                </p>
              </Card>
            </Col>
          </Row>

          {/* DELIVERY & QUICK STATS */}
          <Row gutter={[16, 16]} style={{ marginBottom: THEME_CONSTANTS.spacing.xxxl }}>
            <Col xs={24} lg={12}>
              <Card
                style={{
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  border: 'none',
                  boxShadow: THEME_CONSTANTS.shadow.base,
                  height: '100%',
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <h3
                  style={{
                    margin: `0 0 ${THEME_CONSTANTS.spacing.lg}`,
                    fontSize: THEME_CONSTANTS.typography.h5.size,
                    fontWeight: THEME_CONSTANTS.typography.h5.weight,
                    color: THEME_CONSTANTS.colors.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: THEME_CONSTANTS.spacing.sm,
                  }}
                >
                  <CheckCircleOutlined style={{ color: THEME_CONSTANTS.colors.success }} />
                  Delivery Summary
                </h3>
                <Space
                  direction="vertical"
                  style={{ width: '100%' }}
                  size="large"
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: THEME_CONSTANTS.spacing.sm,
                        flexWrap: 'wrap',
                        gap: THEME_CONSTANTS.spacing.xs
                      }}
                    >
                      <span
                        style={{
                          color: THEME_CONSTANTS.colors.textMuted,
                          fontWeight: THEME_CONSTANTS.typography.label.weight,
                          fontSize: THEME_CONSTANTS.typography.body.size,
                        }}
                      >
                        Messages Delivered
                      </span>
                      <span
                        style={{
                          color: THEME_CONSTANTS.colors.success,
                          fontWeight: THEME_CONSTANTS.typography.h6.weight,
                          fontSize: THEME_CONSTANTS.typography.body.size,
                        }}
                      >
                        {loading ? '-' : stats.totalSuccessCount}
                      </span>
                    </div>
                    <Progress
                      percent={loading ? 0 : (() => {
                        const totalSent = stats.totalSuccessCount + stats.totalFailedCount;
                        return totalSent > 0 ? Math.round((stats.totalSuccessCount / totalSent) * 100) : 0;
                      })()}
                      strokeColor={THEME_CONSTANTS.colors.success}
                    />
                  </div>

                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: THEME_CONSTANTS.spacing.sm,
                        flexWrap: 'wrap',
                        gap: THEME_CONSTANTS.spacing.xs
                      }}
                    >
                      <span
                        style={{
                          color: THEME_CONSTANTS.colors.textMuted,
                          fontWeight: THEME_CONSTANTS.typography.label.weight,
                          fontSize: THEME_CONSTANTS.typography.body.size,
                        }}
                      >
                        Messages Failed
                      </span>
                      <span
                        style={{
                          color: THEME_CONSTANTS.colors.danger,
                          fontWeight: THEME_CONSTANTS.typography.h6.weight,
                          fontSize: THEME_CONSTANTS.typography.body.size,
                        }}
                      >
                        {loading ? '-' : stats.totalFailedCount}
                      </span>
                    </div>
                    <Progress
                      percent={loading ? 0 : (() => {
                        const totalSent = stats.totalSuccessCount + stats.totalFailedCount;
                        return totalSent > 0 ? Math.round((stats.totalFailedCount / totalSent) * 100) : 0;
                      })()}
                      strokeColor={THEME_CONSTANTS.colors.danger}
                    />
                  </div>

                  <div
                    style={{
                      padding: THEME_CONSTANTS.spacing.lg,
                      borderRadius: THEME_CONSTANTS.radius.md,
                      border: `1px solid ${THEME_CONSTANTS.colors.primaryLight}`,
                      background: THEME_CONSTANTS.colors.primaryLight,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: THEME_CONSTANTS.typography.body.size,
                        color: THEME_CONSTANTS.colors.textSecondary,
                      }}
                    >
                      <CheckCircleOutlined
                        style={{ color: THEME_CONSTANTS.colors.success, marginRight: THEME_CONSTANTS.spacing.sm }}
                      />
                      Overall Success Rate:{' '}
                      <span
                        style={{
                          fontWeight: THEME_CONSTANTS.typography.h6.weight,
                          color: THEME_CONSTANTS.colors.success,
                        }}
                      >
                        {loading ? '-' : (() => {
                          const totalSent = stats.totalSuccessCount + stats.totalFailedCount;
                          return totalSent > 0 ? ((stats.totalSuccessCount / totalSent) * 100).toFixed(1) : 0;
                        })()}%
                      </span>
                    </p>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                style={{
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  border: 'none',
                  boxShadow: THEME_CONSTANTS.shadow.base,
                  height: '100%',
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <h3
                  style={{
                    margin: `0 0 ${THEME_CONSTANTS.spacing.lg}`,
                    fontSize: THEME_CONSTANTS.typography.h5.size,
                    fontWeight: THEME_CONSTANTS.typography.h5.weight,
                    color: THEME_CONSTANTS.colors.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: THEME_CONSTANTS.spacing.sm,
                  }}
                >
                  <BarChartOutlined style={{ color: THEME_CONSTANTS.colors.primary }} />
                  Quick Stats
                </h3>
                <Space
                  direction="vertical"
                  style={{ width: '100%' }}
                  size="middle"
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: THEME_CONSTANTS.spacing.md,
                      borderRadius: THEME_CONSTANTS.radius.md,
                      background: THEME_CONSTANTS.colors.background,
                      flexWrap: 'wrap',
                      gap: THEME_CONSTANTS.spacing.sm
                    }}
                  >
                    <span
                      style={{
                        color: THEME_CONSTANTS.colors.textMuted,
                        fontWeight: THEME_CONSTANTS.typography.label.weight,
                      }}
                    >
                      Total Sent
                    </span>
                    <span
                      style={{
                        fontSize: THEME_CONSTANTS.typography.h4.size,
                        fontWeight: THEME_CONSTANTS.typography.h4.weight,
                        color: THEME_CONSTANTS.colors.text,
                      }}
                    >
                      {loading ? '-' : stats.totalMessages}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: THEME_CONSTANTS.spacing.md,
                      borderRadius: THEME_CONSTANTS.radius.md,
                      background: THEME_CONSTANTS.colors.successLight,
                      border: `1px solid ${THEME_CONSTANTS.colors.success}`,
                      flexWrap: 'wrap',
                      gap: THEME_CONSTANTS.spacing.sm
                    }}
                  >
                    <span
                      style={{
                        color: THEME_CONSTANTS.colors.success,
                        fontWeight: THEME_CONSTANTS.typography.label.weight,
                      }}
                    >
                      Successfully Delivered
                    </span>
                    <span
                      style={{
                        fontSize: THEME_CONSTANTS.typography.h4.size,
                        fontWeight: THEME_CONSTANTS.typography.h4.weight,
                        color: THEME_CONSTANTS.colors.success,
                      }}
                    >
                      {loading ? '-' : stats.totalSuccessCount}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: THEME_CONSTANTS.spacing.md,
                      borderRadius: THEME_CONSTANTS.radius.md,
                      background: THEME_CONSTANTS.colors.dangerLight,
                      border: `1px solid ${THEME_CONSTANTS.colors.danger}`,
                      flexWrap: 'wrap',
                      gap: THEME_CONSTANTS.spacing.sm
                    }}
                  >
                    <span
                      style={{
                        color: THEME_CONSTANTS.colors.danger,
                        fontWeight: THEME_CONSTANTS.typography.label.weight,
                      }}
                    >
                      Failed
                    </span>
                    <span
                      style={{
                        fontSize: THEME_CONSTANTS.typography.h4.size,
                        fontWeight: THEME_CONSTANTS.typography.h4.weight,
                        color: THEME_CONSTANTS.colors.danger,
                      }}
                    >
                      {loading ? '-' : stats.totalFailedCount}
                    </span>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* RECENT CAMPAIGNS */}
          <Card
            style={{
              marginBottom: THEME_CONSTANTS.spacing.xxxl,
              borderRadius: THEME_CONSTANTS.radius.lg,
              border: 'none',
              boxShadow: THEME_CONSTANTS.shadow.base,
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: THEME_CONSTANTS.spacing.lg,
                flexWrap: 'wrap',
                gap: THEME_CONSTANTS.spacing.md
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: THEME_CONSTANTS.typography.h5.size,
                  fontWeight: THEME_CONSTANTS.typography.h5.weight,
                  color: THEME_CONSTANTS.colors.text,
                }}
              >
                Recent Campaigns
              </h3>
              <Button
                type="primary"
                onClick={() => navigate('/reports')}
                style={{
                  background: THEME_CONSTANTS.colors.primary,
                  border: 'none',
                  fontWeight: THEME_CONSTANTS.typography.label.weight,
                  borderRadius: THEME_CONSTANTS.radius.md,
                  height: '40px'
                }}
              >
                View All Reports
              </Button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
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
                  <p style={{ marginTop: '16px', fontSize: '14px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}>
                    Loading campaign data...
                  </p>
                </div>
              ) : messageReports.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
                  <MessageOutlined style={{ fontSize: '48px', color: `${THEME_CONSTANTS.colors.textSecondary}40`, marginBottom: '16px' }} />
                  <p style={{ fontSize: '16px', fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, margin: 0 }}>
                    No recent campaigns found
                  </p>
                  <p style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, margin: '8px 0 0 0' }}>
                    Your campaigns will appear here
                  </p>
                </div>
              ) : (
                <Table
                  columns={messageColumns}
                  dataSource={messageReports.slice(0, 5)}
                  rowKey="_id"
                  pagination={{ pageSize: 5 }}
                  style={{ borderCollapse: 'collapse' }}
                  scroll={{ x: 800 }}
                />
              )}
            </div>
          </Card>

          {/* PROFILE & QUICK ACTIONS */}
          {/* <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                style={{
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                  boxShadow: THEME_CONSTANTS.shadow.md,
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <Avatar
                    size={64}
                    icon={<UserOutlined />}
                    style={{
                      background: THEME_CONSTANTS.colors.primary,
                      fontSize: '32px',
                      margin: '0 auto 12px auto',
                    }}
                  />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: THEME_CONSTANTS.colors.textPrimary, margin: 0 }}>
                    {userProfile.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, margin: '4px 0 0 0' }}>
                    {userProfile.plan} Plan
                  </p>
                </div>

                <Divider style={{ margin: '16px 0' }} />

                <Space direction="vertical" style={{ width: '100%' }} size={0}>
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600, margin: 0, marginBottom: '4px' }}>
                      EMAIL
                    </p>
                    <p style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textPrimary, fontWeight: 600, margin: 0 }}>
                      {userProfile.email}
                    </p>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600, margin: 0, marginBottom: '4px' }}>
                      PHONE
                    </p>
                    <p style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textPrimary, fontWeight: 600, margin: 0 }}>
                      {userProfile.phone}
                    </p>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600, margin: 0, marginBottom: '4px' }}>
                      JOINED DATE
                    </p>
                    <p style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textPrimary, fontWeight: 600, margin: 0 }}>
                      {userProfile.joinedDate}
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: '11px', color: THEME_CONSTANTS.colors.textSecondary, fontWeight: 600, margin: 0, marginBottom: '4px' }}>
                      ACCOUNT STATUS
                    </p>
                    <Tag color="green" style={{ fontWeight: 600 }}>
                      Total
                    </Tag>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row> */}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      {/* Add Money Modal */}
      <Modal
        title={
          <div style={{ fontSize: '18px', fontWeight: 700, color: THEME_CONSTANTS.colors.textPrimary }}>
            Add Money to Wallet
          </div>
        }
        open={showAddMoney}
        onCancel={() => setShowAddMoney(false)}
        footer={null}
        bodyStyle={{ padding: '24px' }}
      >
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, marginBottom: '8px', display: 'block' }}>
            Amount (₹)
          </label>
          <InputNumber
            value={addAmount}
            onChange={setAddAmount}
            placeholder="Enter amount"
            style={{ width: '100%' }}
            min={0}
            prefix="₹"
            size="large"
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary, marginBottom: '12px' }}>
            Quick Select
          </p>
          <Row gutter={[12, 12]}>
            {[100, 500, 1000].map((amount) => (
              <Col xs={8} key={amount}>
                <Button
                  block
                  onClick={() => setAddAmount(amount)}
                  style={{
                    border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
                    color: THEME_CONSTANTS.colors.primary,
                  }}
                >
                  ₹{amount}
                </Button>
              </Col>
            ))}
          </Row>
        </div>

        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => setShowAddMoney(false)}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleAddMoney}
            disabled={!addAmount || Number.parseFloat(addAmount) <= 0}
            style={{ background: THEME_CONSTANTS.colors.primary }}
          >
            Add Money
          </Button>
        </Space>
      </Modal>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
