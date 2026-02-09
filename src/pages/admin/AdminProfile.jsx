import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Avatar,
  Button,
  Form,
  Input,
  Modal,
  message,
  Breadcrumb,
  Space,
  Divider,
  Tag,
  Grid,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  KeyOutlined,
  SaveOutlined,
  LockOutlined,
  IdcardOutlined,
  CrownOutlined,
  SafetyOutlined,
  BarcodeOutlined,
  ScanOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { THEME_CONSTANTS } from '../../theme';
import apiService from '../../helper/apiClient';

const { useBreakpoint } = Grid;

const AdminProfile = () => {
  const { user, refreshUser } = useAuth();
  const screens = useBreakpoint();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [mfaModalVisible, setMfaModalVisible] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaToken, setMfaToken] = useState('');
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState('');
  const [disabling2FA, setDisabling2FA] = useState(false);

  const handleEditProfile = async (values) => {
    setLoading(true);
    try {
      const response = await apiService.updateProfile(values);
      if (response.data.success) {
        message.success('Profile updated successfully!');
        await refreshUser();
        setEditModalVisible(false);
        form.resetFields();
      } else {
        message.error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    setLoading(true);
    try {
      const response = await apiService.changePassword(values);
      if (response.success) {
        message.success('Password changed successfully!');
        setPasswordModalVisible(false);
        passwordForm.resetFields();
      }
    } catch (error) {
      message.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    setLoading(true);
    try {
      const response = await apiService.setup2FA();
      console.log("Handle 2FA setup response",response);
      if (response.data.success) {
        setMfaSetupData(response.data);
        setMfaModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to initiate 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!mfaToken || mfaToken.length !== 6) {
      message.error('Please enter a valid 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const response = await apiService.verify2FA(mfaToken);
      if (response.data.success) {
        message.success('2FA enabled successfully!');
        setMfaModalVisible(false);
        setMfaSetupData(null);
        setMfaToken('');
        // Refresh user data to update 2FA status
        try {
          await refreshUser();
        } catch (e) {
          console.error('Error refreshing profile after 2FA activation:', e);
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = () => {
    setShowDisable2FAModal(true);
    setDisable2FAPassword('');
  };

  const confirmDisable2FA = async () => {
    if (!disable2FAPassword) {
      message.error('Please enter your password to disable 2FA');
      return;
    }

    setDisabling2FA(true);
    try {
      const response = await apiService.disable2FA(disable2FAPassword);
      if (response.data.success) {
        message.success('2FA disabled successfully');
        setShowDisable2FAModal(false);
        await refreshUser();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to disable 2FA. Please check your password.');
    } finally {
      setDisabling2FA(false);
    }
  };

  const openEditModal = () => {
    form.setFieldsValue({
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
    });
    setEditModalVisible(true);
  };

  const InfoCard = ({ icon: Icon, title, value, color, bgColor }) => (
    <Card
      style={{
        borderRadius: THEME_CONSTANTS.radius.lg,
        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
        boxShadow: THEME_CONSTANTS.shadow.sm,
        height: '100%',
        transition: `all ${THEME_CONSTANTS.transition.normal}`,
      }}
      bodyStyle={{ padding: THEME_CONSTANTS.spacing.xl }}
      hoverable
    >
      <Space direction="vertical" style={{ width: '100%' }} size={THEME_CONSTANTS.spacing.md}>
        <div style={{ display: 'flex', alignItems: 'center', gap: THEME_CONSTANTS.spacing.md }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: THEME_CONSTANTS.radius.lg,
              background: bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
              fontSize: 18,
            }}
          >
            <Icon />
          </div>
          <div>
            <div
              style={{
                fontSize: 'clamp(11px, 2vw, 12px)',
                color: THEME_CONSTANTS.colors.textSecondary,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 'clamp(13px, 2.5vw, 14px)',
                fontWeight: 600,
                color: THEME_CONSTANTS.colors.text,
                marginTop: THEME_CONSTANTS.spacing.xs,
              }}
            >
              {value || 'Not provided'}
            </div>
          </div>
        </div>
      </Space>
    </Card>
  );

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
                  Profile
                </span>
              </Breadcrumb.Item>
            </Breadcrumb>

            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col xs={24} lg={18}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={6} md={4} lg={3}>
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
                  <Col xs={24} sm={18} md={20} lg={21}>
                    <div style={{ textAlign: window.innerWidth <= 576 ? 'center' : 'left' }}>
                      <h1 style={{
                        fontSize: 'clamp(24px, 4vw, 32px)',
                        fontWeight: THEME_CONSTANTS.typography.h1.weight,
                        color: THEME_CONSTANTS.colors.text,
                        marginBottom: THEME_CONSTANTS.spacing.sm,
                        lineHeight: THEME_CONSTANTS.typography.h1.lineHeight
                      }}>
                        Admin Profile
                      </h1>
                      <p style={{
                        color: THEME_CONSTANTS.colors.textSecondary,
                        fontSize: 'clamp(13px, 2.5vw, 14px)',
                        fontWeight: 500,
                        lineHeight: THEME_CONSTANTS.typography.body.lineHeight,
                        margin: 0
                      }}>
                        Manage your account settings and personal information
                      </p>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          </div>

          {/* Profile Card */}
          <Card
            style={{
              borderRadius: THEME_CONSTANTS.radius.lg,
              boxShadow: THEME_CONSTANTS.shadow.sm,
              marginBottom: THEME_CONSTANTS.spacing.xxl,
            }}
            bodyStyle={{ padding: THEME_CONSTANTS.spacing.xxxl }}
          >
            <Row gutter={[THEME_CONSTANTS.spacing.xl, THEME_CONSTANTS.spacing.xl]} align="middle">
              <Col xs={24} md={8} style={{ textAlign: 'center' }}>
                <Avatar
                  size={window.innerWidth <= 576 ? 80 : 120}
                  style={{
                    background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary}, ${THEME_CONSTANTS.colors.primaryDark})`,
                    fontSize: window.innerWidth <= 576 ? '32px' : '48px',
                    fontWeight: 700,
                    boxShadow: THEME_CONSTANTS.shadow.lg,
                    marginBottom: THEME_CONSTANTS.spacing.lg,
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </Avatar>
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{
                    fontSize: 'clamp(18px, 3vw, 24px)',
                    fontWeight: THEME_CONSTANTS.typography.h3.weight,
                    color: THEME_CONSTANTS.colors.text,
                    margin: 0,
                    marginBottom: THEME_CONSTANTS.spacing.sm,
                  }}>
                    {user?.name || 'Admin User'}
                  </h2>
                  <Tag
                    icon={<CrownOutlined />}
                    color={THEME_CONSTANTS.colors.primaryLight}
                    style={{
                      color: THEME_CONSTANTS.colors.primary,
                      border: `1px solid ${THEME_CONSTANTS.colors.primary}`,
                      fontWeight: 600,
                      padding: '4px 16px',
                      borderRadius: THEME_CONSTANTS.radius.lg,
                      fontSize: 'clamp(11px, 2vw, 12px)',
                    }}
                  >
                    {user?.role?.toUpperCase() || 'ADMINISTRATOR'}
                  </Tag>
                </div>
              </Col>
              <Col xs={24} md={16}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <InfoCard
                      icon={MailOutlined}
                      title="Email Address"
                      value={user?.email}
                      color={THEME_CONSTANTS.colors.primary}
                      bgColor={THEME_CONSTANTS.colors.primaryLight}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <InfoCard
                      icon={PhoneOutlined}
                      title="Phone Number"
                      value={user?.phone}
                      color={THEME_CONSTANTS.colors.success}
                      bgColor={THEME_CONSTANTS.colors.successLight}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <InfoCard
                      icon={IdcardOutlined}
                      title="User ID"
                      value={user?._id?.slice(-8)?.toUpperCase()}
                      color={THEME_CONSTANTS.colors.warning}
                      bgColor={THEME_CONSTANTS.colors.warningLight}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <InfoCard
                      icon={UserOutlined}
                      title="Account Status"
                      value={user?.status === 'active' ? 'Active' : 'Inactive'}
                      color={user?.status === 'active' ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.danger}
                      bgColor={user?.status === 'active' ? THEME_CONSTANTS.colors.successLight : THEME_CONSTANTS.colors.dangerLight}
                    />
                  </Col>
                  <Col xs={24}>
                    <Card
                      style={{
                        borderRadius: THEME_CONSTANTS.radius.lg,
                        border: `1px solid ${THEME_CONSTANTS.colors.border}`,
                        background: user?.twoFactorEnabled ? THEME_CONSTANTS.colors.successLight + '20' : THEME_CONSTANTS.colors.warningLight + '20',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: user?.twoFactorEnabled ? THEME_CONSTANTS.colors.success : THEME_CONSTANTS.colors.warning,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: 20
                          }}>
                            <SafetyOutlined />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '16px', color: THEME_CONSTANTS.colors.text }}>
                              Two-Factor Authentication (2FA)
                            </div>
                            <div style={{ color: THEME_CONSTANTS.colors.textSecondary }}>
                              {user?.twoFactorEnabled
                                ? 'Your account is secured with 2FA.'
                                : 'Add an extra layer of security to your account.'}
                            </div>
                          </div>
                        </div>
                        {user?.twoFactorEnabled ? (
                          <Button
                            danger
                            onClick={handleDisable2FA}
                            style={{ borderRadius: THEME_CONSTANTS.radius.md }}
                          >
                            Disable 2FA
                          </Button>
                        ) : (
                          <Button
                            type="primary"
                            icon={<ScanOutlined />}
                            onClick={handleSetup2FA}
                            loading={loading}
                            style={{ borderRadius: THEME_CONSTANTS.radius.md }}
                          >
                            Setup 2FA
                          </Button>
                        )}
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>
        </div>
      </div>

      
      {/* 2FA Setup Modal */}
      <Modal
        title="Setup Two-Factor Authentication"
        open={mfaModalVisible}
        onCancel={() => setMfaModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setMfaModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="verify"
            type="primary"
            loading={loading}
            onClick={handleVerify2FA}
          >
            Verify & Enable
          </Button>
        ]}
        width={400}
        centered
      >
        <div style={{ textAlign: 'center' }}>
          <p>Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).</p>
          {mfaSetupData?.qrCode && (
            <div style={{ background: 'white', padding: '16px', display: 'inline-block', borderRadius: '8px', marginBottom: '16px', border: `1px solid ${THEME_CONSTANTS.colors.border}` }}>
              <img src={mfaSetupData.qrCode} alt="2FA QR Code" style={{ width: '200px', height: '200px' }} />
            </div>
          )}
          <div style={{ marginBottom: '16px' }}>
            <Text type="secondary">Unable to scan? Use this secret key:</Text>
            <div style={{ fontWeight: 'bold', letterSpacing: '2px', marginTop: '4px' }}>
              {mfaSetupData?.secret}
            </div>
          </div>
          <Divider />
          <div style={{ textAlign: 'left' }}>
            <Text strong>Enter 6-digit verification code:</Text>
            <Input
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              size="large"
              style={{ marginTop: '8px', textAlign: 'center', letterSpacing: '4px', fontSize: '20px' }}
            />
          </div>
        </div>
      </Modal>

      {/* Disable 2FA Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SafetyOutlined style={{ color: THEME_CONSTANTS.colors.danger }} />
            Disable Two-Factor Authentication
          </div>
        }
        open={showDisable2FAModal}
        onCancel={() => setShowDisable2FAModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowDisable2FAModal(false)}>
            Cancel
          </Button>,
          <Button
            key="disable"
            type="primary"
            danger
            loading={disabling2FA}
            onClick={confirmDisable2FA}
          >
            Disable 2FA
          </Button>
        ]}
        width={400}
        centered
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 20px auto',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: THEME_CONSTANTS.colors.dangerLight,
            color: THEME_CONSTANTS.colors.danger
          }}>
            <SafetyOutlined style={{ fontSize: '32px' }} />
          </div>

          <h3 style={{ marginBottom: '12px', fontWeight: 700 }}>Confirm Security Downgrade</h3>

          <p style={{ color: THEME_CONSTANTS.colors.textSecondary, marginBottom: '24px' }}>
            For your security, please enter your password to disable Two-Factor Authentication.
          </p>

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>Your Password:</div>
            <Input.Password
              value={disable2FAPassword}
              onChange={(e) => setDisable2FAPassword(e.target.value)}
              placeholder="Enter your password"
              size="large"
              prefix={<LockOutlined style={{ color: THEME_CONSTANTS.colors.textMuted }} />}
              onPressEnter={confirmDisable2FA}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AdminProfile;
