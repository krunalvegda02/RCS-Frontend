import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
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
  Breadcrumb,
  Typography,
  Grid,
  Divider
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
  LockOutlined,
  SafetyOutlined,
  BarcodeOutlined,
  ScanOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { THEME_CONSTANTS } from '../theme';
import apiService from '../helper/apiClient';
import { updatePassword as updatePasswordAction } from '../redux/slices/authSlice';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const dispatch = useDispatch();
  const screens = useBreakpoint();
  const [addAmount, setAddAmount] = useState('');
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [userStats, setUserStats] = useState({ messagesSent: 0, totalSpent: 0 });
  const [transactions, setTransactions] = useState([]);
  const [transactionSummary, setTransactionSummary] = useState({ totalCredit: 0, totalDebit: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '', phone: '', companyname: '' });
  const [updating, setUpdating] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [mfaModalVisible, setMfaModalVisible] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaToken, setMfaToken] = useState('');
  const [loading2FA, setLoading2FA] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState('');
  const [disabling2FA, setDisabling2FA] = useState(false);


  useEffect(() => {
    const interval = setInterval(() => {
      refreshUser();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshUser]);


  useEffect(() => {
    fetchUserStats();
  }, [user]);

  // 🔹 UI ENHANCED PROFILE (LOGIC UNCHANGED)

  const styles = {
    page: {
      background: THEME_CONSTANTS.colors.background,
      minHeight: '100vh',
    },

    container: {
      maxWidth: THEME_CONSTANTS.layout.maxContentWidth,
      margin: '0 auto',
      padding: THEME_CONSTANTS.spacing.xxxl,
    },

    card: {
      borderRadius: '20px',
      border: 'none',
      background: THEME_CONSTANTS.colors.surface,
      boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
      overflow: 'hidden',
    },

    headerBg: {
      height: '140px',
      background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primaryLight} 0%, ${THEME_CONSTANTS.colors.primary} 100%)`,
    },

    content: {
      padding: '0 40px 40px',
      marginTop: '-70px',
    },

    avatarWrap: {
      background: 'rgba(255,255,255,0.9)',
      padding: '6px',
      borderRadius: '50%',
      boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
      display: 'inline-block',
    },

    avatar: {
      background: THEME_CONSTANTS.colors.primaryLight,
      color: THEME_CONSTANTS.colors.primary,
      border: `2px solid ${THEME_CONSTANTS.colors.primary}`,
    },

    sectionTitle: {
      fontSize: '18px',
      fontWeight: 700,
      marginBottom: '20px',
      color: THEME_CONSTANTS.colors.text,
    },

    infoCard: {
      background: THEME_CONSTANTS.colors.background,
      borderRadius: '14px',
      padding: '20px',
      border: `1px solid ${THEME_CONSTANTS.colors.border}`,
      height: '100%',
      transition: 'all .25s ease',
    },

    infoIcon: {
      width: 42,
      height: 42,
      borderRadius: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      fontSize: 18,
    },

    label: {
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      color: THEME_CONSTANTS.colors.textMuted,
      fontWeight: 600,
    },

    value: {
      fontSize: '15px',
      fontWeight: 600,
      color: THEME_CONSTANTS.colors.text,
      marginTop: 4,
      wordBreak: 'break-word',
    },

    actionBtn: {
      height: 48,
      borderRadius: 12,
      fontWeight: 600,
      fontSize: 15,
    },
  };


  const fetchUserStats = async () => {
    // Stats fetching removed - not needed for profile page
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
      const response = await apiService.updateProfile(editData);

      if (response.data.success) {
        setResultData({ success: true, message: 'Profile updated successfully!' });
        setIsEditing(false);
        await refreshUser();
      } else {
        setResultData({ success: false, message: response.data.message || 'Failed to update profile' });
      }
      setShowResultModal(true);
    } catch (error) {
      setResultData({ success: false, message: 'Error updating profile: ' + error.message });
      setShowResultModal(true);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setResultData({ success: false, message: 'All password fields are required' });
      setShowResultModal(true);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setResultData({ success: false, message: 'New passwords do not match' });
      setShowResultModal(true);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setResultData({ success: false, message: 'Password must be at least 6 characters' });
      setShowResultModal(true);
      return;
    }

    try {
      setUpdatingPassword(true);
      console.log('Sending password update with:', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      await dispatch(updatePasswordAction({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })).unwrap();

      setResultData({ success: true, message: 'Password updated successfully!' });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowResultModal(true);
    } catch (error) {
      console.log('Password update error:', error);
      setResultData({ success: false, message: error || 'Failed to update password' });
      setShowResultModal(true);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSetup2FA = async () => {
    setLoading2FA(true);
    try {
      const response = await apiService.setup2FA();
      if (response.data.success) {
        setMfaSetupData(response.data);
        setMfaModalVisible(true);
      }
    } catch (error) {
      setResultData({ success: false, message: 'Failed to initiate 2FA setup' });
      setShowResultModal(true);
    } finally {
      setLoading2FA(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!mfaToken || mfaToken.length !== 6) {
      setResultData({ success: false, message: 'Please enter a valid 6-digit code' });
      setShowResultModal(true);
      return;
    }
    setLoading2FA(true);
    try {
      const response = await apiService.verify2FA(mfaToken);
      if (response.data.success) {
        setResultData({ success: true, message: '2FA enabled successfully!' });
        setShowResultModal(true);
        setMfaModalVisible(false);
        setMfaSetupData(null);
        setMfaToken('');
        await refreshUser();
      }
    } catch (error) {
      setResultData({ success: false, message: error.response?.data?.message || 'Verification failed' });
      setShowResultModal(true);
    } finally {
      setLoading2FA(false);
    }
  };

  const handleDisable2FA = () => {
    setShowDisable2FAModal(true);
    setDisable2FAPassword('');
  };

  const confirmDisable2FA = async () => {
    if (!disable2FAPassword) {
      setResultData({ success: false, message: 'Please enter your password to disable 2FA' });
      setShowResultModal(true);
      return;
    }

    setDisabling2FA(true);
    try {
      const response = await apiService.disable2FA(disable2FAPassword);
      if (response.data.success) {
        setResultData({ success: true, message: '2FA disabled successfully' });
        setShowResultModal(true);
        setShowDisable2FAModal(false);
        await refreshUser();
      }
    } catch (error) {
      setResultData({
        success: false,
        message: error.response?.data?.message || 'Failed to disable 2FA. Please check your password.'
      });
      setShowResultModal(true);
    } finally {
      setDisabling2FA(false);
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
          {record.type === 'credit' ? '+' : '-'}{amount} Credits
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
                      User Profile
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

          </Row>
        </div>


        <div style={styles.page}>
          <div style={styles.container}>

            {/* PROFILE CARD */}
            <Card style={styles.card} bodyStyle={{ padding: 0 }}>
              <div style={styles.headerBg} />

              <div style={styles.content}>
                <Row gutter={[40, 32]} align="middle">

                  {/* LEFT */}
                  <Col xs={24} md={7} style={{ textAlign: 'center' }}>
                    <div style={styles.avatarWrap}>
                      <Avatar
                        size={140}
                        src={user?.avatar}
                        icon={<UserOutlined />}
                        style={styles.avatar}
                      />
                    </div>

                    <Title level={3} style={{ marginTop: 16 }}>
                      {user?.name}
                    </Title>

                    <Tag color="blue" style={{ padding: '6px 18px', borderRadius: 10 }}>
                      {user?.role?.toUpperCase()}
                    </Tag>

                    <Space direction="vertical" style={{ width: '100%', marginTop: 32 }} size="middle">
                      {!isEditing ? (
                        <>
                          <Button
                            type="primary"
                            icon={<EditOutlined />}
                            block
                            style={styles.actionBtn}
                            onClick={handleEditProfile}
                          >
                            Edit Profile
                          </Button>

                          <Button
                            icon={<LockOutlined />}
                            block
                            style={styles.actionBtn}
                            onClick={() => setShowPasswordModal(true)}
                          >
                            Change Password
                          </Button>

                          {user?.twoFactorEnabled ? (
                            <Button
                              danger
                              icon={<SafetyOutlined />}
                              block
                              style={styles.actionBtn}
                              onClick={handleDisable2FA}
                            >
                              Disable 2FA
                            </Button>
                          ) : (
                            <Button
                              type="dashed"
                              icon={<SafetyOutlined />}
                              block
                              style={styles.actionBtn}
                              onClick={handleSetup2FA}
                              loading={loading2FA}
                            >
                              Enable 2FA
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            block
                            loading={updating}
                            style={{ ...styles.actionBtn, background: THEME_CONSTANTS.colors.success }}
                            onClick={handleUpdateProfile}
                          >
                            Save Changes
                          </Button>
                          <Button
                            block
                            icon={<CloseOutlined />}
                            style={styles.actionBtn}
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </Space>
                  </Col>

                  {/* RIGHT */}
                  <Col xs={24} md={17}>
                    {!isEditing ? (
                      <Row gutter={[20, 20]}>
                        <Col xs={24} sm={12}>
                          <div style={styles.infoCard}>
                            <div style={{ ...styles.infoIcon, background: '#e0f2fe', color: '#0284c7' }}>
                              <MailOutlined />
                            </div>
                            <div style={styles.label}>Email</div>
                            <div style={styles.value}>{user?.email}</div>
                          </div>
                        </Col>

                        <Col xs={24} sm={12}>
                          <div style={styles.infoCard}>
                            <div style={{ ...styles.infoIcon, background: '#dcfce7', color: '#16a34a' }}>
                              <PhoneOutlined />
                            </div>
                            <div style={styles.label}>Phone</div>
                            <div style={styles.value}>{user?.phone || 'Not set'}</div>
                          </div>
                        </Col>

                        <Col xs={24}>
                          <div style={styles.infoCard}>
                            <div style={{ ...styles.infoIcon, background: '#fef3c7', color: '#d97706' }}>
                              <BankOutlined />
                            </div>
                            <div style={styles.label}>Company</div>
                            <div style={styles.value}>{user?.companyname || 'Not set'}</div>
                          </div>
                        </Col>
                      </Row>
                    ) : (
                      <>

                        <Card
                          bordered
                          style={{
                            borderRadius: 16,
                            background: THEME_CONSTANTS.colors.surface,
                          }}
                        >
                          <Form layout="vertical">
                            <Row gutter={[20, 12]}>
                              <Col xs={24} sm={12}>
                                <Form.Item label="Full Name">
                                  <Input
                                    size="large"
                                    value={editData.name}
                                    onChange={(e) =>
                                      setEditData({ ...editData, name: e.target.value })
                                    }
                                    prefix={<UserOutlined />}
                                    placeholder="Enter full name"
                                  />
                                </Form.Item>
                              </Col>

                              <Col xs={24} sm={12}>
                                <Form.Item label="Email Address">
                                  <Input
                                    size="large"
                                    value={editData.email}
                                    onChange={(e) =>
                                      setEditData({ ...editData, email: e.target.value })
                                    }
                                    prefix={<MailOutlined />}
                                    placeholder="Enter email address"
                                  />
                                </Form.Item>
                              </Col>

                              <Col xs={24} sm={12}>
                                <Form.Item label="Phone Number">
                                  <Input
                                    size="large"
                                    value={editData.phone}
                                    onChange={(e) =>
                                      setEditData({ ...editData, phone: e.target.value })
                                    }
                                    prefix={<PhoneOutlined />}
                                    placeholder="Enter phone number"
                                  />
                                </Form.Item>
                              </Col>

                              <Col xs={24} sm={12}>
                                <Form.Item label="Company Name">
                                  <Input
                                    size="large"
                                    value={editData.companyname}
                                    onChange={(e) =>
                                      setEditData({ ...editData, companyname: e.target.value })
                                    }
                                    prefix={<BankOutlined />}
                                    placeholder="Enter company name"
                                  />
                                </Form.Item>
                              </Col>
                            </Row>
                          </Form>
                        </Card>
                      </>
                    )}
                  </Col>

                </Row>
              </div>
            </Card>

          </div>
        </div>




        {/* ============ CHANGE PASSWORD MODAL ============ */}
        <Modal
          open={showPasswordModal}
          onCancel={() => {
            setShowPasswordModal(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          }}
          footer={null}
          centered
          width={620}
          style={{ borderRadius: 16 }}
          bodyStyle={{ padding: '32px 32px 28px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              margin: '0 auto 16px',
              background: THEME_CONSTANTS.colors.primaryLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: THEME_CONSTANTS.colors.primary
            }}>
              <LockOutlined style={{ fontSize: 28 }} />
            </div>

            <Title level={4} style={{ marginBottom: 6 }}>
              Change Password
            </Title>
            <Text type="secondary">
              Use a strong password to keep your account secure.
            </Text>
          </div>

          <Form layout="vertical">
            <Form.Item label="Current Password">
              <Input.Password
                size="large"
                placeholder='Enter Your Old Password'
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                prefix={<LockOutlined />}
              />
            </Form.Item>

            <Form.Item label="New Password">
              <Input.Password
                size="large"
                placeholder='Enter Your New Password'
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                prefix={<LockOutlined />}
              />
            </Form.Item>

            <Form.Item label="Confirm Password">
              <Input.Password
                placeholder='Enter Your New Password'
                size="large"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                prefix={<LockOutlined />}
              />
            </Form.Item>

            <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 24 }}>
              <Button
                onClick={() => setShowPasswordModal(false)}
                style={{ height: 44, borderRadius: 10 }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                loading={updatingPassword}
                onClick={handleUpdatePassword}
                style={{ height: 44, borderRadius: 10 }}
              >
                Update Password
              </Button>
            </Space>
          </Form>
        </Modal>

        {/* ============ RESULT MODAL ============ */}
        <Modal
          open={showResultModal}
          onCancel={() => setShowResultModal(false)}
          footer={null}
          centered
          width={420}
          style={{ borderRadius: 16 }}
          bodyStyle={{ padding: '40px 32px' }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 72,
              height: 72,
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: resultData?.success
                ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                : 'linear-gradient(135deg,#ef4444,#dc2626)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              {resultData?.success ? (
                <CheckCircleOutlined style={{ fontSize: 34 }} />
              ) : (
                <CloseCircleOutlined style={{ fontSize: 34 }} />
              )}
            </div>

            <Title level={4} style={{ marginBottom: 8 }}>
              {resultData?.success ? 'Success' : 'Action Failed'}
            </Title>

            <Text type="secondary" style={{ fontSize: 15, lineHeight: 1.6 }}>
              {resultData?.message}
            </Text>

            <Button
              type="primary"
              onClick={() => setShowResultModal(false)}
              style={{
                marginTop: 28,
                height: 44,
                borderRadius: 10,
                background: resultData?.success
                  ? THEME_CONSTANTS.colors.success
                  : THEME_CONSTANTS.colors.danger,
                borderColor: 'transparent',
                minWidth: 140
              }}
            >
              Close
            </Button>
          </div>
        </Modal>

        {/* ============ 2FA SETUP MODAL ============ */}
        <Modal
          open={mfaModalVisible}
          onCancel={() => setMfaModalVisible(false)}
          centered
          width={500}
          style={{ borderRadius: 16 }}
          bodyStyle={{ padding: '32px 32px 24px' }}
          footer={[
            <Button
              key="cancel"
              onClick={() => setMfaModalVisible(false)}
              style={{
                height: 44,
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              Cancel
            </Button>,
            <Button
              key="verify"
              type="primary"
              loading={loading2FA}
              onClick={handleVerify2FA}
              style={{
                height: 44,
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              Verify & Enable
            </Button>,
          ]}
        >
          {/* HEADER */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                margin: '0 auto 14px',
                background: THEME_CONSTANTS.colors.warningLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: THEME_CONSTANTS.colors.warning,
              }}
            >
              <SafetyOutlined style={{ fontSize: 26 }} />
            </div>

            <Title level={4} style={{ marginBottom: 6 }}>
              Enable Two-Factor Authentication
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Secure your account with an extra verification step.
            </Text>
          </div>

          {/* STEPS */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ fontSize: 14 }}>
                Step 1: Install an Authenticator App
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>
                Use Google Authenticator or Authy from your app store.
              </Text>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ fontSize: 14 }}>
                Step 2: Scan the QR Code
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>
                Open the app, add a new account, and scan the code below.
              </Text>
            </div>

            <div>
              <Text strong style={{ fontSize: 14 }}>
                Step 3: Enter the 6-digit Code
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>
                Enter the verification code generated by the app.
              </Text>
            </div>
          </div>


          {/* QR CODE */}
          <div className="flex mx-auto w-full justify-center">
            {mfaSetupData?.qrCode && (
              <div
                style={{
                  textAlign: 'center',
                  padding: 16,
                  borderRadius: 14,
                  border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                  background: '#fff',
                  marginBottom: 20,
                }}
              >
                <img
                  src={mfaSetupData.qrCode}
                  alt="2FA QR Code"
                  style={{
                    width: 200,
                    height: 200,
                    margin: '0 auto',
                    display: 'block',
                  }}
                />
              </div>
            )}
          </div>


          {/* SECRET KEY */}
          <div
            style={{
              background: THEME_CONSTANTS.colors.background,
              padding: '12px 14px',
              borderRadius: 10,
              marginBottom: 20,
              border: `1px dashed ${THEME_CONSTANTS.colors.border}`,
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Unable to scan? Use this secret key:
            </Text>
            <div
              style={{
                marginTop: 6,
                fontWeight: 700,
                letterSpacing: 2,
                color: THEME_CONSTANTS.colors.primary,
                fontSize: 15,
                wordBreak: 'break-all',
              }}
            >
              {mfaSetupData?.secret}
            </div>
          </div>

          {/* CODE INPUT */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Verification Code
            </Text>
            <Input
              value={mfaToken}
              onChange={(e) =>
                setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="000000"
              size="large"
              style={{
                height: 56,
                borderRadius: 12,
                textAlign: 'center',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 4,
              }}
            />
          </div>
        </Modal>


        {/* ============ DISABLE 2FA MODAL ============ */}
        <Modal
          open={showDisable2FAModal}
          onCancel={() => setShowDisable2FAModal(false)}
          centered
          width={420}
          style={{ borderRadius: 16 }}
          footer={[
            <Button
              key="cancel"
              onClick={() => setShowDisable2FAModal(false)}
              style={{ height: 42, borderRadius: 10 }}
            >
              Cancel
            </Button>,
            <Button
              key="disable"
              type="primary"
              danger
              loading={disabling2FA}
              onClick={confirmDisable2FA}
              style={{ height: 42, borderRadius: 10 }}
            >
              Disable 2FA
            </Button>,
          ]}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: THEME_CONSTANTS.colors.dangerLight,
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: THEME_CONSTANTS.colors.danger
            }}>
              <SafetyOutlined style={{ fontSize: 30 }} />
            </div>

            <Title level={4}>Disable Two-Factor Authentication</Title>
            <Text type="secondary">
              This will reduce account security. Please confirm.
            </Text>
          </div>

          <Input.Password
            size="large"
            value={disable2FAPassword}
            onChange={(e) => setDisable2FAPassword(e.target.value)}
            placeholder="Enter your password"
            style={{ height: 48, borderRadius: 10 }}
          />
        </Modal>

      </div >
    </div >
  );
};


export default Profile;