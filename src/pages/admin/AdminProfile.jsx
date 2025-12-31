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
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { THEME_CONSTANTS } from '../../theme';
import apiService from '../../helper/apiClient';

const { useBreakpoint } = Grid;

const AdminProfile = () => {
  const { user, updateUser } = useAuth();
  const screens = useBreakpoint();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleEditProfile = async (values) => {
    setLoading(true);
    try {
      const response = await apiService.updateProfile(values);
      if (response.success) {
        message.success('Profile updated successfully!');
        updateUser(response.user);
        setEditModalVisible(false);
        form.resetFields();
      }
    } catch (error) {
      message.error('Failed to update profile');
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
                        Admin Profile 👤
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
                </Row>
              </Col>
            </Row>
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal
      <Modal
        title="Edit Profile"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
        style={{ borderRadius: THEME_CONSTANTS.radius.lg }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditProfile}
          style={{ marginTop: THEME_CONSTANTS.spacing.lg }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: 'Please enter your name' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter your full name"
                  style={{ borderRadius: THEME_CONSTANTS.radius.md }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Enter your email"
                  style={{ borderRadius: THEME_CONSTANTS.radius.md }}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[{ required: true, message: 'Please enter your phone number' }]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="Enter your phone number"
                  style={{ borderRadius: THEME_CONSTANTS.radius.md }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setEditModalVisible(false);
                  form.resetFields();
                }}
                style={{ borderRadius: THEME_CONSTANTS.radius.md }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                style={{ borderRadius: THEME_CONSTANTS.radius.md }}
              >
                Save Changes
              </Button>
            </Space>
          </div>
        </Form>
      </Modal> */}

      {/* Change Password Modal
      <Modal
        title="Change Password"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
        width={500}
        style={{ borderRadius: THEME_CONSTANTS.radius.lg }}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          style={{ marginTop: THEME_CONSTANTS.spacing.lg }}
        >
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter current password"
              style={{ borderRadius: THEME_CONSTANTS.radius.md }}
            />
          </Form.Item>
          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: 'Please enter new password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password
              prefix={<KeyOutlined />}
              placeholder="Enter new password"
              style={{ borderRadius: THEME_CONSTANTS.radius.md }}
            />
          </Form.Item>
          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<KeyOutlined />}
              placeholder="Confirm new password"
              style={{ borderRadius: THEME_CONSTANTS.radius.md }}
            />
          </Form.Item>
          <Divider />
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setPasswordModalVisible(false);
                  passwordForm.resetFields();
                }}
                style={{ borderRadius: THEME_CONSTANTS.radius.md }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                style={{ borderRadius: THEME_CONSTANTS.radius.md }}
              >
                Change Password
              </Button>
            </Space>
          </div>
        </Form>
      </Modal> */}
    </>
  );
};

export default AdminProfile;
