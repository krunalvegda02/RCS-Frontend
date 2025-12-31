import { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Input, 
  Modal, 
  Table, 
  Statistic, 
  Avatar, 
  Form, 
  Space, 
  Tag, 
  Divider, 
  Alert,
  Breadcrumb,
  Layout,
  Typography,
  InputNumber,
  Progress,
  Grid
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  PhoneOutlined,
  MailOutlined,
  BankOutlined,
  HomeOutlined,
  DollarOutlined,
  TrophyOutlined,
  SendOutlined,
  WalletOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { THEME_CONSTANTS } from '../theme';
import apiService from '../helper/apiClient';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const screens = useBreakpoint();
  const [form] = Form.useForm();
  const [walletBalance, setWalletBalance] = useState(0);
  const [addAmount, setAddAmount] = useState('');
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [userStats, setUserStats] = useState({ messagesSent: 0, totalSpent: 0 });
  const [transactions, setTransactions] = useState([]);
  const [transactionSummary, setTransactionSummary] = useState({ totalCredit: 0, totalDebit: 0, currentBalance: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '', phone: '', companyname: '' });
  const [updating, setUpdating] = useState(false);


  useEffect(() => {
    const interval = setInterval(() => {
      refreshUser();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshUser]);


  useEffect(() => {
    fetchUserStats();
  }, [user]);

   const styles = {
    card: {
      borderRadius: '16px',
      border: 'none',
      boxShadow: THEME_CONSTANTS.shadow.base,
      background: THEME_CONSTANTS.colors.surface,
      overflow: 'hidden',
      position: 'relative',
    },
    headerBg: {
      height: '120px',
      background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight} 0%, ${THEME_CONSTANTS.colors.primary} 100%)`,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 0,
    },
    content: {
      position: 'relative',
      zIndex: 1,
      padding: '0 32px 32px 32px',
      marginTop: '60px',
    },
    avatarContainer: {
      padding: '4px',
      background: THEME_CONSTANTS.colors.surface,
      borderRadius: '50%',
      display: 'inline-block',
      boxShadow: THEME_CONSTANTS.shadow.md,
    },
    avatar: {
      backgroundColor: THEME_CONSTANTS.colors.primaryLight,
      color: THEME_CONSTANTS.colors.primary,
      border: `1px solid ${THEME_CONSTANTS.colors.primary}20`,
    },
    infoItem: {
      background: THEME_CONSTANTS.colors.background,
      borderRadius: THEME_CONSTANTS.radius.lg,
      padding: THEME_CONSTANTS.spacing.lg,
      border: `1px solid ${THEME_CONSTANTS.colors.border}`,
      transition: 'all 0.3s ease',
      height: '100%',
    },
    iconWrapper: {
      width: '40px',
      height: '40px',
      borderRadius: THEME_CONSTANTS.radius.md,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      marginBottom: THEME_CONSTANTS.spacing.md,
    },
    label: {
      fontSize: THEME_CONSTANTS.typography.caption.size,
      textTransform: 'uppercase',
      color: THEME_CONSTANTS.colors.textMuted,
      fontWeight: THEME_CONSTANTS.typography.label.weight,
      letterSpacing: '0.5px',
      marginBottom: '4px',
      display: 'block',
    },
    value: {
      fontSize: THEME_CONSTANTS.typography.body.size,
      fontWeight: THEME_CONSTANTS.typography.h6.weight,
      color: THEME_CONSTANTS.colors.text,
      wordBreak: 'break-all',
    }
  };

  const fetchUserStats = async () => {
    if (user?._id) {
      try {
        const [messagesData, profileData] = await Promise.all([
          apiService.getUserMessages(user._id),
          apiService.getProfileWithTransactions(user._id, 10)
        ]);
        
        if (messagesData.success) {
          const messages = messagesData.messages;
          const totalMessages = messages.reduce((sum, msg) => sum + (msg.phoneNumbers?.length || 0), 0);
          const totalSpent = messages.reduce((sum, msg) => sum + (msg.cost || 0), 0);
          setUserStats({ messagesSent: totalMessages, totalSpent });
        }
        
        if (profileData.success) {
          setTransactions(profileData.profile.recentTransactions || []);
          setTransactionSummary(profileData.profile.transactionSummary || { totalCredit: 0, totalDebit: 0, currentBalance: 0 });
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    }
  };


  const handleAddMoney = async () => {
    if (addAmount && parseFloat(addAmount) > 0) {
      try {
        const data = await apiService.addWalletRequest({
          amount: parseFloat(addAmount),
          userId: user._id
        });
        
        if (data.success) {
          setResultData({ 
            success: true, 
            message: `Wallet recharge request of ₹${addAmount} submitted for admin approval!` 
          });
          setAddAmount('');
          setShowAddMoney(false);
          refreshUser();
        } else {
          setResultData({ success: false, message: 'Failed to submit request: ' + data.message });
        }
        setShowResultModal(true);
      } catch (error) {
        setResultData({ success: false, message: 'Error submitting request: ' + error.message });
        setShowResultModal(true);
      }
    }
  };


  const handleEditProfile = () => {
    setIsEditing(true);
    setEditData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      companyname: user.companyname || ''
    });
  };


  const handleCancelEdit = () => {
    setIsEditing(false);
  };


  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const response = await apiService.updateProfile(user._id, editData);
      
      if (response.success) {
        setResultData({ success: true, message: 'Profile updated successfully!' });
        setIsEditing(false);
        await refreshUser();
      } else {
        setResultData({ success: false, message: response.message || 'Failed to update profile' });
      }
      setShowResultModal(true);
    } catch (error) {
      setResultData({ success: false, message: 'Error updating profile: ' + error.message });
      setShowResultModal(true);
    } finally {
      setUpdating(false);
    }
  };


  const transactionColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => (
        <Tag 
          color={type === 'credit' ? 'green' : 'red'}
          style={{
            borderRadius: '6px',
            fontWeight: 600,
            textTransform: 'capitalize',
            border: 'none',
            padding: '4px 12px',
            fontSize: '12px'
          }}
        >
          {type}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount, record) => (
        <Text 
          style={{ 
            fontWeight: 700,
            color: record.type === 'credit' ? '#22c55e' : '#ef4444',
            fontSize: '14px'
          }}
        >
          {record.type === 'credit' ? '+' : '-'}₹{amount}
        </Text>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => (
        <Text style={{ color: '#666', fontSize: '14px' }}>{text}</Text>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => (
        <Text style={{ fontSize: '13px', color: '#999' }}>
          {new Date(date).toLocaleString()}
        </Text>
      ),
    },
  ];


  return (
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
                Profile
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
                    <UserOutlined style={{
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
                      User Profile 👤
                    </h1>
                    <p style={{
                      color: THEME_CONSTANTS.colors.textSecondary,
                      fontSize: THEME_CONSTANTS.typography.body.size,
                      fontWeight: 500,
                      lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                      margin: 0
                    }}>
                      Manage your account settings and view transaction history.
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
                    onClick={async () => {
                      setRefreshing(true);
                      await refreshUser();
                      await fetchUserStats();
                      setRefreshing(false);
                    }}
                    loading={refreshing}
                    style={{
                      fontWeight: THEME_CONSTANTS.typography.label.weight,
                      borderRadius: THEME_CONSTANTS.radius.md,
                    }}
                  >
                    Refresh
                  </Button>
                </Space>
              </div>
            </Col>
          </Row>
        </div>


        {/* ============ PROFILE CARD ============ */}
        <Card style={styles.card} bodyStyle={{ padding: 0 }}>
      {/* Decorative Header Background */}
      <div style={styles.headerBg} />

      <div style={styles.content}>
        <Row gutter={[32, 24]} align="middle">
          
          {/* Left Column: Avatar & Main Info */}
          <Col xs={24} md={8} lg={6} style={{ textAlign: 'center' }}>
            <div style={styles.avatarContainer}>
              <Avatar
                size={140}
                src={user?.avatar}
                icon={<UserOutlined />}
                style={styles.avatar}
              />
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <Title level={3} style={{ marginBottom: '4px', color: '#1f1f1f' }}>
                {user?.name || 'User Name'}
              </Title>
              <Tag 
                style={{
                  borderRadius: THEME_CONSTANTS.radius.lg,
                  padding: '4px 12px',
                  margin: 0,
                  background: THEME_CONSTANTS.colors.primaryLight,
                  color: THEME_CONSTANTS.colors.primary,
                  border: `1px solid ${THEME_CONSTANTS.colors.primary}`,
                  fontWeight: THEME_CONSTANTS.typography.label.weight
                }}
              >
                {user?.role || 'Admin User'}
              </Tag>
            </div>
            
            <div style={{ marginTop: '24px' }}>
               {!isEditing ? (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={handleEditProfile}
                    block
                    size="large"
                    style={{
                      borderRadius: THEME_CONSTANTS.radius.md,
                      height: '48px',
                      background: THEME_CONSTANTS.colors.primary,
                      borderColor: THEME_CONSTANTS.colors.primary,
                      boxShadow: THEME_CONSTANTS.shadow.md,
                      fontWeight: THEME_CONSTANTS.typography.label.weight
                    }}
                  >
                    Edit Profile
                  </Button>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleUpdateProfile}
                    loading={updating}
                    block
                    size="large"
                    style={{
                      background: THEME_CONSTANTS.colors.success,
                      borderColor: THEME_CONSTANTS.colors.success,
                      borderRadius: THEME_CONSTANTS.radius.md,
                      height: '48px',
                      fontWeight: THEME_CONSTANTS.typography.label.weight
                    }}
                  >
                    Save Changes
                  </Button>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={handleCancelEdit}
                    block
                    size="large"
                    style={{ 
                      borderRadius: THEME_CONSTANTS.radius.md, 
                      height: '48px',
                      fontWeight: THEME_CONSTANTS.typography.label.weight
                    }}
                  >
                    Cancel
                  </Button>
                </Space>
              )}
            </div>
          </Col>

          {/* Right Column: Details Grid */}
          <Col xs={24} md={16} lg={18}>
            {!isEditing ? (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <div style={styles.infoItem}>
                    <div style={{ ...styles.iconWrapper, background: THEME_CONSTANTS.colors.primaryLight, color: THEME_CONSTANTS.colors.primary }}>
                      <MailOutlined />
                    </div>
                    <span style={styles.label}>Email Address</span>
                    <Text style={styles.value}>{user?.email || 'Not set'}</Text>
                  </div>
                </Col>
                
                <Col xs={24} sm={12}>
                  <div style={styles.infoItem}>
                    <div style={{ ...styles.iconWrapper, background: THEME_CONSTANTS.colors.successLight, color: THEME_CONSTANTS.colors.success }}>
                      <PhoneOutlined />
                    </div>
                    <span style={styles.label}>Phone Number</span>
                    <Text style={styles.value}>{user?.phone || 'Not set'}</Text>
                  </div>
                </Col>

                <Col xs={24}>
                  <div style={styles.infoItem}>
                    <div style={{ ...styles.iconWrapper, background: THEME_CONSTANTS.colors.warningLight, color: THEME_CONSTANTS.colors.warning }}>
                      <BankOutlined />
                    </div>
                    <span style={styles.label}>Company Information</span>
                    <Text style={styles.value}>{user?.companyname || 'Company Name Not Set'}</Text>
                    <div style={{ marginTop: '8px', fontSize: '13px', color: THEME_CONSTANTS.colors.textMuted }}>
                      Account ID: <Text code>{user?._id || user?.id || '...'}</Text>
                    </div>
                  </div>
                </Col>
              </Row>
            ) : (
              <div style={{ 
                background: THEME_CONSTANTS.colors.background, 
                padding: THEME_CONSTANTS.spacing.xl, 
                borderRadius: THEME_CONSTANTS.radius.lg,
                border: `1px solid ${THEME_CONSTANTS.colors.border}`
              }}>
                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <EditOutlined style={{ color: '#1890ff' }} />
                  <Text strong style={{ fontSize: '16px' }}>Edit Profile Information</Text>
                </div>
                
                <Form layout="vertical">
                  <Row gutter={[24, 0]}>
                    <Col xs={24} md={12}>
                      <Form.Item label="Full Name">
                        <Input
                          size="large"
                          value={editData.name}
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                          style={{ borderRadius: '8px' }}
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} md={12}>
                      <Form.Item label="Email Address">
                        <Input
                          size="large"
                          value={editData.email}
                          onChange={(e) => setEditData({...editData, email: e.target.value})}
                          prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                          style={{ borderRadius: '8px' }}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item label="Phone Number">
                        <Input
                          size="large"
                          value={editData.phone}
                          onChange={(e) => setEditData({...editData, phone: e.target.value})}
                          prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
                          style={{ borderRadius: '8px' }}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item label="Company Name">
                        <Input
                          size="large"
                          value={editData.companyname}
                          onChange={(e) => setEditData({...editData, companyname: e.target.value})}
                          prefix={<BankOutlined style={{ color: '#bfbfbf' }} />}
                          style={{ borderRadius: '8px' }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </div>
            )}
          </Col>
        </Row>
      </div>
    </Card>


        {/* ============ WALLET CARD (UNCHANGED) ============ */}
        <Card
          style={{
            marginTop: '32px',
            marginBottom: '32px',
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            position: 'relative',
            overflow: 'hidden',
            background: `linear-gradient(135deg, #eff6ff 0%, #f5f3ff 50%, #eef2ff 100%)`,
          }}
          bodyStyle={{ padding: '32px' }}
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
                    marginBottom: '8px',
                    color: '#999',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Wallet Balance
                </p>
                <h2
                  style={{
                    margin: 0,
                    marginBottom: '8px',
                    fontSize: '40px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #1d4ed8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  ₹{user?.Wallet?.toFixed(2) || '0.00'}
                </h2>
                <p 
                  style={{ 
                    margin: 0, 
                    color: '#666', 
                    fontSize: '15px',
                    fontWeight: 500
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
                      fontWeight: 600,
                      background: '#2563eb',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '15px'
                    }}
                  >
                    Add Money
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
          <Row gutter={[24, 16]} style={{ marginTop: '32px' }}>
            <Col xs={24} sm={12}>
              <div>
                <p
                  style={{
                    margin: 0,
                    marginBottom: '8px',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    color: '#999',
                  }}
                >
                  Total Spent
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '8px',
                    marginBottom: '8px',
                    flexWrap: 'wrap'
                  }}
                >
                  <span
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#1a1a1a',
                    }}
                  >
                    ₹{userStats.totalSpent || 0}
                  </span>
                  <span 
                    style={{ 
                      fontSize: '13px', 
                      color: '#999' 
                    }}
                  >
                    of ₹{user?.Wallet?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    background: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${user?.Wallet && userStats.totalSpent ? Math.min(100, Math.round((userStats.totalSpent / user.Wallet) * 100)) : 0}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)`,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <p
                  style={{
                    margin: 0,
                    marginBottom: '8px',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    color: '#999',
                  }}
                >
                  Remaining Balance
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#22c55e',
                    }}
                  >
                    ₹{((user?.Wallet || 0) - (userStats.totalSpent || 0)).toFixed(2)}
                  </span>
                </div>
                <p 
                  style={{ 
                    margin: 0, 
                    fontSize: '13px', 
                    color: '#999' 
                  }}
                >
                  Available for campaigns.
                </p>
              </div>
            </Col>
          </Row>
        </Card>


        {/* ============ STATISTICS CARDS ============ */}
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                height: '100%',
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ padding: '24px', textAlign: 'center' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ 
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <DollarOutlined style={{ fontSize: '28px', color: 'white' }} />
              </div>
              <Statistic
                title={<span style={{ color: '#999', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Total Credit</span>}
                value={transactionSummary.totalCredit}
                prefix="₹"
                valueStyle={{ 
                  color: '#22c55e',
                  fontSize: '28px',
                  fontWeight: 700
                }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                height: '100%',
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ padding: '24px', textAlign: 'center' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ 
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <SendOutlined style={{ fontSize: '28px', color: 'white' }} />
              </div>
              <Statistic
                title={<span style={{ color: '#999', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Total Spent</span>}
                value={userStats.totalSpent}
                prefix="₹"
                valueStyle={{ 
                  color: '#ef4444',
                  fontSize: '28px',
                  fontWeight: 700
                }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                height: '100%',
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ padding: '24px', textAlign: 'center' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ 
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <TrophyOutlined style={{ fontSize: '28px', color: 'white' }} />
              </div>
              <Statistic
                title={<span style={{ color: '#999', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Messages Sent</span>}
                value={userStats.messagesSent}
                valueStyle={{ 
                  color: '#2563eb',
                  fontSize: '28px',
                  fontWeight: 700
                }}
              />
            </Card>
          </Col>
        </Row>


        {/* ============ TRANSACTIONS TABLE ============ */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
              <CreditCardOutlined style={{ color: '#2563eb', fontSize: '18px' }} />
              <span style={{ color: '#1a1a1a', fontWeight: 700, fontSize: '16px' }}>
                Recent Transactions
              </span>
            </div>
          }
          style={{
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
          }}
          bodyStyle={{ padding: '0' }}
        >
          <Table
            columns={transactionColumns}
            dataSource={transactions}
            rowKey={(record, index) => index}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showQuickJumper: true,
              style: { padding: '16px 24px' }
            }}
            locale={{
              emptyText: (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <CreditCardOutlined style={{ 
                    fontSize: '52px', 
                    color: '#e6e6e6',
                    marginBottom: '16px',
                    display: 'block'
                  }} />
                  <Text style={{ color: '#999', fontSize: '15px' }}>
                    No transactions found
                  </Text>
                </div>
              )
            }}
            style={{ borderRadius: '0 0 12px 12px' }}
          />
        </Card>


        {/* ============ ADD MONEY MODAL ============ */}
        <Modal
          title={
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a' }}>
              Add Money to Wallet
            </div>
          }
          open={showAddMoney}
          onCancel={() => setShowAddMoney(false)}
          footer={null}
          bodyStyle={{ padding: '32px' }}
          closable={true}
          style={{ borderRadius: '12px' }}
        >
          <div style={{ marginBottom: '28px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '12px', display: 'block' }}>
              Amount (₹)
            </label>
            <Input
              type="number"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Enter amount"
              prefix="₹"
              size="large"
              style={{ 
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                borderColor: '#e6e6e6'
              }}
              min={0}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '12px' }}>
              Quick Select
            </p>
            <Row gutter={[12, 12]}>
              {[100, 500, 1000].map((amount) => (
                <Col xs={8} key={amount}>
                  <Button
                    block
                    onClick={() => setAddAmount(amount.toString())}
                    style={{
                      height: '44px',
                      border: '1px solid #e6e6e6',
                      color: '#2563eb',
                      fontWeight: 600,
                      borderRadius: '8px',
                      fontSize: '15px'
                    }}
                  >
                    ₹{amount}
                  </Button>
                </Col>
              ))}
            </Row>
          </div>

          <Space style={{ width: '100%', justifyContent: 'flex-end', gap: '12px' }}>
            <Button 
              onClick={() => setShowAddMoney(false)}
              style={{
                height: '44px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '15px'
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleAddMoney}
              disabled={!addAmount || parseFloat(addAmount) <= 0}
              style={{ 
                // background: '#2563eb',
                height: '44px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '15px'
              }}
            >
              Add Money
            </Button>
          </Space>
        </Modal>


        {/* ============ RESULT MODAL ============ */}
        <Modal
          open={showResultModal}
          onCancel={() => setShowResultModal(false)}
          footer={null}
          centered
          style={{ borderRadius: '12px' }}
          bodyStyle={{ padding: '48px 32px' }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '72px',
              height: '72px',
              margin: '0 auto 24px auto',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: resultData?.success 
                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: resultData?.success
                ? '0 8px 24px rgba(34, 197, 94, 0.3)'
                : '0 8px 24px rgba(239, 68, 68, 0.3)'
            }}>
              {resultData?.success ? (
                <CheckCircleOutlined style={{ fontSize: '36px', color: 'white' }} />
              ) : (
                <CloseCircleOutlined style={{ fontSize: '36px', color: 'white' }} />
              )}
            </div>
            
            <Title level={3} style={{ 
              color: resultData?.success ? '#22c55e' : '#ef4444',
              marginBottom: '12px',
              fontSize: '20px'
            }}>
              {resultData?.success ? 'Success!' : 'Error!'}
            </Title>
            
            <Text style={{ 
              color: '#666',
              fontSize: '15px',
              marginBottom: '32px',
              display: 'block',
              lineHeight: '1.6'
            }}>
              {resultData?.message}
            </Text>
            
            <Button
              type="primary"
              onClick={() => setShowResultModal(false)}
              style={{
                background: resultData?.success ? '#22c55e' : '#ef4444',
                borderColor: resultData?.success ? '#22c55e' : '#ef4444',
                borderRadius: '8px',
                height: '44px',
                minWidth: '140px',
                fontWeight: 600,
                fontSize: '15px'
              }}
            >
              Close
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
};


export default Profile;